#!/usr/bin/env python3
"""
Test script to verify distributed processing functionality
"""
import requests
import json
import time

# Simple distributed workflow test
workflow = {
    "prompt": {
        "1": {
            "inputs": {
                "seeds": "1,2,3,4",
                "batch_size": 4
            },
            "class_type": "DistributedSeed"
        },
        "2": {
            "inputs": {
                "seed_control": ["1", 0]
            },
            "class_type": "DistributedCollector"
        }
    },
    "client_id": "test_distributed"
}

def main():
    # Test master connection
    print("Testing master connection...")
    try:
        resp = requests.get("http://localhost:8188/system_stats")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✓ Master connected - {data['devices'][0]['name']}")
        else:
            print(f"✗ Master connection failed: {resp.status_code}")
            return
    except Exception as e:
        print(f"✗ Master connection error: {e}")
        return

    # Test worker connections
    for port in [8189, 8190]:
        try:
            resp = requests.get(f"http://localhost:{port}/system_stats", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                print(f"✓ Worker {port} connected - {data['devices'][0]['name']}")
            else:
                print(f"✗ Worker {port} connection failed: {resp.status_code}")
        except Exception as e:
            print(f"✗ Worker {port} connection error: {e}")

    # Test distributed processing
    print("\nTesting distributed workflow...")
    try:
        resp = requests.post("http://localhost:8188/prompt", json=workflow)
        if resp.status_code == 200:
            result = resp.json()
            if 'prompt_id' in result:
                print(f"✓ Distributed workflow submitted: {result['prompt_id']}")
            else:
                print(f"✗ Workflow submission failed: {result}")
        else:
            print(f"✗ Workflow submission failed: {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"✗ Workflow error: {e}")

if __name__ == "__main__":
    main()