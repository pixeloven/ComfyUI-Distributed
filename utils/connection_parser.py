"""
Connection string parser utility for ComfyUI-Distributed.

Handles parsing of various connection string formats into standardized host/port/protocol components.
"""
import re
from urllib.parse import urlparse
from typing import Dict, Optional, Tuple
from .logging import debug_log


class ConnectionParseError(Exception):
    """Raised when a connection string cannot be parsed."""
    pass


class ConnectionParser:
    """Parses connection strings into standardized components."""

    # Default ports for different protocols
    DEFAULT_PORTS = {
        'http': 80,
        'https': 443,
        'comfyui': 8188  # Default ComfyUI port
    }

    # Regex patterns for different connection formats
    PATTERNS = {
        # host:port format (e.g., "192.168.1.100:8190")
        'host_port': re.compile(r'^([^:]+):(\d+)$'),

        # host only format (e.g., "192.168.1.100", "localhost")
        'host_only': re.compile(r'^([^:/]+)$'),

        # IP address validation
        'ipv4': re.compile(r'^(\d{1,3}\.){3}\d{1,3}$'),

        # Domain/hostname validation
        'hostname': re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$')
    }

    @classmethod
    def parse(cls, connection_string: str) -> Dict[str, any]:
        """
        Parse a connection string into components.

        Args:
            connection_string: The connection string to parse

        Returns:
            Dict with keys: host, port, protocol, worker_type, is_secure, original

        Raises:
            ConnectionParseError: If the connection string is invalid
        """
        if not connection_string or not connection_string.strip():
            raise ConnectionParseError("Connection string cannot be empty")

        connection_string = connection_string.strip()
        debug_log(f"Parsing connection string: {connection_string}")

        # Try URL format first (http://, https://)
        if '://' in connection_string:
            return cls._parse_url(connection_string)

        # Try host:port format
        if ':' in connection_string:
            return cls._parse_host_port(connection_string)

        # Try host-only format
        return cls._parse_host_only(connection_string)

    @classmethod
    def _parse_url(cls, url: str) -> Dict[str, any]:
        """Parse a full URL format connection string."""
        try:
            parsed = urlparse(url)

            if not parsed.scheme:
                raise ConnectionParseError("URL must include protocol (http:// or https://)")

            if not parsed.hostname:
                raise ConnectionParseError("URL must include hostname")

            # Determine port
            port = parsed.port
            if port is None:
                port = cls.DEFAULT_PORTS.get(parsed.scheme)
                if port is None:
                    raise ConnectionParseError(f"Unknown protocol '{parsed.scheme}' and no port specified")

            # Determine worker type and security
            is_secure = parsed.scheme == 'https'
            worker_type = cls._determine_worker_type(parsed.hostname, port, is_secure)

            return {
                'host': parsed.hostname,
                'port': port,
                'protocol': parsed.scheme,
                'worker_type': worker_type,
                'is_secure': is_secure,
                'path': parsed.path or '/',
                'original': url
            }

        except Exception as e:
            raise ConnectionParseError(f"Invalid URL format: {str(e)}")

    @classmethod
    def _parse_host_port(cls, connection_string: str) -> Dict[str, any]:
        """Parse host:port format connection string."""
        match = cls.PATTERNS['host_port'].match(connection_string)
        if not match:
            raise ConnectionParseError("Invalid host:port format")

        host = match.group(1)
        try:
            port = int(match.group(2))
        except ValueError:
            raise ConnectionParseError("Port must be a valid number")

        if not (1 <= port <= 65535):
            raise ConnectionParseError("Port must be between 1 and 65535")

        cls._validate_hostname(host)

        # Determine protocol and worker type
        is_secure = port == 443
        protocol = 'https' if is_secure else 'http'
        worker_type = cls._determine_worker_type(host, port, is_secure)

        return {
            'host': host,
            'port': port,
            'protocol': protocol,
            'worker_type': worker_type,
            'is_secure': is_secure,
            'path': '/',
            'original': connection_string
        }

    @classmethod
    def _parse_host_only(cls, host: str) -> Dict[str, any]:
        """Parse host-only format connection string."""
        cls._validate_hostname(host)

        # Use default ComfyUI port for host-only format
        port = cls.DEFAULT_PORTS['comfyui']
        protocol = 'http'
        is_secure = False
        worker_type = cls._determine_worker_type(host, port, is_secure)

        return {
            'host': host,
            'port': port,
            'protocol': protocol,
            'worker_type': worker_type,
            'is_secure': is_secure,
            'path': '/',
            'original': host
        }

    @classmethod
    def _validate_hostname(cls, host: str) -> None:
        """Validate that a hostname is properly formatted."""
        if not host:
            raise ConnectionParseError("Host cannot be empty")

        # Check for localhost
        if host in ['localhost', '127.0.0.1']:
            return

        # Check IPv4 format
        if cls.PATTERNS['ipv4'].match(host):
            # Validate IP address ranges
            octets = host.split('.')
            for octet in octets:
                if not (0 <= int(octet) <= 255):
                    raise ConnectionParseError(f"Invalid IP address: {host}")
            return

        # Check hostname/domain format
        if not cls.PATTERNS['hostname'].match(host):
            raise ConnectionParseError(f"Invalid hostname format: {host}")

        # Additional hostname validation
        if len(host) > 253:
            raise ConnectionParseError("Hostname too long (max 253 characters)")

        if host.startswith('.') or host.endswith('.'):
            raise ConnectionParseError("Hostname cannot start or end with a dot")

    @classmethod
    def _determine_worker_type(cls, host: str, port: int, is_secure: bool) -> str:
        """Determine worker type based on host, port, and security."""
        # Check for localhost/local addresses
        if host in ['localhost', '127.0.0.1']:
            return 'local'

        # Check for private IP ranges (local network)
        if cls._is_private_ip(host):
            return 'remote'

        # Check for cloud worker indicators
        if is_secure or port == 443:
            return 'cloud'

        # Check for common cloud hostnames
        cloud_indicators = [
            'trycloudflare.com',
            'ngrok.io',
            'localhost.run',
            'serveo.net'
        ]

        for indicator in cloud_indicators:
            if indicator in host:
                return 'cloud'

        # Default to remote for external addresses
        return 'remote'

    @classmethod
    def _is_private_ip(cls, host: str) -> bool:
        """Check if an IP address is in a private range."""
        if not cls.PATTERNS['ipv4'].match(host):
            return False

        octets = [int(x) for x in host.split('.')]

        # Private IP ranges:
        # 10.0.0.0/8
        if octets[0] == 10:
            return True

        # 172.16.0.0/12
        if octets[0] == 172 and 16 <= octets[1] <= 31:
            return True

        # 192.168.0.0/16
        if octets[0] == 192 and octets[1] == 168:
            return True

        return False

    @classmethod
    def to_url(cls, parsed_connection: Dict[str, any]) -> str:
        """Convert parsed connection back to a URL string."""
        protocol = parsed_connection.get('protocol', 'http')
        host = parsed_connection['host']
        port = parsed_connection['port']
        path = parsed_connection.get('path', '/')

        # Don't include standard ports in URL
        if (protocol == 'http' and port == 80) or (protocol == 'https' and port == 443):
            return f"{protocol}://{host}{path}"
        else:
            return f"{protocol}://{host}:{port}{path}"

    @classmethod
    def to_legacy_format(cls, parsed_connection: Dict[str, any]) -> Tuple[str, int]:
        """Convert parsed connection to legacy (host, port) tuple."""
        return parsed_connection['host'], parsed_connection['port']


def parse_connection_string(connection_string: str) -> Dict[str, any]:
    """Convenience function to parse a connection string."""
    return ConnectionParser.parse(connection_string)


def validate_connection_string(connection_string: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a connection string without raising exceptions.

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        ConnectionParser.parse(connection_string)
        return True, None
    except ConnectionParseError as e:
        return False, str(e)