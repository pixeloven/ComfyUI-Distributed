# File Sync Feature Implementation Plan

## Overview
Enable automatic synchronization of required files between master and worker nodes to prevent workflow execution failures due to missing dependencies.

## Problem Statement
Currently, ComfyUI-Distributed workers may fail if they lack:
- Custom nodes required by workflows
- Model files referenced in workflows
- Configuration files and dependencies
- Updated extension code

This creates workflow execution failures and requires manual management of worker environments.

## Current State
- Workers may lack custom nodes, models, or configuration files needed for workflows
- Manual file management required across all worker nodes
- Workflow failures when dependencies are missing
- No version synchronization between master and workers

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

## Project Phases

### Phase 1: File Discovery & Inventory 📝 PLANNED
**Problems to Solve:**
- Unable to detect which files exist on master vs workers
- No tracking of file versions or changes
- Missing dependency analysis for workflows
- Lack of file integrity verification

**Tasks:**
- [ ] Create file scanning and inventory system
- [ ] Implement checksum-based file tracking (SHA256)
- [ ] Build workflow dependency analyzer
- [ ] Design file metadata storage system

**Implementation:**
```python
class FileInventory:
    def scan_directory(self, path: str, include_patterns: List[str]) -> Dict[str, FileInfo]
    def compare_inventories(self, local: Dict, remote: Dict) -> SyncManifest
    def generate_checksum(self, file_path: str) -> str
    def get_file_metadata(self, file_path: str) -> FileInfo
```

### Phase 2: Transfer Infrastructure 📝 PLANNED
**Problems to Solve:**
- No reliable way to transfer files between nodes
- Large files (models) take too long to transfer
- Network interruptions cause failed transfers
- Missing integrity validation for transferred files

**Tasks:**
- [ ] Implement chunked file transfer system
- [ ] Add compression and resumable transfers
- [ ] Create transfer progress tracking
- [ ] Build integrity validation system

**Implementation:**
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

### Phase 3: Sync Logic & Policies 📝 PLANNED
**Problems to Solve:**
- No automated sync triggering
- Unclear which files should be synced when
- Version conflicts between master and workers
- Storage space management on workers

**Tasks:**
- [ ] Design sync policies (full, selective, on-demand)
- [ ] Implement pre-workflow dependency checking
- [ ] Create version conflict resolution
- [ ] Add storage space management

**Sync Policies:**
```python
class SyncPolicy:
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

### Phase 4: User Interface & Monitoring 📝 PLANNED
**Problems to Solve:**
- No visibility into sync status across workers
- Unable to manually trigger sync operations
- Missing sync progress and error reporting
- Difficult to configure sync settings

**Tasks:**
- [ ] Build sync status dashboard
- [ ] Add manual sync controls
- [ ] Create progress monitoring interface
- [ ] Design sync configuration UI
- [ ] Integrate with ComfyUI worker management UI

### Phase 5: Performance & Optimization 📝 PLANNED
**Problems to Solve:**
- Sync operations impact workflow performance
- Inefficient bandwidth usage
- Duplicate file transfers across workers
- Large storage requirements

**Tasks:**
- [ ] Implement parallel transfers to multiple workers
- [ ] Add smart bandwidth management
- [ ] Create deduplication system
- [ ] Optimize storage usage patterns
- [ ] Add differential sync for large model files

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

## Success Criteria
**Functional Requirements:**
- [ ] Zero workflow failures due to missing files
- [ ] Automatic dependency detection for workflows
- [ ] Reliable file transfer with integrity checking
- [ ] Configurable sync policies per directory type

**Performance Requirements:**
- [ ] Sync completion under 5 minutes for typical setups
- [ ] Bandwidth-efficient transfers (>30% compression)
- [ ] Support for files up to 10GB
- [ ] 99%+ transfer integrity rate

**User Experience Requirements:**
- [ ] Clear sync status visibility
- [ ] Manual sync controls when needed
- [ ] Progress feedback during operations
- [ ] Intuitive configuration interface

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

## How to Use This Plan
1. **Work Together**: Each phase identifies problems to solve rather than prescriptive solutions
2. **Collaborative Approach**: Discuss implementation options for each task before proceeding
3. **Flexible Solutions**: Adapt implementation details based on discovery and constraints
4. **Check Progress**: Mark tasks as completed when functionality is verified
5. **Iterate**: Refine approach based on what we learn during implementation
