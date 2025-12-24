/**
 * Digit Frequency Analyzer Service
 * Handles API calls for ticks history and tick stream
 */

export interface TicksHistoryRequest {
    ticks_history: string; // Symbol (e.g., 'R_100')
    count: number; // Number of ticks (1-10000)
    start?: number; // Optional start time
}

export interface TicksHistoryResponse {
    ticks_history?: {
        times: number[];
        quotes: number[];
    };
    subscription?: {
        id: string;
    };
    error?: {
        code: string;
        message: string;
    };
}

export interface DigitFrequencyData {
    [digit: string]: number; // e.g., {'0': 100, '1': 95, ...}
}

/**
 * Extract last digit from a number
 */
export const getLastDigit = (num: number): number => {
    return Math.floor(num * 100) % 10;
};

/**
 * Calculate digit frequency distribution
 */
export const calculateDigitFrequency = (quotes: number[]): DigitFrequencyData => {
    const frequency: DigitFrequencyData = {};

    // Initialize all digits 0-9
    for (let i = 0; i < 10; i++) {
        frequency[i.toString()] = 0;
    }

    // Count occurrences of each last digit
    quotes.forEach(quote => {
        const digit = getLastDigit(quote);
        const key = digit.toString();
        frequency[key]++;
    });

    return frequency;
};

/**
 * Fetch ticks history from Deriv API
 */
export const fetchTicksHistory = async (
    ws: WebSocket,
    symbol: string,
    count: number
): Promise<TicksHistoryResponse> => {
    return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.ticks_history || data.error) {
                    ws.removeEventListener('message', messageHandler);
                    resolve(data);
                }
            } catch (error) {
                reject(error);
            }
        };

        ws.addEventListener('message', messageHandler);

        const request: TicksHistoryRequest = {
            ticks_history: symbol,
            count: Math.min(count, 10000), // Max 10000 ticks per API limit
        };

        ws.send(JSON.stringify(request));

        // Timeout after 30 seconds
        setTimeout(() => {
            ws.removeEventListener('message', messageHandler);
            reject(new Error('Ticks history request timeout'));
        }, 30000);
    });
};

/**
 * Subscribe to tick stream for live updates
 */
export const subscribeToTickStream = (
    ws: WebSocket,
    symbol: string,
    callback: (frequency: DigitFrequencyData, latestTick: number) => void
): string => {
    const subscriptionId = `${symbol}_${Date.now()}`;
    const quotes: number[] = [];

    const messageHandler = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

            if (data.tick && data.tick.symbol === symbol) {
                const quote = data.tick.quote;
                quotes.push(quote);

                // Keep only recent ticks (last 1000)
                if (quotes.length > 1000) {
                    quotes.shift();
                }

                // Calculate and update frequency
                const frequency = calculateDigitFrequency(quotes);
                callback(frequency, quote);
            }
        } catch (error) {
            console.error('Error processing tick stream:', error);
        }
    };

    // Subscribe to ticks stream
    const request = {
        ticks: symbol,
    };

    ws.addEventListener('message', messageHandler);
    ws.send(JSON.stringify(request));

    // Return unsubscribe function wrapper
    return subscriptionId;
};

/**
 * Unsubscribe from tick stream
 */
export const unsubscribeFromTickStream = (ws: WebSocket, symbol: string) => {
    const request = {
        forget: symbol,
    };
    ws.send(JSON.stringify(request));
};
