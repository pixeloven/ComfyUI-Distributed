"""
Unit tests for connection string parser.
"""
import unittest
import sys
import os

# Add the parent directory to the path so we can import the utils module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.connection_parser import ConnectionParser, ConnectionParseError, parse_connection_string, validate_connection_string


class TestConnectionParser(unittest.TestCase):
    """Test cases for ConnectionParser class."""

    def test_parse_url_http(self):
        """Test parsing HTTP URLs."""
        result = ConnectionParser.parse("http://192.168.1.100:8190")
        expected = {
            'host': '192.168.1.100',
            'port': 8190,
            'protocol': 'http',
            'worker_type': 'remote',
            'is_secure': False,
            'path': '/',
            'original': 'http://192.168.1.100:8190'
        }
        self.assertEqual(result, expected)

    def test_parse_url_https(self):
        """Test parsing HTTPS URLs."""
        result = ConnectionParser.parse("https://worker.trycloudflare.com")
        expected = {
            'host': 'worker.trycloudflare.com',
            'port': 443,
            'protocol': 'https',
            'worker_type': 'cloud',
            'is_secure': True,
            'path': '/',
            'original': 'https://worker.trycloudflare.com'
        }
        self.assertEqual(result, expected)

    def test_parse_url_with_port(self):
        """Test parsing HTTPS URL with explicit port."""
        result = ConnectionParser.parse("https://example.com:8443")
        expected = {
            'host': 'example.com',
            'port': 8443,
            'protocol': 'https',
            'worker_type': 'cloud',
            'is_secure': True,
            'path': '/',
            'original': 'https://example.com:8443'
        }
        self.assertEqual(result, expected)

    def test_parse_host_port(self):
        """Test parsing host:port format."""
        result = ConnectionParser.parse("192.168.1.100:8190")
        expected = {
            'host': '192.168.1.100',
            'port': 8190,
            'protocol': 'http',
            'worker_type': 'remote',
            'is_secure': False,
            'path': '/',
            'original': '192.168.1.100:8190'
        }
        self.assertEqual(result, expected)

    def test_parse_localhost_port(self):
        """Test parsing localhost with port."""
        result = ConnectionParser.parse("localhost:8191")
        expected = {
            'host': 'localhost',
            'port': 8191,
            'protocol': 'http',
            'worker_type': 'local',
            'is_secure': False,
            'path': '/',
            'original': 'localhost:8191'
        }
        self.assertEqual(result, expected)

    def test_parse_host_only(self):
        """Test parsing host-only format."""
        result = ConnectionParser.parse("192.168.1.100")
        expected = {
            'host': '192.168.1.100',
            'port': 8188,  # Default ComfyUI port
            'protocol': 'http',
            'worker_type': 'remote',
            'is_secure': False,
            'path': '/',
            'original': '192.168.1.100'
        }
        self.assertEqual(result, expected)

    def test_parse_localhost_only(self):
        """Test parsing localhost-only format."""
        result = ConnectionParser.parse("localhost")
        expected = {
            'host': 'localhost',
            'port': 8188,  # Default ComfyUI port
            'protocol': 'http',
            'worker_type': 'local',
            'is_secure': False,
            'path': '/',
            'original': 'localhost'
        }
        self.assertEqual(result, expected)

    def test_parse_port_443_cloud(self):
        """Test that port 443 is detected as cloud worker."""
        result = ConnectionParser.parse("example.com:443")
        self.assertEqual(result['worker_type'], 'cloud')
        self.assertTrue(result['is_secure'])
        self.assertEqual(result['protocol'], 'https')

    def test_worker_type_detection_local(self):
        """Test local worker type detection."""
        test_cases = [
            "localhost:8190",
            "127.0.0.1:8191",
            "http://localhost:8192"
        ]
        for case in test_cases:
            with self.subTest(case=case):
                result = ConnectionParser.parse(case)
                self.assertEqual(result['worker_type'], 'local')

    def test_worker_type_detection_remote(self):
        """Test remote worker type detection."""
        test_cases = [
            "192.168.1.100:8190",
            "10.0.0.5:8191",
            "172.16.1.10:8192"
        ]
        for case in test_cases:
            with self.subTest(case=case):
                result = ConnectionParser.parse(case)
                self.assertEqual(result['worker_type'], 'remote')

    def test_worker_type_detection_cloud(self):
        """Test cloud worker type detection."""
        test_cases = [
            "https://worker.trycloudflare.com",
            "example.com:443",
            "https://abc.ngrok.io",
            "worker.localhost.run:443"
        ]
        for case in test_cases:
            with self.subTest(case=case):
                result = ConnectionParser.parse(case)
                self.assertEqual(result['worker_type'], 'cloud')

    def test_private_ip_detection(self):
        """Test private IP address detection."""
        private_ips = [
            "10.0.0.1",
            "10.255.255.255",
            "172.16.0.1",
            "172.31.255.255",
            "192.168.0.1",
            "192.168.255.255"
        ]
        for ip in private_ips:
            with self.subTest(ip=ip):
                self.assertTrue(ConnectionParser._is_private_ip(ip))

    def test_public_ip_detection(self):
        """Test public IP address detection."""
        public_ips = [
            "8.8.8.8",
            "1.1.1.1",
            "173.0.0.1",  # Just outside 172.16-31 range
            "193.168.1.1"  # Just outside 192.168 range
        ]
        for ip in public_ips:
            with self.subTest(ip=ip):
                self.assertFalse(ConnectionParser._is_private_ip(ip))

    def test_invalid_connection_strings(self):
        """Test various invalid connection strings."""
        invalid_cases = [
            "",
            "   ",
            "invalid:port",
            "host:99999",  # Port too high
            "host:0",      # Port too low
            "http://",     # No host
            "://noprotocol.com",
            "256.256.256.256:8190",  # Invalid IP
            "host..domain.com:8190",  # Invalid hostname
        ]
        for case in invalid_cases:
            with self.subTest(case=case):
                with self.assertRaises(ConnectionParseError):
                    ConnectionParser.parse(case)

    def test_to_url(self):
        """Test converting parsed connection back to URL."""
        test_cases = [
            {
                'input': {'host': 'localhost', 'port': 8190, 'protocol': 'http', 'path': '/'},
                'expected': 'http://localhost:8190/'
            },
            {
                'input': {'host': 'example.com', 'port': 443, 'protocol': 'https', 'path': '/'},
                'expected': 'https://example.com/'  # Standard port omitted
            },
            {
                'input': {'host': 'example.com', 'port': 80, 'protocol': 'http', 'path': '/'},
                'expected': 'http://example.com/'  # Standard port omitted
            }
        ]
        for case in test_cases:
            with self.subTest(case=case['input']):
                result = ConnectionParser.to_url(case['input'])
                self.assertEqual(result, case['expected'])

    def test_to_legacy_format(self):
        """Test converting parsed connection to legacy format."""
        parsed = {
            'host': 'localhost',
            'port': 8190,
            'protocol': 'http'
        }
        host, port = ConnectionParser.to_legacy_format(parsed)
        self.assertEqual(host, 'localhost')
        self.assertEqual(port, 8190)

    def test_validate_connection_string_valid(self):
        """Test connection string validation with valid strings."""
        valid_cases = [
            "localhost:8190",
            "https://worker.trycloudflare.com",
            "192.168.1.100:8191"
        ]
        for case in valid_cases:
            with self.subTest(case=case):
                is_valid, error = validate_connection_string(case)
                self.assertTrue(is_valid)
                self.assertIsNone(error)

    def test_validate_connection_string_invalid(self):
        """Test connection string validation with invalid strings."""
        invalid_cases = [
            "",
            "invalid:port",
            "host:99999"
        ]
        for case in invalid_cases:
            with self.subTest(case=case):
                is_valid, error = validate_connection_string(case)
                self.assertFalse(is_valid)
                self.assertIsNotNone(error)

    def test_parse_connection_string_convenience(self):
        """Test the convenience function."""
        result = parse_connection_string("localhost:8190")
        self.assertEqual(result['host'], 'localhost')
        self.assertEqual(result['port'], 8190)

    def test_hostname_validation(self):
        """Test hostname validation edge cases."""
        # Valid hostnames
        valid_hostnames = [
            "localhost",
            "example.com",
            "sub.example.com",
            "test-server",
            "server1",
            "a.b.c.d.e"
        ]
        for hostname in valid_hostnames:
            with self.subTest(hostname=hostname):
                # Should not raise exception
                ConnectionParser._validate_hostname(hostname)

        # Invalid hostnames
        invalid_hostnames = [
            "",
            ".example.com",
            "example.com.",
            "ex..ample.com",
            "-example.com",
            "example-.com",
            "a" * 254  # Too long
        ]
        for hostname in invalid_hostnames:
            with self.subTest(hostname=hostname):
                with self.assertRaises(ConnectionParseError):
                    ConnectionParser._validate_hostname(hostname)

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Test with whitespace
        result = ConnectionParser.parse("  localhost:8190  ")
        self.assertEqual(result['host'], 'localhost')
        self.assertEqual(result['port'], 8190)

        # Test port boundaries
        result = ConnectionParser.parse("localhost:1")
        self.assertEqual(result['port'], 1)

        result = ConnectionParser.parse("localhost:65535")
        self.assertEqual(result['port'], 65535)

        # Test IPv4 boundaries
        result = ConnectionParser.parse("0.0.0.0:8190")
        self.assertEqual(result['host'], '0.0.0.0')

        result = ConnectionParser.parse("255.255.255.255:8190")
        self.assertEqual(result['host'], '255.255.255.255')


if __name__ == '__main__':
    unittest.main()