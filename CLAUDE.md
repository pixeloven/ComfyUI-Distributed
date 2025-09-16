# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ComfyUI-Distributed is a Python extension for ComfyUI that enables distributed and parallel processing across multiple GPUs and machines. It allows users to scale image/video generation and upscaling workflows by leveraging multiple GPU resources locally, remotely, or in the cloud.

## Architecture

### Core Components

**Main Modules:**
- `distributed.py` - Core distributed processing nodes and workflow coordination
- `distributed_upscale.py` - Specialized distributed upscaling functionality 
- `__init__.py` - Node registration, ComfyUI integration, and execution patching

**Worker System:**
- **Master**: Main ComfyUI instance that coordinates work distribution
- **Workers**: ComfyUI instances that process tasks (local, remote, or cloud-based)
- `worker_monitor.py` - Monitors master process and terminates workers if master dies

**Utilities (`utils/`):**
- `config.py` - Configuration management and worker setup
- `process.py` - Process lifecycle management and monitoring
- `network.py` - HTTP client/server communication utilities
- `image.py` - Tensor/PIL image conversion utilities
- `async_helpers.py` - Async operation wrappers for ComfyUI integration
- `constants.py` - Shared timeout and configuration constants
- `usdu_managment.py` / `usdu_utils.py` - Ultimate SD Upscale distributed processing

**Frontend (`web/`):**
- `main.js` - Primary UI integration with ComfyUI
- `ui.js` - Worker management interface and controls
- `apiClient.js` - Backend API communication
- `workerUtils.js` - Worker process management utilities

### Key Design Patterns

**Distributed Processing:**
- Jobs are distributed to available workers with load balancing
- Results are collected and aggregated on the master
- Supports both parallel generation (multiple seeds) and distributed upscaling (tile-based)

**Process Management:**
- Workers are spawned as separate ComfyUI processes on different ports
- Master-worker communication via HTTP API
- Automatic worker cleanup when master terminates

**ComfyUI Integration:**
- Custom nodes register through `NODE_CLASS_MAPPINGS`
- Execution validation is patched for dynamic output nodes
- Frontend integrates with ComfyUI's existing UI framework

## Development Commands

### Testing
```bash
# No automated tests - manual testing through ComfyUI workflows
# Use the provided workflow JSON files in /workflows for testing different features
```

### Linting
```bash
# No specific linting commands configured
# Follow Python PEP 8 standards for new code
```

### Configuration
Worker configuration is managed through a JSON config file. The system auto-generates local worker configs on first launch.

### Key Workflow Files
- `/workflows/distributed-txt2img.json` - Basic parallel image generation
- `/workflows/distributed-wan.json` - Parallel video generation  
- `/workflows/distributed-upscale.json` - Distributed image upscaling
- `/workflows/distributed-upscale-video.json` - Distributed video upscaling

## Important Implementation Details

### Worker Management
- Workers are auto-discovered for local GPUs on first launch
- Each worker runs on a unique port (8189, 8190, etc.)
- Workers require `--enable-cors-header` flag when using remote/cloud workers
- Process monitoring ensures workers terminate when master dies

### Memory and Performance
- Batch processing limited by `MAX_BATCH` constant (default 20 items)
- Heartbeat monitoring with configurable timeout (default 60s)
- Automatic VRAM cleanup between worker tasks

### Network Communication
- HTTP-based master-worker communication
- Chunked transfer for large image data
- Configurable timeouts for different operation types

### Error Handling
- Graceful worker failure handling with automatic retry
- Process cleanup on master termination
- Validation patching for ComfyUI's execution system

## Integration Notes

This is a ComfyUI custom node extension. Development should follow ComfyUI's node development patterns and be tested within a ComfyUI environment. The extension requires multiple NVIDIA GPUs or cloud GPU access to be fully functional.