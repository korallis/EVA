"""
Authentication Manager for EVA

Integrates the SSO authenticator with the custom URL protocol handler
to provide a seamless OAuth2 authentication experience.
"""

import asyncio
import logging
from typing import Optional, Dict, Callable
from datetime import datetime, timedelta

from PyQt6.QtCore import QObject, pyqtSignal, QTimer
from PyQt6.QtWidgets import QMessageBox
from PyQt6.QtGui import QDesktopServices
from PyQt6.QtCore import QUrl

from .sso_auth import SSOAuthenticator
from .url_handler import URLProtocolHandler
from ..core.config import EVAConfig
from ..core.models import Character


logger = logging.getLogger(__name__)


class AuthenticationManager(QObject):
    """
    Manages the complete authentication flow including SSO and URL handling.
    
    Coordinates between the SSO authenticator and URL protocol handler to
    provide a seamless authentication experience for users.
    """
    
    # Signals
    authentication_started = pyqtSignal()
    authentication_completed = pyqtSignal(dict)  # character_info
    authentication_failed = pyqtSignal(str)  # error_message
    
    def __init__(self, config: EVAConfig, url_handler: URLProtocolHandler, parent=None):
        """Initialize the authentication manager."""
        super().__init__(parent)
        
        self.config = config
        self.url_handler = url_handler
        self.logger = logging.getLogger(__name__)
        
        # SSO authenticator
        self.sso_auth: Optional[SSOAuthenticator] = None
        
        # Authentication state
        self.is_authenticating = False
        self.current_state: Optional[str] = None
        self.auth_timeout_timer = QTimer()
        self.auth_timeout_timer.setSingleShot(True)
        self.auth_timeout_timer.timeout.connect(self._on_auth_timeout)
        
        # Connect URL handler signals
        if self.url_handler:
            self.url_handler.callback_received.connect(self._on_callback_received)
        
        self.logger.info("Authentication Manager initialized")
    
    async def initialize(self) -> None:
        """Initialize the authentication manager."""
        # Create SSO authenticator
        self.sso_auth = SSOAuthenticator(self.config)
        await self.sso_auth.initialize()
        
        self.logger.info("Authentication Manager fully initialized")
    
    async def start_authentication(self, scopes: Optional[list] = None) -> bool:
        """
        Start the authentication process.
        
        Args:
            scopes: List of ESI scopes to request
            
        Returns:
            True if authentication was started successfully
        """
        if self.is_authenticating:
            self.logger.warning("Authentication already in progress")
            return False
        
        try:
            if not self.sso_auth:
                await self.initialize()
            
            self.logger.info("Starting EVE Online authentication...")
            self.is_authenticating = True
            self.authentication_started.emit()
            
            # Generate authorization URL
            auth_url, state = self.sso_auth.generate_authorization_url(scopes)
            self.current_state = state
            
            # Register callback handler with URL handler
            if self.url_handler:
                self.url_handler.register_callback_handler(
                    state, 
                    self._handle_oauth_callback
                )
            
            # Set timeout for authentication (5 minutes)
            self.auth_timeout_timer.start(300000)  # 5 minutes
            
            # Open the authorization URL in the default browser
            if not QDesktopServices.openUrl(QUrl(auth_url)):
                raise Exception("Failed to open authorization URL in browser")
            
            self.logger.info("Authorization URL opened in browser")
            self.logger.debug(f"Waiting for callback with state: {state[:8]}...")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to start authentication: {e}")
            self._cleanup_auth_state()
            self.authentication_failed.emit(str(e))
            return False
    
    def _on_callback_received(self, authorization_code: str, state: str) -> None:
        """Handle callback URL received from URL handler."""
        self.logger.info("OAuth callback received from URL handler")
        
        if not self.is_authenticating:
            self.logger.warning("Received callback but not authenticating")
            return
        
        if state != self.current_state:
            self.logger.error(f"State mismatch in callback: expected {self.current_state[:8]}..., got {state[:8]}...")
            self.authentication_failed.emit("Authentication state mismatch - possible security issue")
            self._cleanup_auth_state()
            return
        
        # Process the callback asynchronously
        asyncio.create_task(self._process_callback(authorization_code, state))
    
    async def _process_callback(self, authorization_code: str, state: str) -> None:
        """Process the OAuth callback asynchronously."""
        try:
            self.logger.info("Processing OAuth callback...")
            
            # Exchange authorization code for tokens
            token_data = await self.sso_auth.exchange_code_for_tokens(authorization_code, state)
            
            # Get character information from the token
            character_info = self.sso_auth.get_character_info_from_token()
            
            if not character_info:
                raise Exception("Failed to extract character information from token")
            
            self.logger.info(f"Authentication successful for character: {character_info.get('character_name', 'Unknown')}")
            
            # Cleanup and signal success
            self._cleanup_auth_state()
            self.authentication_completed.emit(character_info)
            
        except Exception as e:
            self.logger.error(f"Failed to process OAuth callback: {e}")
            self._cleanup_auth_state()
            self.authentication_failed.emit(str(e))
    
    def _handle_oauth_callback(self, authorization_code: str, state: str) -> None:
        """Handle OAuth callback from URL handler (sync wrapper)."""
        self._on_callback_received(authorization_code, state)
    
    def _on_auth_timeout(self) -> None:
        """Handle authentication timeout."""
        self.logger.warning("Authentication timed out")
        self._cleanup_auth_state()
        self.authentication_failed.emit("Authentication timed out. Please try again.")
    
    def _cleanup_auth_state(self) -> None:
        """Clean up authentication state."""
        self.is_authenticating = False
        self.auth_timeout_timer.stop()
        
        if self.current_state and self.url_handler:
            self.url_handler.unregister_callback_handler(self.current_state)
        
        self.current_state = None
    
    def cancel_authentication(self) -> None:
        """Cancel the current authentication process."""
        if not self.is_authenticating:
            return
        
        self.logger.info("Authentication cancelled by user")
        self._cleanup_auth_state()
        self.authentication_failed.emit("Authentication cancelled")
    
    def is_authenticated(self) -> bool:
        """Check if currently authenticated."""
        return self.sso_auth and self.sso_auth.is_authenticated()
    
    async def refresh_token(self) -> bool:
        """Refresh the current access token."""
        if not self.sso_auth:
            return False
        
        return await self.sso_auth.refresh_access_token()
    
    def get_character_info(self) -> Optional[Dict[str, str]]:
        """Get current character information."""
        if not self.sso_auth:
            return None
        
        return self.sso_auth.get_character_info_from_token()
    
    def get_access_token(self) -> Optional[str]:
        """Get the current access token."""
        if not self.sso_auth:
            return None
        
        return self.sso_auth.get_access_token()
    
    def logout(self) -> None:
        """Log out the current character."""
        if self.sso_auth:
            self.sso_auth.clear_tokens()
        
        self.logger.info("User logged out")
    
    async def cleanup(self) -> None:
        """Clean up the authentication manager."""
        self._cleanup_auth_state()
        
        if self.sso_auth:
            await self.sso_auth.close()
        
        self.logger.info("Authentication Manager cleaned up")