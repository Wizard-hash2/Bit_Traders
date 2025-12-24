/**
 * Deriv API Configuration
 * Stores App ID and API Token for WebSocket connections
 *
 * Security Note: In production, these credentials should be stored in:
 * - Environment variables (.env files)
 * - Secure backend API endpoints
 * - Not hardcoded in client-side code
 */

export const API_CONFIG = {
    // Deriv WebSocket App ID
    // Use this in the WebSocket URL query params: wss://ws.binaryws.com?app_id=YOUR_APP_ID
    appId: '116109',

    // Deriv API Token
    // Use this in the 'authorize' request payload immediately after connection opens
    apiToken: 'Aqoa9SemmQJFjhU',

    // WebSocket URL for Deriv API
    wsUrl: 'wss://ws.binaryws.com',

    // Connection timeout (milliseconds)
    connectionTimeout: 30000,

    // Maximum reconnection attempts
    maxReconnectAttempts: 5,

    // Reconnection delay (milliseconds)
    reconnectionDelay: 3000,
};

/**
 * Build WebSocket URL with App ID
 */
export const getWebSocketUrl = (): string => {
    return `${API_CONFIG.wsUrl}?app_id=${API_CONFIG.appId}`;
};

/**
 * Get authorization payload for Deriv API
 */
export const getAuthPayload = () => {
    return {
        authorize: API_CONFIG.apiToken,
    };
};

/**
 * Validate API configuration
 */
export const validateApiConfig = (): boolean => {
    if (!API_CONFIG.appId) {
        console.error('API Configuration Error: appId is missing');
        return false;
    }
    if (!API_CONFIG.apiToken) {
        console.error('API Configuration Error: apiToken is missing');
        return false;
    }
    return true;
};
