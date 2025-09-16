# File Sync Feature Implementation Plan

## Overview
Implement a file synchronization system that ensures all worker nodes have the required custom nodes, models, and dependencies available for distributed workflow execution.

## Problem Statement
Currently, ComfyUI-Distributed workers may fail if they lack:
- Custom nodes required by workflows
- Model files referenced in workflows
- Configuration files and dependencies
- Updated extension code

This creates workflow execution failures and requires manual management of worker environments.

## Proposed Solution
Implement an intelligent file sync system that:
1. Detects missing dependencies on workers
2. Transfers required files from master to workers
3. Manages version synchronization across the cluster
4. Handles selective sync based on workflow requirements

## Architecture Design

### Core Components

#### 1. File Sync Manager (`utils/file_sync.py`)
**Responsibilities:**
- Coordinate file synchronization across workers
- Manage sync policies and rules
- Handle conflict resolution and versioning

#### 2. File Inventory System (`utils/file_inventory.py`)
**Responsibilities:**
- Track files and their checksums/versions
- Detect changes and missing files
- Generate sync manifests

#### 3. Transfer Protocol (`utils/file_transfer.py`)
**Responsibilities:**
- Efficient file transfer with compression
- Resume capability for large files
- Integrity validation

#### 4. Dependency Analyzer (`utils/dependency_analyzer.py`)
**Responsibilities:**
- Parse workflows to identify required files
- Analyze custom node dependencies
- Generate minimal sync requirements

## Implementation Phases

### Phase 1: Core Infrastructure (2-3 weeks)

#### File Inventory System
```python
class FileInventory:
    def scan_directory(self, path: str, include_patterns: List[str]) -> Dict[str, FileInfo]
    def compare_inventories(self, local: Dict, remote: Dict) -> SyncManifest
    def generate_checksum(self, file_path: str) -> str
    def get_file_metadata(self, file_path: str) -> FileInfo
```

#### Basic Transfer Protocol
```python
class FileTransfer:
    def transfer_file(self, source: str, dest: str, worker_url: str) -> TransferResult
    def transfer_directory(self, source: str, dest: str, worker_url: str) -> TransferResult
    def validate_transfer(self, file_path: str, expected_checksum: str) -> bool
```

**Key Features:**
- SHA256 checksums for integrity
- Chunked transfer for large files
- Basic compression (gzip)
- Transfer progress tracking

### Phase 2: Intelligent Sync Logic (2-3 weeks)

#### Dependency Analysis
```python
class DependencyAnalyzer:
    def analyze_workflow(self, workflow_json: Dict) -> List[Dependency]
    def find_custom_nodes(self, workflow_json: Dict) -> List[str]
    def resolve_model_paths(self, workflow_json: Dict) -> List[str]
    def check_worker_compatibility(self, worker_url: str, dependencies: List[Dependency]) -> CompatibilityReport
```

#### Sync Policies
```python
class SyncPolicy:
    # Policy types
    FULL_SYNC = "full"           # Sync everything
    WORKFLOW_ONLY = "workflow"   # Only sync workflow dependencies
    CUSTOM_NODES = "nodes"       # Only sync custom nodes
    MODELS_ONLY = "models"       # Only sync models
    SELECTIVE = "selective"      # User-defined rules
```

**Sync Rules:**
- Pre-execution: Sync workflow dependencies
- Scheduled: Regular sync of custom nodes
- On-demand: Manual sync of specific directories
- Version-based: Sync when files change

### Phase 3: Advanced Features (2-3 weeks)

#### Differential Sync
- Binary diff for large model files
- Directory structure comparison
- Incremental updates only

#### Conflict Resolution
```python
class ConflictResolver:
    def resolve_version_conflict(self, local_file: FileInfo, remote_file: FileInfo) -> Resolution
    def handle_missing_dependencies(self, missing: List[str]) -> ResolutionPlan
    def backup_before_overwrite(self, file_path: str) -> str
```

#### Sync Monitoring & UI
- Real-time sync progress in web UI
- Sync history and logs
- Worker-specific sync status
- Bandwidth usage monitoring

### Phase 4: Integration & Optimization (1-2 weeks)

#### ComfyUI Integration
- Automatic sync before workflow execution
- Integration with worker discovery
- Sync status in worker management UI

#### Performance Optimization
- Parallel transfers to multiple workers
- Smart bandwidth allocation
- Caching and deduplication

## Configuration Schema

### Sync Configuration (`gpu_config.json` extension)
```json
{
  "file_sync": {
    "enabled": true,
    "policy": "workflow",
    "directories": {
      "custom_nodes": {
        "path": "custom_nodes/",
        "sync_policy": "full",
        "exclude_patterns": ["*.pyc", "__pycache__", ".git"]
      },
      "models": {
        "path": "models/",
        "sync_policy": "on_demand",
        "size_limit": "5GB",
        "exclude_patterns": ["*.tmp"]
      },
      "configs": {
        "path": "configs/",
        "sync_policy": "selective",
        "include_patterns": ["*.yaml", "*.json"]
      }
    },
    "transfer": {
      "compression": true,
      "chunk_size": "64MB",
      "max_parallel": 3,
      "retry_attempts": 3,
      "bandwidth_limit": "100MB/s"
    },
    "versioning": {
      "enabled": true,
      "backup_count": 3,
      "conflict_resolution": "master_wins"
    }
  }
}
```

## API Design

### REST Endpoints
```python
# File sync management
POST   /api/v1/sync/start           # Start sync operation
GET    /api/v1/sync/status          # Get sync status
POST   /api/v1/sync/stop            # Stop ongoing sync
DELETE /api/v1/sync/reset           # Reset sync state

# File inventory
GET    /api/v1/inventory            # Get file inventory
POST   /api/v1/inventory/scan       # Trigger inventory scan
GET    /api/v1/inventory/diff       # Get differences between workers

# Worker-specific sync
POST   /api/v1/workers/{id}/sync    # Sync specific worker
GET    /api/v1/workers/{id}/inventory # Get worker inventory
POST   /api/v1/workers/{id}/sync/file # Sync specific file
```

### Event System
```python
class SyncEvents:
    SYNC_STARTED = "sync_started"
    SYNC_COMPLETED = "sync_completed"
    SYNC_ERROR = "sync_error"
    FILE_TRANSFERRED = "file_transferred"
    WORKER_SYNCED = "worker_synced"
```

## New Node Types

### File Sync Nodes
```python
class FileSyncNode:
    """Manually trigger file sync before execution"""

class DependencyCheckNode:
    """Validate worker has required dependencies"""

class SyncStatusNode:
    """Display sync status in workflow"""
```

## Security Considerations

### File Access Control
- Whitelist of syncable directories
- Validation of file paths (prevent path traversal)
- Checksum verification for all transfers
- Size limits to prevent DoS

### Network Security
- Optional encryption for file transfers
- Authentication for sync operations
- Rate limiting for file requests

## Testing Strategy

### Unit Tests
- File inventory accuracy
- Checksum calculation and validation
- Transfer protocol reliability
- Dependency analysis correctness

### Integration Tests
- End-to-end sync workflows
- Multi-worker sync scenarios
- Large file transfer handling
- Network failure recovery

### Performance Tests
- Sync speed benchmarks
- Memory usage during large transfers
- Concurrent worker sync handling

## Success Metrics
- [ ] Zero workflow failures due to missing files
- [ ] <5 minute sync time for typical custom node sets
- [ ] 99%+ transfer integrity (checksum validation)
- [ ] Automatic dependency detection for 90%+ of workflows
- [ ] Support for files up to 10GB
- [ ] Bandwidth-efficient transfers (compression >30%)


## Risks and Mitigation

### High Risk Areas
- Large model file transfers over slow networks
- Storage space management on workers
- Version conflicts and file corruption
- Network interruption during transfers

### Mitigation Strategies
- Resumable transfers with chunking
- Disk space checks before sync
- Atomic file operations with rollback
- Comprehensive error handling and retry logic

## Future Enhancements

### Advanced Features
- Peer-to-peer sync between workers (not just master→worker)
- Smart caching and CDN-like distribution
- Delta sync for large model files
- Integration with Git for version control
- Cloud storage integration (S3, Google Cloud)

### Machine Learning Optimizations
- Predictive sync based on workflow patterns
- Automatic cleanup of unused files
- Intelligent bandwidth allocation

## Next Steps
1. Review and approve implementation plan
2. Create proof-of-concept file transfer system
3. Implement basic inventory scanning
4. Begin Phase 1 development
5. Design comprehensive test suite