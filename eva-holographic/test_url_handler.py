#!/usr/bin/env python3
"""
Test script for the custom URL protocol handler.

This script tests the URL protocol registration and callback processing
without requiring the full EVA application.
"""

import sys
import asyncio
import logging
from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget, QTextEdit, QLabel
from PyQt6.QtCore import Qt

# Add the EVA module to the path
sys.path.insert(0, 'src')

from eva.api.url_handler import URLProtocolHandler
from eva.core.config import EVAConfig


class TestWindow(QMainWindow):
    """Simple test window for URL handler."""
    
    def __init__(self):
        super().__init__()
        self.url_handler = URLProtocolHandler()
        self.setup_ui()
        self.setup_url_handler()
    
    def setup_ui(self):
        """Setup the test UI."""
        self.setWindowTitle("EVA URL Handler Test")
        self.setGeometry(100, 100, 600, 400)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        layout = QVBoxLayout()
        central_widget.setLayout(layout)
        
        # Title
        title = QLabel("EVA Custom URL Protocol Handler Test")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Register button
        self.register_btn = QPushButton("Register Protocol")
        self.register_btn.clicked.connect(self.register_protocol)
        layout.addWidget(self.register_btn)
        
        # Test callback button
        self.test_btn = QPushButton("Test Callback URL")
        self.test_btn.clicked.connect(self.test_callback)
        layout.addWidget(self.test_btn)
        
        # Log output
        self.log_output = QTextEdit()
        self.log_output.setReadOnly(True)
        layout.addWidget(self.log_output)
    
    def setup_url_handler(self):
        """Setup URL handler signals."""
        self.url_handler.callback_received.connect(self.on_callback_received)
    
    def register_protocol(self):
        """Register the custom protocol."""
        self.log("Registering custom protocol...")
        
        success = self.url_handler.register_protocol()
        
        if success:
            self.log("✓ Protocol registered successfully!")
            self.log(f"Protocol scheme: {self.url_handler.protocol_scheme}://")
            self.log(f"Callback URL: {self.url_handler.get_callback_url()}")
        else:
            self.log("✗ Failed to register protocol")
        
        # Check if protocol is registered
        is_registered = self.url_handler.is_protocol_registered()
        self.log(f"Protocol registration check: {'✓ Registered' if is_registered else '✗ Not registered'}")
    
    def test_callback(self):
        """Test a callback URL."""
        test_url = "eveauth-eva://callback?code=test_auth_code_12345&state=test_state_67890"
        self.log(f"Testing callback URL: {test_url}")
        
        success = self.url_handler.process_callback_url(test_url)
        
        if success:
            self.log("✓ Callback URL processed successfully!")
        else:
            self.log("✗ Failed to process callback URL")
    
    def on_callback_received(self, auth_code, state):
        """Handle callback received signal."""
        self.log(f"🎉 Callback received!")
        self.log(f"   Authorization Code: {auth_code}")
        self.log(f"   State: {state}")
    
    def log(self, message):
        """Add a message to the log output."""
        self.log_output.append(message)
        print(message)  # Also print to console


def main():
    """Run the test application."""
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    app = QApplication(sys.argv)
    app.setApplicationName("EVA URL Handler Test")
    
    window = TestWindow()
    window.show()
    
    # Handle command line arguments for OAuth callbacks
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if arg.startswith("eveauth-eva://") or arg == "--oauth-callback":
                print(f"Detected OAuth callback argument: {arg}")
                if window.url_handler.handle_application_arguments(sys.argv):
                    print("OAuth callback processed successfully!")
                else:
                    print("Failed to process OAuth callback")
                break
    
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())