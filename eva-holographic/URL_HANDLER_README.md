# EVA Custom URL Protocol Handler

This document describes the implementation and usage of the custom URL protocol handler for EVE Online OAuth2 authentication in EVA.

## Overview

The EVA application now supports a custom URL protocol `eveauth-eva://` that allows seamless OAuth2 authentication without requiring a local HTTP server. When EVE Online redirects back to your application after authentication, it will use this custom protocol to launch EVA and pass the authorization code.

## Protocol Details

- **Protocol Scheme**: `eveauth-eva://`
- **Callback URL**: `eveauth-eva://callback`
- **Supported Platforms**: Windows and macOS

## Installation and Setup

### Automatic Setup

The protocol is automatically registered when you run EVA for the first time. No manual setup is required.

### Manual Setup

If automatic registration fails, you can manually register the protocol:

```bash
# From the eva-holographic directory
python setup_protocol.py
```

### Testing the Protocol

Test the protocol handler independently:

```bash
# From the eva-holographic directory
python test_url_handler.py
```

## How It Works

1. **Protocol Registration**: When EVA starts, it registers the `eveauth-eva://` protocol with the operating system
2. **Authentication Flow**: When user clicks "Authenticate", EVA:
   - Generates OAuth2 authorization URL with PKCE challenge
   - Opens the URL in the default web browser
   - Waits for callback
3. **Callback Handling**: When EVE Online redirects to `eveauth-eva://callback?code=...&state=...`:
   - Operating system launches EVA with the URL as a command line argument
   - EVA processes the callback URL and extracts the authorization code
   - EVA exchanges the code for access tokens
   - Authentication completes

## Platform-Specific Implementation

### Windows

- Uses Windows Registry to register the protocol
- Registry key: `HKEY_CURRENT_USER\Software\Classes\eveauth-eva`
- Command: `"<path_to_eva>" --oauth-callback "%1"`

### macOS

- Uses Launch Services to register the protocol
- Attempts to set EVA as the default handler for `eveauth-eva://` URLs
- May require user permissions for first-time registration

## Code Architecture

### Key Components

1. **URLProtocolHandler** (`src/eva/api/url_handler.py`)
   - Handles protocol registration
   - Processes callback URLs
   - Manages callback state

2. **AuthenticationManager** (`src/eva/api/auth_manager.py`)
   - Coordinates between SSO and URL handler
   - Manages authentication flow
   - Provides signals for UI updates

3. **SSOAuthenticator** (`src/eva/api/sso_auth.py`)
   - Handles OAuth2 PKCE flow
   - Validates JWT tokens
   - Manages token refresh

### Signal Flow

```
User clicks "Authenticate"
    ↓
AuthenticationManager.start_authentication()
    ↓
SSOAuthenticator.generate_authorization_url()
    ↓
Open URL in browser
    ↓
User authenticates with EVE Online
    ↓
EVE redirects to eveauth-eva://callback?code=...
    ↓
OS launches EVA with callback URL
    ↓
URLProtocolHandler.process_callback_url()
    ↓
AuthenticationManager._on_callback_received()
    ↓
SSOAuthenticator.exchange_code_for_tokens()
    ↓
Authentication complete
```

## Configuration

The callback URL is configured in `src/eva/core/config.py`:

```python
class ESIConfig(BaseModel):
    redirect_uri: str = "eveauth-eva://callback"
```

## Troubleshooting

### Protocol Not Registered

**Symptoms**: Browser shows "Protocol not supported" or similar error

**Solutions**:
1. Run `python setup_protocol.py` to manually register
2. Restart EVA to trigger automatic registration
3. Check OS-specific permissions

### Authentication Timeout

**Symptoms**: Authentication process times out after 5 minutes

**Solutions**:
1. Complete authentication within 5 minutes
2. Check if callback URL is being received
3. Verify protocol registration

### Command Line Arguments Not Processed

**Symptoms**: EVA launches but doesn't process OAuth callback

**Solutions**:
1. Check if EVA is already running (may prevent new instance)
2. Verify command line argument format
3. Check logs for processing errors

### macOS Specific Issues

**Symptoms**: Protocol registration appears to succeed but callbacks don't work

**Solutions**:
1. Grant necessary permissions in System Preferences
2. Try running EVA with administrator privileges once
3. Use Console.app to check for system-level errors

### Windows Specific Issues

**Symptoms**: Registry entries created but protocol doesn't work

**Solutions**:
1. Check if antivirus is blocking the registration
2. Verify registry entries manually using `regedit`
3. Try running as administrator

## Security Considerations

1. **PKCE Flow**: Uses OAuth2 PKCE to avoid storing client secrets
2. **State Validation**: Validates state parameter to prevent CSRF attacks
3. **JWT Verification**: Validates all JWT tokens against ESI JWKS
4. **Timeout Protection**: 5-minute timeout for authentication flow
5. **Secure Storage**: Tokens stored using Tauri's credential store

## Development Notes

### Adding New Platforms

To support additional platforms:

1. Add platform detection in `URLProtocolHandler._register_protocol()`
2. Implement platform-specific registration method
3. Add platform-specific check method
4. Update documentation

### Testing

The URL handler includes comprehensive testing:

- Unit tests for URL parsing
- Integration tests with Qt application
- Manual testing with `test_url_handler.py`
- End-to-end authentication flow testing

### Debugging

Enable debug logging to troubleshoot issues:

```python
import logging
logging.getLogger('eva.api').setLevel(logging.DEBUG)
```

## Future Enhancements

1. **Deep Linking**: Support for additional protocol paths
2. **Multi-Character**: Handle multiple character authentication
3. **Session Persistence**: Remember authentication across app restarts
4. **Advanced Error Handling**: More specific error messages and recovery
5. **Protocol Versioning**: Support for protocol version negotiation