#!/usr/bin/env python3
"""
RAGnarok - Essential Management Script
Simple commands for RAGnarok.
"""

import subprocess
import sys
import os

def run_cmd(cmd):
    """Run command and return success."""
    try:
        subprocess.run(cmd, shell=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def setup():
    """First time setup / Nuclear reset."""
    print("🔥 Setting up RAGnarok...")
    run_cmd('docker-compose down -v --remove-orphans')
    run_cmd('docker system prune -f')
    run_cmd('rm -rf chroma_db/* uploads/*')
    
    if not os.path.exists('.env'):
        run_cmd('cp env.example .env')
    
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('chroma_db', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('backups', exist_ok=True)
    
    run_cmd('docker-compose build --no-cache')
    run_cmd('docker-compose up -d')
    
    print("✅ RAGnarok is ready!")
    print("🌐 Frontend: http://localhost:3000")
    print("📚 API Docs: http://localhost:8000/docs")

def start():
    """Start RAGnarok."""
    print("🔥 Starting RAGnarok...")
    run_cmd('docker-compose up -d')
    print("✅ RAGnarok started!")
    print("🌐 Frontend: http://localhost:3000")
    print("📚 API Docs: http://localhost:8000/docs")

def stop():
    """Stop RAGnarok."""
    print("🛑 Stopping RAGnarok...")
    run_cmd('docker-compose down')
    print("✅ Stopped")

def restart():
    """Quick restart (no rebuild)."""
    print("🔄 Quick restart...")
    run_cmd('docker-compose restart')
    print("✅ Restarted!")

def rebuild():
    """Restart with code changes (rebuilds images)."""
    print("🔨 Rebuilding with fresh code...")
    run_cmd('docker-compose down')
    run_cmd('docker-compose up --build -d')
    print("✅ Rebuilt with latest code!")

def logs():
    """View logs."""
    print("📜 Viewing logs (Ctrl+C to exit)...")
    run_cmd('docker-compose logs -f')

def test():
    """Test all services."""
    print("🧪 Testing RAGnarok services...")
    test_urls = {
        "Main API": "http://localhost:8000/api/test",
        "PDF Processor": "http://localhost:8001/health",
        "Frontend": "http://localhost:3000"
    }
    for name, url in test_urls.items():
        if run_cmd(f'curl -s {url} >/dev/null'):
            print(f"✅ {name} working")
        else:
            print(f"❌ {name} not responding")
    print("🏁 Test complete!")

def main():
    if len(sys.argv) < 2:
        print("🔥 RAGnarok Management")
        print("Usage: python ragnarok.py [command]")
        print("\nCommands:")
        print("  setup    - First time setup / Nuclear reset")
        print("  start    - Start RAGnarok")
        print("  stop     - Stop RAGnarok")
        print("  restart  - Quick restart (no rebuild)")
        print("  rebuild  - Restart with code changes (rebuilds)")
        print("  logs     - View logs")
        print("  test     - Test all services")
        return

    cmd = sys.argv[1]

    if cmd == 'setup':
        setup()
    elif cmd == 'start':
        start()
    elif cmd == 'stop':
        stop()
    elif cmd == 'restart':
        restart()
    elif cmd == 'rebuild':
        rebuild()
    elif cmd == 'logs':
        logs()
    elif cmd == 'test':
        test()
    else:
        print(f"❌ Unknown command: {cmd}")
        print("Run 'python ragnarok.py' to see available commands")

if __name__ == "__main__":
    main()