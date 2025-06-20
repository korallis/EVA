#!/usr/bin/env python3
"""
Setup script for registering the eveauth-eva:// custom URL protocol.

This script can be run independently to register the custom protocol
with the operating system.
"""

import sys
import platform
import subprocess
from pathlib import Path

# Add the EVA module to the path
sys.path.insert(0, 'src')

from eva.api.url_handler import URLProtocolHandler


def main():
    """Register the custom URL protocol."""
    print("EVA Custom URL Protocol Setup")
    print("=" * 40)
    
    system = platform.system()
    print(f"Detected OS: {system}")
    
    handler = URLProtocolHandler()
    protocol_scheme = handler.protocol_scheme
    
    print(f"Protocol scheme: {protocol_scheme}://")
    print(f"Callback URL: {handler.get_callback_url()}")
    
    # Check if already registered
    if handler.is_protocol_registered():
        print(f"✓ Protocol {protocol_scheme}:// is already registered")
        return 0
    
    print(f"Registering protocol {protocol_scheme}://...")
    
    success = handler.register_protocol()
    
    if success:
        print(f"✓ Protocol {protocol_scheme}:// registered successfully!")
        
        # Verify registration
        if handler.is_protocol_registered():
            print("✓ Registration verified")
        else:
            print("⚠️  Registration may not be complete - manual setup might be required")
            
        # Provide instructions
        print("\nNext steps:")
        print("1. Test the protocol by running: python test_url_handler.py")
        print("2. Launch EVA and try authentication")
        
        if system == "Darwin":  # macOS
            print("\nNote for macOS:")
            print("- You may need to run the app once for the protocol to be fully registered")
            print("- Grant necessary permissions when prompted")
        elif system == "Windows":
            print("\nNote for Windows:")
            print("- The protocol has been registered in the current user registry")
            print("- Administrator privileges are not required")
        
        return 0
    else:
        print(f"✗ Failed to register protocol {protocol_scheme}://")
        
        if system == "Darwin":
            print("\nTroubleshooting for macOS:")
            print("- Try running with administrator privileges: sudo python setup_protocol.py")
            print("- Check System Preferences > Security & Privacy")
        elif system == "Windows":
            print("\nTroubleshooting for Windows:")
            print("- Try running as administrator")
            print("- Check Windows registry manually")
        else:
            print(f"\nUnsupported platform: {system}")
            print("Manual protocol registration required")
        
        return 1


if __name__ == "__main__":
    sys.exit(main())