# Digit Frequency Analyzer

## Overview

The Digit Frequency Analyzer is an advanced market analysis tool that examines the distribution of digits in financial instrument quotes. It provides real-time visualization of digit patterns using historical tick data and live tick streaming.

## Features

### 1. **Market Selection**

- Support for multiple markets:
    - Volatility 100 Index (R_100)
    - Volatility 50 Index (R_50)
    - Volatility 25 Index (R_25)
    - Major FX pairs (EUR/USD, GBP/USD, USD/JPY)

### 2. **Sample Size Configuration**

- Range: 100-1000 ticks
- Adjustable slider for real-time sample size selection
- User-friendly display of current selection

### 3. **Analysis Modes**

#### Static Analysis

- Fetch historical tick data via `ticks_history` API
- Analyze digit distribution from specified sample size
- One-time snapshot of market patterns

#### Live Analysis

- Real-time tick streaming from `ticks` API
- Continuous update of digit frequency as new ticks arrive
- Maintains rolling window of recent ticks

### 4. **Visualization**

#### Bar Chart

- Color-coded bars for each digit (0-9)
- Frequency count on Y-axis
- Percentage display on hover
- Responsive design with Recharts library

#### Distribution Circles

- Color-coded digit circles (10 different colors)
- Size and opacity based on frequency
- Hover effects with detailed statistics
- Displays both count and percentage

### 5. **Statistics Dashboard**

- **Total Ticks**: Number of ticks analyzed
- **Last Tick**: Most recent quote value
- **Last Digit**: Last digit of most recent quote
- **Status**: Live or Static indicator

## Technical Implementation

### Core Components

1. **FrequencyAnalyzerService** (`frequency-analyzer-service.ts`)
    - API integration with Deriv WebSocket
    - Tick data fetching and parsing
    - Digit extraction and frequency calculation
    - Live tick stream subscription management

2. **FrequencyAnalyzer Component** (`index.tsx`)
    - React hooks for state management
    - Market and sample size controls
    - Analysis trigger and live stream toggle
    - Error handling and connection status

3. **Styling** (`frequency-analyzer.scss`)
    - Responsive grid layout
    - SCSS mixins and variables
    - Theme-aware color scheme
    - Animations and transitions

### API Integration

#### WebSocket Connection

```typescript
// Configuration
- App ID: 116109
- API Token: Aqoa9SemmQJFjhU
- WebSocket URL: wss://ws.binaryws.com
```

#### API Calls

**Ticks History:**

```json
{
    "ticks_history": "R_100",
    "count": 500
}
```

**Live Tick Stream:**

```json
{
    "ticks": "R_100"
}
```

### Algorithm

**Last Digit Extraction:**

```typescript
const getLastDigit = (num: number): string => {
    return (Math.floor(num * 100) % 10) + '';
};
```

- Multiply by 100 to handle decimal precision
- Use modulo 10 to extract last digit
- Return as string for consistency

**Frequency Calculation:**

```typescript
const calculateDigitFrequency = (quotes: number[]): DigitFrequencyData => {
    const frequency: DigitFrequencyData = {};

    // Initialize all digits 0-9
    for (let i = 0; i < 10; i++) {
        frequency[i.toString()] = 0;
    }

    // Count occurrences
    quotes.forEach(quote => {
        const digit = getLastDigit(quote);
        frequency[digit]++;
    });

    return frequency;
};
```

## Usage

### Import

```typescript
import FrequencyAnalyzer from '@/pages/frequency-analyzer';
```

### Basic Usage

```tsx
<FrequencyAnalyzer />
```

### Features in Action

1. **Select Market**: Choose from dropdown menu
2. **Set Sample Size**: Adjust slider (100-1000)
3. **Analyze**: Click "Analyze" button for static analysis
4. **Go Live**: Click "Go Live" for real-time streaming

## Data Flow

```
User Input (Market + Sample Size)
    ↓
API Request (ticks_history)
    ↓
Parse Quotes
    ↓
Calculate Digit Frequency
    ↓
Update Chart + Statistics
    ↓
Optional: Subscribe to Live Stream
    ↓
Continuous Updates on New Ticks
```

## Error Handling

- Connection validation before API calls
- Timeout management (30 seconds per request)
- User-friendly error messages
- Graceful degradation on API failures
- Automatic cleanup on component unmount

## Performance Considerations

1. **Memory Management**
    - Maintains max 1000 recent ticks in live mode
    - Efficient digit extraction algorithm
    - Reactive state updates only when data changes

2. **Network Optimization**
    - Single WebSocket connection shared
    - Efficient event listeners cleanup
    - Batched chart updates

3. **UI Rendering**
    - Recharts for efficient chart rendering
    - CSS Grid for responsive layout
    - Hardware-accelerated animations

## Browser Compatibility

- Modern browsers with WebSocket support
- CSS Grid and CSS Variables support
- ES6+ JavaScript features

## Security

- API credentials stored in secure config file
- WebSocket SSL/TLS encryption (wss://)
- No sensitive data exposed in UI
- Sandbox environment credentials only

## Future Enhancements

1. **Advanced Analysis**
    - Digit pair frequency analysis
    - Benford's Law comparison
    - Chi-square goodness of fit test

2. **Export Features**
    - CSV export of analysis data
    - Screenshot of charts
    - Historical analysis comparison

3. **Additional Markets**
    - Commodities (Gold, Oil)
    - Cryptocurrencies
    - Indices and Bonds

4. **Predictive Features**
    - Digit pattern prediction using ML
    - Anomaly detection
    - Pattern-based trading signals

## Troubleshooting

### "WebSocket not connected"

- Check internet connection
- Verify API credentials in config
- Restart browser tab

### Chart not updating in live mode

- Ensure market is actively trading
- Check WebSocket connection status
- Verify browser console for errors

### High CPU usage

- Reduce sample size
- Close other browser tabs
- Disable live mode if not needed

## References

- [Deriv API Documentation](https://developers.deriv.com/api-docs/)
- [Recharts Library](https://recharts.org/)
- [Digit Frequency Analysis](https://en.wikipedia.org/wiki/Benford%27s_law)
