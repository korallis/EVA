"""
ESI Client

Complete EVE Online ESI API client implementation following official best practices.
Handles all API communication with proper error handling, rate limiting, and caching.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
import json
from pathlib import Path

import httpx
from httpx import Response

from ..core.config import EVAConfig
from ..core.models import Character, Skill
from .sso_auth import SSOAuthenticator


logger = logging.getLogger(__name__)


class ESIError(Exception):
    """Base exception for ESI-related errors."""
    pass


class ESIRateLimitError(ESIError):
    """Raised when ESI rate limit is exceeded."""
    pass


class ESIAuthenticationError(ESIError):
    """Raised when ESI authentication fails."""
    pass


class ESIClient:
    """
    Complete ESI API client for EVE Online integration.
    
    Implements all ESI best practices including proper caching, rate limiting,
    error handling, and authentication management.
    """
    
    # ESI Base URLs
    ESI_BASE_URL = "https://esi.evetech.net"
    ESI_DATASOURCE = "tranquility"
    
    # Common ESI endpoints
    ENDPOINTS = {
        # Character endpoints
        "character_info": "/v5/characters/{character_id}/",
        "character_skills": "/v4/characters/{character_id}/skills/",
        "character_skillqueue": "/v2/characters/{character_id}/skillqueue/",
        "character_implants": "/v1/characters/{character_id}/implants/",
        "character_clones": "/v3/characters/{character_id}/clones/",
        "character_attributes": "/v1/characters/{character_id}/attributes/",
        "character_corporation": "/v1/characters/{character_id}/corporationhistory/",
        
        # Universe endpoints  
        "universe_types": "/v3/universe/types/",
        "universe_type": "/v3/universe/types/{type_id}/",
        "universe_groups": "/v1/universe/groups/",
        "universe_group": "/v1/universe/groups/{group_id}/",
        "universe_categories": "/v1/universe/categories/",
        "universe_category": "/v1/universe/categories/{category_id}/",
        
        # Market endpoints
        "market_prices": "/v1/markets/prices/",
        "market_orders": "/v1/markets/{region_id}/orders/",
        "market_history": "/v1/markets/{region_id}/history/",
        "market_types": "/v1/markets/{region_id}/types/",
        
        # Dogma endpoints
        "dogma_attributes": "/v1/dogma/attributes/",
        "dogma_attribute": "/v1/dogma/attributes/{attribute_id}/",
        "dogma_effects": "/v1/dogma/effects/",
        "dogma_effect": "/v2/dogma/effects/{effect_id}/",
        
        # Fittings endpoints
        "character_fittings": "/v2/characters/{character_id}/fittings/",
        "create_fitting": "/v2/characters/{character_id}/fittings/",
        "delete_fitting": "/v1/characters/{character_id}/fittings/{fitting_id}/",
    }
    
    def __init__(self, config: EVAConfig, authenticator: Optional[SSOAuthenticator] = None):
        """Initialize the ESI client."""
        self.config = config
        self.authenticator = authenticator
        self.logger = logging.getLogger(__name__)
        
        # HTTP client
        self._http_client: Optional[httpx.AsyncClient] = None
        
        # Rate limiting tracking
        self._error_limit_remaining = 100
        self._error_limit_reset = datetime.utcnow()
        self._last_request_time = datetime.utcnow()
        
        # Response cache
        self._response_cache: Dict[str, Tuple[Any, datetime, str]] = {}  # url -> (data, expires_at, etag)
        self._cache_directory = config.get_cache_directory() / "esi"
        self._cache_directory.mkdir(parents=True, exist_ok=True)
        
        # Request statistics
        self._request_count = 0
        self._cache_hits = 0
        self._rate_limit_delays = 0
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def initialize(self) -> None:
        """Initialize the HTTP client."""
        if self._http_client is None:
            # Build proper User-Agent header following ESI guidelines
            headers = {
                "User-Agent": self.config.esi.user_agent,
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "Accept-Language": "en-US,en;q=0.9",
            }
            
            timeout = httpx.Timeout(
                connect=self.config.esi.timeout_seconds,
                read=self.config.esi.timeout_seconds,
                write=self.config.esi.timeout_seconds,
                pool=self.config.esi.timeout_seconds * 2
            )
            
            # Configure retry limits
            retries = httpx.Limits(
                max_keepalive_connections=10,
                max_connections=20,
                keepalive_expiry=30
            )
            
            self._http_client = httpx.AsyncClient(
                headers=headers,
                timeout=timeout,
                limits=retries,
                follow_redirects=True,
                http2=True  # Enable HTTP/2 for better performance
            )
        
        self.logger.info("ESI client initialized")
    
    async def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        
        # Save cache statistics
        self.logger.info(
            f"ESI client closing - Requests: {self._request_count}, "
            f"Cache hits: {self._cache_hits}, Rate limit delays: {self._rate_limit_delays}"
        )
    
    async def _make_request(
        self, 
        method: str, 
        url: str, 
        authenticated: bool = False,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Response:
        """
        Make an HTTP request with proper ESI compliance.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL or endpoint path
            authenticated: Whether this request requires authentication
            params: Query parameters
            data: Request body data
            headers: Additional headers
            
        Returns:
            HTTP response object
            
        Raises:
            ESIError: For various ESI-related errors
        """
        if not self._http_client:
            await self.initialize()
        
        # Build full URL if needed
        if not url.startswith("http"):
            url = f"{self.ESI_BASE_URL}{url}"
        
        # Add datasource parameter
        if params is None:
            params = {}
        params.setdefault("datasource", self.ESI_DATASOURCE)
        
        # Check cache for GET requests
        if method.upper() == "GET":
            cached_response = await self._check_cache(url, params)
            if cached_response:
                self._cache_hits += 1
                return cached_response
        
        # Rate limiting check
        await self._check_rate_limits()
        
        # Authentication
        request_headers = dict(headers) if headers else {}
        if authenticated and self.authenticator:
            if not await self.authenticator.ensure_valid_token():
                raise ESIAuthenticationError("Failed to obtain valid access token")
            
            access_token = self.authenticator.get_access_token()
            request_headers["Authorization"] = f"Bearer {access_token}"
        
        # Add conditional request headers for caching
        cache_key = self._build_cache_key(url, params)
        if cache_key in self._response_cache:
            _, _, etag = self._response_cache[cache_key]
            if etag:
                request_headers["If-None-Match"] = etag
        
        try:
            self.logger.debug(f"Making {method} request to {url}")
            
            response = await self._http_client.request(
                method=method,
                url=url,
                params=params,
                json=data if data else None,
                headers=request_headers
            )
            
            self._request_count += 1
            
            # Update rate limit tracking from response headers
            self._update_rate_limit_info(response)
            
            # Handle 304 Not Modified
            if response.status_code == 304:
                # Return cached data
                cached_data, _, _ = self._response_cache[cache_key]
                return self._create_mock_response(cached_data, 200)
            
            # Handle rate limiting
            if response.status_code == 420:
                self._rate_limit_delays += 1
                retry_after = int(response.headers.get("Retry-After", "60"))
                self.logger.warning(f"Rate limited, waiting {retry_after} seconds")
                await asyncio.sleep(retry_after)
                raise ESIRateLimitError(f"Rate limited, retry after {retry_after} seconds")
            
            # Handle other errors
            response.raise_for_status()
            
            # Cache successful GET responses
            if method.upper() == "GET" and response.status_code == 200:
                await self._cache_response(url, params, response)
            
            return response
            
        except httpx.HTTPStatusError as e:
            self.logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise ESIError(f"HTTP {e.response.status_code}: {e.response.text}")
        except httpx.RequestError as e:
            self.logger.error(f"Request error: {e}")
            raise ESIError(f"Request failed: {e}")
    
    async def _check_rate_limits(self) -> None:
        """Check and enforce ESI rate limits."""
        now = datetime.utcnow()
        
        # Check error limit
        if self._error_limit_remaining <= 5:  # Conservative buffer
            if now < self._error_limit_reset:
                wait_time = (self._error_limit_reset - now).total_seconds()
                self.logger.warning(f"Near error limit, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
        
        # Implement request spacing to be respectful
        time_since_last = (now - self._last_request_time).total_seconds()
        min_interval = self.config.esi.rate_limit_buffer
        
        if time_since_last < min_interval:
            wait_time = min_interval - time_since_last
            await asyncio.sleep(wait_time)
        
        self._last_request_time = datetime.utcnow()
    
    def _update_rate_limit_info(self, response: Response) -> None:
        """Update rate limit information from response headers."""
        # ESI error limit headers
        if "X-ESI-Error-Limit-Remain" in response.headers:
            self._error_limit_remaining = int(response.headers["X-ESI-Error-Limit-Remain"])
        
        if "X-ESI-Error-Limit-Reset" in response.headers:
            reset_seconds = int(response.headers["X-ESI-Error-Limit-Reset"])
            self._error_limit_reset = datetime.utcnow() + timedelta(seconds=reset_seconds)
        
        # Log rate limit status
        self.logger.debug(
            f"Rate limit: {self._error_limit_remaining} errors remaining, "
            f"resets at {self._error_limit_reset}"
        )
    
    def _build_cache_key(self, url: str, params: Optional[Dict[str, Any]]) -> str:
        """Build a cache key from URL and parameters."""
        import hashlib
        
        key_data = f"{url}?{json.dumps(params or {}, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def _check_cache(self, url: str, params: Optional[Dict[str, Any]]) -> Optional[Response]:
        """Check if we have a cached response that's still valid."""
        cache_key = self._build_cache_key(url, params)
        
        if cache_key in self._response_cache:
            cached_data, expires_at, etag = self._response_cache[cache_key]
            
            if datetime.utcnow() < expires_at:
                self.logger.debug(f"Cache hit for {url}")
                return self._create_mock_response(cached_data, 200)
        
        return None
    
    async def _cache_response(self, url: str, params: Optional[Dict[str, Any]], response: Response) -> None:
        """Cache a response according to its headers."""
        try:
            data = response.json()
            
            # Determine expiration time
            expires_at = datetime.utcnow() + timedelta(seconds=self.config.esi.cache_duration)
            
            if "expires" in response.headers:
                try:
                    expires_header = response.headers["expires"]
                    expires_at = datetime.strptime(expires_header, "%a, %d %b %Y %H:%M:%S GMT")
                except ValueError:
                    pass  # Use default expiration
            
            # Store in memory cache
            cache_key = self._build_cache_key(url, params)
            etag = response.headers.get("etag", "")
            
            self._response_cache[cache_key] = (data, expires_at, etag)
            
            # Optionally persist to disk for important data
            if self._should_persist_cache(url):
                await self._persist_cache_entry(cache_key, data, expires_at, etag)
            
            self.logger.debug(f"Cached response for {url} until {expires_at}")
            
        except Exception as e:
            self.logger.warning(f"Failed to cache response: {e}")
    
    def _should_persist_cache(self, url: str) -> bool:
        """Determine if a response should be persisted to disk."""
        # Persist universe data, market data, etc.
        persistent_endpoints = ["/universe/", "/markets/", "/dogma/"]
        return any(endpoint in url for endpoint in persistent_endpoints)
    
    async def _persist_cache_entry(self, cache_key: str, data: Any, expires_at: datetime, etag: str) -> None:
        """Persist a cache entry to disk."""
        try:
            cache_file = self._cache_directory / f"{cache_key}.json"
            cache_entry = {
                "data": data,
                "expires_at": expires_at.isoformat(),
                "etag": etag,
                "cached_at": datetime.utcnow().isoformat()
            }
            
            with open(cache_file, "w") as f:
                json.dump(cache_entry, f, indent=2)
                
        except Exception as e:
            self.logger.warning(f"Failed to persist cache entry: {e}")
    
    def _create_mock_response(self, data: Any, status_code: int) -> Response:
        """Create a mock response object for cached data."""
        # This is a simplified mock - in a real implementation you'd want
        # a more complete Response-like object
        class MockResponse:
            def __init__(self, data, status_code):
                self._data = data
                self.status_code = status_code
                
            def json(self):
                return self._data
                
            def raise_for_status(self):
                if self.status_code >= 400:
                    raise httpx.HTTPStatusError("Mock error", request=None, response=self)
        
        return MockResponse(data, status_code)
    
    # Character API methods
    
    async def get_character_info(self, character_id: int) -> Dict[str, Any]:
        """Get character information."""
        url = self.ENDPOINTS["character_info"].format(character_id=character_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_character_skills(self, character_id: int) -> Dict[str, Any]:
        """Get character skills."""
        url = self.ENDPOINTS["character_skills"].format(character_id=character_id)
        response = await self._make_request("GET", url, authenticated=True)
        return response.json()
    
    async def get_character_skillqueue(self, character_id: int) -> List[Dict[str, Any]]:
        """Get character skill queue."""
        url = self.ENDPOINTS["character_skillqueue"].format(character_id=character_id)
        response = await self._make_request("GET", url, authenticated=True)
        return response.json()
    
    async def get_character_implants(self, character_id: int) -> List[int]:
        """Get character implants."""
        url = self.ENDPOINTS["character_implants"].format(character_id=character_id)
        response = await self._make_request("GET", url, authenticated=True)
        return response.json()
    
    async def get_character_attributes(self, character_id: int) -> Dict[str, Any]:
        """Get character attributes."""
        url = self.ENDPOINTS["character_attributes"].format(character_id=character_id)
        response = await self._make_request("GET", url, authenticated=True)
        return response.json()
    
    # Universe API methods
    
    async def get_type_info(self, type_id: int) -> Dict[str, Any]:
        """Get information about a specific type."""
        url = self.ENDPOINTS["universe_type"].format(type_id=type_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_group_info(self, group_id: int) -> Dict[str, Any]:
        """Get information about a specific group."""
        url = self.ENDPOINTS["universe_group"].format(group_id=group_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_category_info(self, category_id: int) -> Dict[str, Any]:
        """Get information about a specific category."""
        url = self.ENDPOINTS["universe_category"].format(category_id=category_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    # Market API methods
    
    async def get_market_prices(self) -> List[Dict[str, Any]]:
        """Get current market prices for all items."""
        url = self.ENDPOINTS["market_prices"]
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_market_orders(self, region_id: int, type_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get market orders for a region."""
        url = self.ENDPOINTS["market_orders"].format(region_id=region_id)
        params = {}
        if type_id:
            params["type_id"] = type_id
        
        response = await self._make_request("GET", url, params=params)
        return response.json()
    
    # Dogma API methods
    
    async def get_dogma_attributes(self) -> List[int]:
        """Get list of all dogma attributes."""
        url = self.ENDPOINTS["dogma_attributes"]
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_dogma_attribute(self, attribute_id: int) -> Dict[str, Any]:
        """Get information about a specific dogma attribute."""
        url = self.ENDPOINTS["dogma_attribute"].format(attribute_id=attribute_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_dogma_effects(self) -> List[int]:
        """Get list of all dogma effects."""
        url = self.ENDPOINTS["dogma_effects"]
        response = await self._make_request("GET", url)
        return response.json()
    
    async def get_dogma_effect(self, effect_id: int) -> Dict[str, Any]:
        """Get information about a specific dogma effect."""
        url = self.ENDPOINTS["dogma_effect"].format(effect_id=effect_id)
        response = await self._make_request("GET", url)
        return response.json()
    
    # Fitting API methods
    
    async def get_character_fittings(self, character_id: int) -> List[Dict[str, Any]]:
        """Get character's saved fittings."""
        url = self.ENDPOINTS["character_fittings"].format(character_id=character_id)
        response = await self._make_request("GET", url, authenticated=True)
        return response.json()
    
    async def create_character_fitting(self, character_id: int, fitting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new fitting for the character."""
        url = self.ENDPOINTS["create_fitting"].format(character_id=character_id)
        response = await self._make_request("POST", url, authenticated=True, data=fitting_data)
        return response.json()
    
    async def delete_character_fitting(self, character_id: int, fitting_id: int) -> bool:
        """Delete a character fitting."""
        url = self.ENDPOINTS["delete_fitting"].format(character_id=character_id, fitting_id=fitting_id)
        try:
            await self._make_request("DELETE", url, authenticated=True)
            return True
        except ESIError:
            return False
    
    # Utility methods
    
    def get_request_stats(self) -> Dict[str, int]:
        """Get request statistics."""
        return {
            "total_requests": self._request_count,
            "cache_hits": self._cache_hits,
            "cache_hit_ratio": self._cache_hits / max(1, self._request_count),
            "rate_limit_delays": self._rate_limit_delays,
            "error_limit_remaining": self._error_limit_remaining
        }
    
    async def clear_cache(self) -> None:
        """Clear all cached responses."""
        self._response_cache.clear()
        
        # Clear disk cache
        try:
            for cache_file in self._cache_directory.glob("*.json"):
                cache_file.unlink()
            self.logger.info("Cache cleared")
        except Exception as e:
            self.logger.error(f"Failed to clear disk cache: {e}")
    
    async def health_check(self) -> bool:
        """Perform a health check against ESI."""
        try:
            # Simple request to check ESI availability
            await self._make_request("GET", "/v1/status/")
            return True
        except Exception as e:
            self.logger.error(f"ESI health check failed: {e}")
            return False