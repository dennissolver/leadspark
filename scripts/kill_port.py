import sys
import os
import signal
import psutil

def find_pid_by_port(port):
    """
    Finds the Process ID (PID) that is listening on the given port.
    """
    for conn in psutil.net_connections():
        # Check if the connection is a listening TCP socket on the specified port
        if conn.laddr.port == port and conn.status == 'LISTEN':
            return conn.pid
    return None

def kill_process(pid):
    """
    Kills the process with the given PID.
    """
    try:
        os.kill(pid, signal.SIGTERM)  # Send a termination signal
        print(f"Successfully sent termination signal to process with PID {pid}.")
    except ProcessLookupError:
        print(f"Error: Process with PID {pid} not found.")
    except PermissionError:
        print(f"Error: Permission denied. Try running as administrator or with sudo.")

def main():
    """
    Main function to run the script from the command line.
    """
    if len(sys.argv) < 2:
        print("Usage: python kill_port.py <port_number>")
        sys.exit(1)

    try:
        port = int(sys.argv[1])
    except ValueError:
        print(f"Error: '{sys.argv[1]}' is not a valid port number.")
        sys.exit(1)

    print(f"Searching for process on port {port}...")
    pid_to_kill = find_pid_by_port(port)

    if pid_to_kill:
        print(f"Found process with PID {pid_to_kill} on port {port}. Attempting to terminate...")
        kill_process(pid_to_kill)
    else:
        print(f"No process found listening on port {port}.")

if __name__ == "__main__":
    main()

