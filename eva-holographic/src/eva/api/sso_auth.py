"""
EVE Online SSO Authentication

Implements OAuth2 PKCE flow for secure authentication following
official ESI best practices from docs/esi-official/.
"""

import base64
import hashlib
import secrets
import string
import random
import urllib.parse
from typing import Dict, Optional, Tuple, List
from datetime import datetime, timedelta
import asyncio
import logging

import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client
from authlib.oauth2.rfc7636 import create_s256_code_challenge
import jwt

from ..core.config import EVAConfig
from ..core.models import Character


logger = logging.getLogger(__name__)


class SSOAuthenticator:
    """
    EVE Online SSO authenticator using OAuth2 PKCE flow.
    
    Implements the authorization code flow with PKCE (Proof Key for Code Exchange)
    as recommended in the official ESI documentation for desktop applications.
    """
    
    # EVE Online SSO endpoints
    AUTHORIZATION_URL = "https://login.eveonline.com/v2/oauth/authorize"
    TOKEN_URL = "https://login.eveonline.com/v2/oauth/token"
    JWKS_URL = "https://login.eveonline.com/oauth/jwks"
    
    # Default scopes for EVA functionality
    DEFAULT_SCOPES = [
        "esi-skills.read_skills.v1",
        "esi-skills.read_skillqueue.v1", 
        "esi-clones.read_clones.v1",
        "esi-clones.read_implants.v1",
        "esi-characters.read_characters.v1",
        "esi-assets.read_assets.v1",
        "esi-fittings.read_fittings.v1",
        "esi-fittings.write_fittings.v1",
    ]
    
    def __init__(self, config: EVAConfig):
        """Initialize the SSO authenticator."""
        self.config = config
        self.client_id = config.esi.client_id
        self.client_secret = config.esi.client_secret
        self.user_agent = config.esi.user_agent
        self.redirect_uri = config.esi.redirect_uri
        
        # PKCE state
        self._code_verifier: Optional[str] = None
        self._code_challenge: Optional[str] = None
        self._state: Optional[str] = None
        
        # Token storage
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        
        # HTTP client
        self._http_client: Optional[httpx.AsyncClient] = None
        
        # JWT verification keys
        self._jwks_cache: Optional[Dict] = None
        self._jwks_last_updated: Optional[datetime] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def initialize(self) -> None:
        """Initialize the HTTP client and fetch JWKS."""
        if self._http_client is None:
            # Create HTTP client with proper headers for ESI compliance
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
            }
            
            timeout = httpx.Timeout(
                connect=self.config.esi.timeout_seconds,
                read=self.config.esi.timeout_seconds,
                write=self.config.esi.timeout_seconds,
                pool=self.config.esi.timeout_seconds * 2
            )
            
            self._http_client = httpx.AsyncClient(
                headers=headers,
                timeout=timeout,
                follow_redirects=True
            )
        
        # Fetch JWKS for token validation
        await self._fetch_jwks()
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
    
    def generate_pkce_challenge(self) -> Tuple[str, str]:
        """
        Generate PKCE code verifier and challenge.
        
        Following RFC 7636 specification as used in ESI documentation.
        
        Returns:
            Tuple of (code_verifier, code_challenge)
        """
        # Generate cryptographically secure random verifier
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip("=")
        
        # Create SHA256 challenge
        sha256 = hashlib.sha256()
        sha256.update(code_verifier.encode())
        code_challenge = base64.urlsafe_b64encode(sha256.digest()).decode().rstrip("=")
        
        self._code_verifier = code_verifier
        self._code_challenge = code_challenge
        
        logger.debug("Generated PKCE challenge pair")
        return code_verifier, code_challenge
    
    def generate_authorization_url(self, scopes: Optional[List[str]] = None) -> Tuple[str, str]:
        """
        Generate the authorization URL for SSO login.
        
        Args:
            scopes: List of ESI scopes to request
            
        Returns:
            Tuple of (authorization_url, state)
        """
        if not self.client_id:
            raise ValueError("ESI client_id must be configured before authentication")
        
        if scopes is None:
            scopes = self.DEFAULT_SCOPES
        
        # Generate PKCE challenge if not already done
        if not self._code_challenge:
            self.generate_pkce_challenge()
        
        # Generate state parameter for CSRF protection
        self._state = "".join(random.choices(string.ascii_letters + string.digits, k=16))
        
        # Build authorization URL parameters
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": self._state,
            "code_challenge": self._code_challenge,
            "code_challenge_method": "S256",
        }
        
        query_string = urllib.parse.urlencode(params)
        authorization_url = f"{self.AUTHORIZATION_URL}?{query_string}"
        
        logger.info(f"Generated authorization URL with {len(scopes)} scopes")
        return authorization_url, self._state
    
    async def exchange_code_for_tokens(self, authorization_code: str, state: str) -> Dict[str, str]:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            authorization_code: The code received from the callback
            state: The state parameter for validation
            
        Returns:
            Token response dictionary
            
        Raises:
            ValueError: If state validation fails or tokens are invalid
        """
        if not self._http_client:
            await self.initialize()
        
        # Validate state parameter
        if state != self._state:
            raise ValueError("Invalid state parameter - possible CSRF attack")
        
        if not self._code_verifier:
            raise ValueError("Code verifier not available - authentication flow not started")
        
        # Prepare token request
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        data = {
            "grant_type": "authorization_code",
            "code": authorization_code,
            "client_id": self.client_id,
            "code_verifier": self._code_verifier,
        }
        
        try:
            response = await self._http_client.post(
                self.TOKEN_URL,
                headers=headers,
                data=data
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Store tokens
            self._access_token = token_data["access_token"]
            self._refresh_token = token_data.get("refresh_token")
            
            # Calculate expiration time
            expires_in = token_data.get("expires_in", 1200)  # Default 20 minutes
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            # Validate the access token
            character_info = await self.validate_access_token(self._access_token)
            
            logger.info(f"Successfully authenticated character: {character_info.get('CharacterName')}")
            return token_data
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error during token exchange: {e}")
            raise ValueError(f"Failed to exchange authorization code: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token exchange: {e}")
            raise ValueError(f"Token exchange failed: {e}")
    
    async def refresh_access_token(self) -> bool:
        """
        Refresh the access token using the refresh token.
        
        Returns:
            True if refresh was successful, False otherwise
        """
        if not self._refresh_token:
            logger.warning("No refresh token available")
            return False
        
        if not self._http_client:
            await self.initialize()
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token,
            "client_id": self.client_id,
        }
        
        try:
            response = await self._http_client.post(
                self.TOKEN_URL,
                headers=headers,
                data=data
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Update tokens
            self._access_token = token_data["access_token"]
            if "refresh_token" in token_data:
                self._refresh_token = token_data["refresh_token"]
            
            # Update expiration time
            expires_in = token_data.get("expires_in", 1200)
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            logger.info("Successfully refreshed access token")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to refresh token: {e}")
            return False
    
    async def validate_access_token(self, access_token: str) -> Dict[str, str]:
        """
        Validate an access token by verifying its JWT signature.
        
        Args:
            access_token: The JWT access token to validate
            
        Returns:
            Decoded token payload with character information
            
        Raises:
            ValueError: If token validation fails
        """
        if not self._jwks_cache:
            await self._fetch_jwks()
        
        try:
            # Decode JWT header to get key ID
            unverified_header = jwt.get_unverified_header(access_token)
            kid = unverified_header.get("kid")
            
            if not kid:
                raise ValueError("JWT token missing key ID")
            
            # Find the matching key in JWKS
            signing_key = None
            for key in self._jwks_cache["keys"]:
                if key["kid"] == kid:
                    signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not signing_key:
                raise ValueError(f"Signing key not found for kid: {kid}")
            
            # Verify and decode the token
            payload = jwt.decode(
                access_token,
                signing_key,
                algorithms=["RS256"],
                audience="EVE Online",
                issuer="login.eveonline.com"
            )
            
            logger.debug(f"Token validated for character: {payload.get('name', 'Unknown')}")
            return payload
            
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT validation failed: {e}")
            raise ValueError(f"Invalid access token: {e}")
    
    async def _fetch_jwks(self) -> None:
        """Fetch JSON Web Key Set for token validation."""
        # Check if JWKS is cached and still fresh (cache for 1 hour)
        if (self._jwks_cache and self._jwks_last_updated and 
            datetime.utcnow() - self._jwks_last_updated < timedelta(hours=1)):
            return
        
        if not self._http_client:
            await self.initialize()
        
        try:
            response = await self._http_client.get(self.JWKS_URL)
            response.raise_for_status()
            
            self._jwks_cache = response.json()
            self._jwks_last_updated = datetime.utcnow()
            
            logger.debug("Fetched JWKS for token validation")
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            if not self._jwks_cache:
                raise ValueError("Cannot validate tokens without JWKS")
    
    def is_authenticated(self) -> bool:
        """Check if currently authenticated with valid token."""
        if not self._access_token or not self._token_expires_at:
            return False
        
        # Check if token expires within next 5 minutes
        expires_soon = datetime.utcnow() + timedelta(minutes=5)
        return self._token_expires_at > expires_soon
    
    async def ensure_valid_token(self) -> bool:
        """
        Ensure we have a valid access token, refreshing if necessary.
        
        Returns:
            True if we have a valid token, False otherwise
        """
        if self.is_authenticated():
            return True
        
        if self._refresh_token:
            return await self.refresh_access_token()
        
        return False
    
    def get_access_token(self) -> Optional[str]:
        """Get the current access token."""
        return self._access_token
    
    def get_refresh_token(self) -> Optional[str]:
        """Get the current refresh token."""
        return self._refresh_token
    
    def clear_tokens(self) -> None:
        """Clear all stored tokens."""
        self._access_token = None
        self._refresh_token = None
        self._token_expires_at = None
        self._code_verifier = None
        self._code_challenge = None
        self._state = None
        
        logger.info("Cleared all authentication tokens")
    
    def get_character_info_from_token(self) -> Optional[Dict[str, str]]:
        """
        Extract character information from the current access token.
        
        Returns:
            Character info dict or None if no valid token
        """
        if not self._access_token:
            return None
        
        try:
            # Decode without verification for character info
            payload = jwt.decode(self._access_token, options={"verify_signature": False})
            return {
                "character_id": payload.get("sub", "").replace("CHARACTER:EVE:", ""),
                "character_name": payload.get("name", ""),
                "character_owner_hash": payload.get("owner", ""),
                "scopes": payload.get("scp", [])
            }
        except Exception as e:
            logger.error(f"Failed to decode token payload: {e}")
            return None