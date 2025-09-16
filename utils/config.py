"""
Configuration management for ComfyUI-Distributed.
"""
import os
import json
from typing import Dict, List, Optional, Tuple
from .logging import log, debug_log
from .connection_parser import ConnectionParser, ConnectionParseError

# Import defaults for timeout fallbacks
from .constants import HEARTBEAT_TIMEOUT

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "gpu_config.json")

def get_default_config():
    """Returns the default configuration dictionary. Single source of truth."""
    return {
        "master": {"host": ""},
        "workers": [],
        "settings": {
            "debug": False,
            "auto_launch_workers": False,
            "stop_workers_on_master_exit": True
        }
    }

def load_config():
    """Loads the config, falling back to defaults if the file is missing or invalid."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            log(f"Error loading config, using defaults: {e}")
    return get_default_config()

def save_config(config):
    """Saves the configuration to file."""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        log(f"Error saving config: {e}")
        return False

def ensure_config_exists():
    """Creates default config file if it doesn't exist. Used by __init__.py"""
    if not os.path.exists(CONFIG_FILE):
        default_config = get_default_config()
        if save_config(default_config):
            from .logging import debug_log
            debug_log("Created default config file")
        else:
            log("Could not create default config file")

def get_worker_timeout_seconds(default: int = HEARTBEAT_TIMEOUT) -> int:
    """Return the unified worker timeout (seconds).

    Priority:
    1) UI-configured setting `settings.worker_timeout_seconds`
    2) Fallback to provided `default` (defaults to HEARTBEAT_TIMEOUT which itself
       can be overridden via the COMFYUI_HEARTBEAT_TIMEOUT env var)

    This value should be used anywhere we consider a worker "timed out" from the
    master's perspective (e.g., collector waits, upscaler result collection).
    """
    try:
        cfg = load_config()
        val = int(cfg.get('settings', {}).get('worker_timeout_seconds', default))
        return max(1, val)
    except Exception:
        return max(1, int(default))


def normalize_worker_config(worker: Dict) -> Dict:
    """
    Normalize worker configuration to ensure all required fields are present.

    Handles both legacy (separate host/port) and new (connection string) formats.
    """
    normalized = worker.copy()

    # Generate ID if missing
    if 'id' not in normalized:
        normalized['id'] = str(len(load_config().get('workers', [])))

    # Handle connection string if present
    if 'connection' in worker and worker['connection']:
        try:
            parsed = ConnectionParser.parse(worker['connection'])
            normalized['host'] = parsed['host']
            normalized['port'] = parsed['port']
            normalized['type'] = parsed['worker_type']
            normalized['is_secure'] = parsed['is_secure']
            normalized['protocol'] = parsed['protocol']
            # Keep original connection string for reference
            normalized['connection'] = worker['connection']
        except ConnectionParseError as e:
            log(f"Error parsing connection string '{worker['connection']}': {e}")
            # Fall back to legacy format if parsing fails

    # Ensure required fields have defaults
    if 'host' not in normalized:
        normalized['host'] = 'localhost'
    if 'port' not in normalized:
        normalized['port'] = 8189
    if 'name' not in normalized:
        if normalized.get('type') == 'local':
            normalized['name'] = f"Local Worker {normalized['id']}"
        else:
            normalized['name'] = f"Worker {normalized['id']}"
    if 'enabled' not in normalized:
        normalized['enabled'] = True
    if 'type' not in normalized:
        # Auto-detect type if not specified
        normalized['type'] = _detect_worker_type(normalized['host'], normalized['port'])

    # Add connection string if not present (for backward compatibility)
    if 'connection' not in normalized:
        normalized['connection'] = _generate_connection_string(normalized)

    return normalized


def validate_worker_config(worker: Dict) -> Tuple[bool, Optional[str]]:
    """
    Validate a worker configuration.

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check required fields
        required_fields = ['name']
        for field in required_fields:
            if field not in worker or not worker[field]:
                return False, f"Missing required field: {field}"

        # Validate connection if present
        if 'connection' in worker and worker['connection']:
            try:
                ConnectionParser.parse(worker['connection'])
            except ConnectionParseError as e:
                return False, f"Invalid connection string: {e}"
        else:
            # Validate legacy host/port format
            host = worker.get('host', '')
            port = worker.get('port')

            if not host:
                return False, "Host is required"

            if not isinstance(port, int) or not (1 <= port <= 65535):
                return False, "Port must be a valid number between 1 and 65535"

        # Validate worker type
        valid_types = ['local', 'remote', 'cloud']
        worker_type = worker.get('type')
        if worker_type and worker_type not in valid_types:
            return False, f"Worker type must be one of: {', '.join(valid_types)}"

        return True, None

    except Exception as e:
        return False, f"Validation error: {str(e)}"


def migrate_config(config: Dict) -> Dict:
    """
    Migrate configuration from older formats to current format.

    Adds connection strings to workers that don't have them.
    """
    migrated = config.copy()

    # Migrate workers
    if 'workers' in migrated:
        migrated_workers = []
        for worker in migrated['workers']:
            normalized = normalize_worker_config(worker)
            migrated_workers.append(normalized)
        migrated['workers'] = migrated_workers
        debug_log(f"Migrated {len(migrated_workers)} worker configurations")

    return migrated


def _detect_worker_type(host: str, port: int) -> str:
    """Detect worker type based on host and port."""
    try:
        # Use connection parser logic for consistent detection
        connection_string = f"{host}:{port}"
        parsed = ConnectionParser.parse(connection_string)
        return parsed['worker_type']
    except ConnectionParseError:
        # Fallback detection
        if host in ['localhost', '127.0.0.1']:
            return 'local'
        elif port == 443:
            return 'cloud'
        else:
            return 'remote'


def _generate_connection_string(worker: Dict) -> str:
    """Generate a connection string from worker configuration."""
    host = worker.get('host', 'localhost')
    port = worker.get('port', 8189)

    # Use HTTPS for cloud workers or port 443
    if worker.get('type') == 'cloud' or port == 443:
        if port == 443:
            return f"https://{host}"
        else:
            return f"https://{host}:{port}"
    else:
        # Use HTTP for local/remote workers
        if (host in ['localhost', '127.0.0.1'] and port == 8188) or port == 80:
            return f"http://{host}"
        else:
            return f"http://{host}:{port}"
