import socket
import getpass
from typing import Dict


def get_ip_address() -> str:
    """Return the primary IPv4 address of the machine.
    It opens a dummy UDP socket to a public DNS server (8.8.8.8) to let the OS
    decide which interface would be used for outbound traffic. If anything
    fails we fall back to localhost.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # The address does not need to be reachable – no packets are sent.
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def get_system_info() -> Dict[str, str]:
    """Return a small dict with the Windows account name and local IP address.
    This works on any OS, but on Windows the username will be the logged‑in
    account (e.g. `C:\\Users\\JohnDoe`).
    """
    return {
        "username": getpass.getuser(),
        "ip_address": get_ip_address(),
    }
