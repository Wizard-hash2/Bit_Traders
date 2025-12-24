/**
 * Deriv Referral Configuration
 * Replace YOUR_AFFILIATE_TOKEN with your actual Deriv affiliate token
 * Get it from: https://deriv.com/partners/affiliate-ib/
 */

export const REFERRAL_CONFIG = {
    // Your Deriv affiliate token
    affiliateToken: 'YOUR_AFFILIATE_TOKEN', // TODO: Replace with your token

    // Tracking parameters for all Deriv links
    utmSource: 'bittraders',
    utmMedium: 'platform',
    utmCampaign: 'trading_bot',
};

/**
 * Add referral tracking to any Deriv URL
 */
export const addReferralTracking = (url: string): string => {
    try {
        const urlObj = new URL(url);

        // Add affiliate token
        if (REFERRAL_CONFIG.affiliateToken !== 'YOUR_AFFILIATE_TOKEN') {
            urlObj.searchParams.set('affiliate_token', REFERRAL_CONFIG.affiliateToken);
        }

        // Add UTM parameters
        urlObj.searchParams.set('utm_source', REFERRAL_CONFIG.utmSource);
        urlObj.searchParams.set('utm_medium', REFERRAL_CONFIG.utmMedium);
        urlObj.searchParams.set('utm_campaign', REFERRAL_CONFIG.utmCampaign);

        return urlObj.toString();
    } catch (error) {
        console.error('Error adding referral tracking:', error);
        return url;
    }
};

/**
 * Set affiliate cookie for API tracking
 */
export const setAffiliateCookie = () => {
    if (REFERRAL_CONFIG.affiliateToken !== 'YOUR_AFFILIATE_TOKEN') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 days
        document.cookie = `affiliate_token=${REFERRAL_CONFIG.affiliateToken}; expires=${expires.toUTCString()}; path=/; domain=.deriv.com`;
    }
};
