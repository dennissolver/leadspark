import psutil
import os

def kill_processes_on_port(port):
    print(f"Checking for processes on port {port}...")
    for conn in psutil.net_connections():
        if conn.laddr.port == port:
            try:
                proc = psutil.Process(conn.pid)
                print(f"Killing PID {conn.pid} ({proc.name()}) on port {port}")
                proc.terminate()
                proc.wait(timeout=3)
            except psutil.NoSuchProcess:
                print(f"PID {conn.pid} not found")
            except Exception as e:
                print(f"Failed to kill PID {conn.pid}: {e}")

if __name__ == "__main__":
    kill_processes_on_port(8000)