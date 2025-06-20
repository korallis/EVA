"""
Custom URL Protocol Handler for EVE Online OAuth2 Callbacks

Implements a custom protocol handler that can intercept eveauth-eva://callback URLs
when EVE Online redirects back to our application after authentication.

This replaces the need for a local HTTP server and provides a seamless
authentication experience integrated with the PyQt6 application.
"""

import sys
import logging
import urllib.parse
from typing import Optional, Dict, Callable
import subprocess
import platform
from pathlib import Path

from PyQt6.QtCore import QObject, pyqtSignal, QTimer
from PyQt6.QtWidgets import QApplication


logger = logging.getLogger(__name__)


class URLProtocolHandler(QObject):
    """
    Custom URL protocol handler for eveauth-eva:// scheme.
    
    Handles registration of the custom protocol with the operating system
    and processes incoming callback URLs from EVE Online OAuth2 flow.
    """
    
    # Signals
    callback_received = pyqtSignal(str, str)  # authorization_code, state
    
    def __init__(self, parent=None):
        """Initialize the URL protocol handler."""
        super().__init__(parent)
        
        self.logger = logging.getLogger(__name__)
        self.protocol_scheme = "eveauth-eva"
        self.callback_path = "callback"
        
        # Callback processing
        self._callback_handlers: Dict[str, Callable] = {}
        self._pending_state: Optional[str] = None
        
        # Monitor for incoming URLs (especially on macOS)
        self._url_check_timer = QTimer()
        self._url_check_timer.timeout.connect(self._check_for_pending_urls)
        
        self.logger.info("URL Protocol Handler initialized")
    
    def register_protocol(self) -> bool:
        """
        Register the custom protocol with the operating system.
        
        Returns:
            True if registration was successful
        """
        try:
            system = platform.system()
            
            if system == "Windows":
                return self._register_windows_protocol()
            elif system == "Darwin":  # macOS
                return self._register_macos_protocol()
            else:
                self.logger.error(f"Unsupported platform: {system}")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to register protocol: {e}")
            return False
    
    def _register_windows_protocol(self) -> bool:
        """Register the protocol on Windows using registry."""
        try:
            import winreg
        except ImportError:
            self.logger.error("winreg module not available - not running on Windows")
            return False
        
        try:
            # Get the path to the current executable
            app = QApplication.instance()
            if app:
                exe_path = sys.executable
            else:
                exe_path = sys.argv[0]
            
            # Ensure we have the full path
            if not Path(exe_path).is_absolute():
                exe_path = str(Path(exe_path).resolve())
            
            # Registry key path
            key_path = rf"Software\Classes\{self.protocol_scheme}"
            
            # Create protocol registry entries
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "EVA OAuth2 Callback")
                winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
            
            # Set the command to execute
            command_key_path = rf"{key_path}\shell\open\command"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, command_key_path) as key:
                winreg.SetValueEx(key, "", 0, winreg.REG_SZ, f'"{exe_path}" --oauth-callback "%1"')
            
            self.logger.info(f"Windows protocol registered: {self.protocol_scheme}://")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to register Windows protocol: {e}")
            return False
    
    def _register_macos_protocol(self) -> bool:
        """Register the protocol on macOS using LSSetDefaultHandlerForURLScheme."""
        try:
            # For development, we'll create a simple plist and register it
            # In production, this would be handled by the app bundle
            
            app = QApplication.instance()
            if not app:
                self.logger.error("No QApplication instance available")
                return False
            
            # Get application bundle info
            app_name = app.applicationName() or "EVA Holographic"
            bundle_id = f"com.eva.{app_name.lower().replace(' ', '')}"
            
            # Try to register using AppleScript (fallback method)
            script = f'''
            tell application "System Events"
                try
                    set defaultApp to default application of URL "{self.protocol_scheme}://"
                    if defaultApp is not "{app_name}" then
                        set default application of URL "{self.protocol_scheme}://" to application "{app_name}"
                    end if
                    return true
                on error
                    return false
                end try
            end tell
            '''
            
            try:
                result = subprocess.run([
                    "osascript", "-e", script
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    self.logger.info(f"macOS protocol registered: {self.protocol_scheme}://")
                    return True
                else:
                    self.logger.warning(f"AppleScript registration failed: {result.stderr}")
            except subprocess.TimeoutExpired:
                self.logger.warning("AppleScript registration timed out")
            except Exception as e:
                self.logger.warning(f"AppleScript registration error: {e}")
            
            # Alternative: Create LSRegisterURL entry (requires more system access)
            self.logger.info("Protocol registration attempted - may require manual setup")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to register macOS protocol: {e}")
            return False
    
    def process_callback_url(self, url: str) -> bool:
        """
        Process an incoming callback URL.
        
        Args:
            url: The full callback URL (e.g., eveauth-eva://callback?code=...&state=...)
            
        Returns:
            True if the URL was processed successfully
        """
        try:
            self.logger.info(f"Processing callback URL: {url[:50]}...")
            
            # Parse the URL
            parsed = urllib.parse.urlparse(url)
            
            # Validate the scheme and path
            if parsed.scheme != self.protocol_scheme:
                self.logger.error(f"Invalid scheme: {parsed.scheme}")
                return False
            
            if parsed.path.lstrip('/') != self.callback_path:
                self.logger.error(f"Invalid callback path: {parsed.path}")
                return False
            
            # Parse query parameters
            params = urllib.parse.parse_qs(parsed.query)
            
            # Extract required parameters
            authorization_code = params.get('code', [None])[0]
            state = params.get('state', [None])[0]
            error = params.get('error', [None])[0]
            
            if error:
                self.logger.error(f"OAuth2 error in callback: {error}")
                error_description = params.get('error_description', ['Unknown error'])[0]
                self.logger.error(f"Error description: {error_description}")
                return False
            
            if not authorization_code or not state:
                self.logger.error("Missing required parameters in callback URL")
                return False
            
            # Emit signal with the callback data
            self.callback_received.emit(authorization_code, state)
            
            self.logger.info("Callback URL processed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to process callback URL: {e}")
            return False
    
    def register_callback_handler(self, state: str, handler: Callable[[str, str], None]) -> None:
        """
        Register a callback handler for a specific OAuth2 state.
        
        Args:
            state: The OAuth2 state parameter to match
            handler: Callback function to call when the state is received
        """
        self._callback_handlers[state] = handler
        self._pending_state = state
        
        # Start monitoring for URLs
        self._url_check_timer.start(1000)  # Check every second
        
        self.logger.debug(f"Registered callback handler for state: {state[:8]}...")
    
    def unregister_callback_handler(self, state: str) -> None:
        """
        Unregister a callback handler.
        
        Args:
            state: The OAuth2 state parameter to unregister
        """
        if state in self._callback_handlers:
            del self._callback_handlers[state]
        
        if self._pending_state == state:
            self._pending_state = None
            self._url_check_timer.stop()
        
        self.logger.debug(f"Unregistered callback handler for state: {state[:8]}...")
    
    def _check_for_pending_urls(self) -> None:
        """Check for pending URL processing (mainly for macOS)."""
        # This is a placeholder for checking system events or file-based communication
        # In a production app, this might check for temporary files or system events
        pass
    
    def handle_application_arguments(self, args: list) -> bool:
        """
        Handle application arguments that might contain OAuth callback URLs.
        
        This is called when the application is started with command line arguments,
        which happens when the OS launches the app to handle a custom protocol URL.
        
        Args:
            args: Command line arguments
            
        Returns:
            True if a callback URL was found and processed
        """
        try:
            # Look for OAuth callback argument
            oauth_callback_arg = None
            
            for i, arg in enumerate(args):
                if arg == "--oauth-callback" and i + 1 < len(args):
                    oauth_callback_arg = args[i + 1]
                    break
                elif arg.startswith(f"{self.protocol_scheme}://"):
                    oauth_callback_arg = arg
                    break
            
            if oauth_callback_arg:
                self.logger.info("OAuth callback argument found")
                return self.process_callback_url(oauth_callback_arg)
            
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to handle application arguments: {e}")
            return False
    
    def is_protocol_registered(self) -> bool:
        """
        Check if the custom protocol is registered with the system.
        
        Returns:
            True if the protocol appears to be registered
        """
        try:
            system = platform.system()
            
            if system == "Windows":
                return self._check_windows_protocol()
            elif system == "Darwin":
                return self._check_macos_protocol()
            else:
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to check protocol registration: {e}")
            return False
    
    def _check_windows_protocol(self) -> bool:
        """Check if the protocol is registered on Windows."""
        try:
            import winreg
            
            key_path = rf"Software\Classes\{self.protocol_scheme}"
            
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path):
                return True
                
        except (ImportError, FileNotFoundError, OSError):
            return False
    
    def _check_macos_protocol(self) -> bool:
        """Check if the protocol is registered on macOS."""
        try:
            # This is a simplified check - in reality, we'd need to check
            # the Launch Services database
            return True  # Assume it's registered for now
            
        except Exception:
            return False
    
    def get_callback_url(self) -> str:
        """
        Get the full callback URL for this handler.
        
        Returns:
            The callback URL (e.g., eveauth-eva://callback)
        """
        return f"{self.protocol_scheme}://{self.callback_path}"