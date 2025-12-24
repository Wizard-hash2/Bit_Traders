import React, { useEffect, useRef, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { calculateDigitFrequency, DigitFrequencyData, getLastDigit } from '@/utils/frequency-analyzer-service';
import './digit-statistics.scss';

const MARKET_OPTIONS = [
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
];

interface DigitStats {
    digit: number;
    frequency: number;
    percentage: number;
    rank: number;
    trend: 'up' | 'down' | 'stable';
    consecutiveCount: number;
}

const DigitStatistics: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_100');
    const [sampleSize, setSampleSize] = useState(500);
    const [frequency, setFrequency] = useState<DigitFrequencyData>({});
    const [digitStats, setDigitStats] = useState<DigitStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastTick, setLastTick] = useState<number | null>(null);
    const [lastDigit, setLastDigit] = useState<number | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
    const [tickCount, setTickCount] = useState(0);
    const [mostFrequent, setMostFrequent] = useState<number | null>(null);
    const [leastFrequent, setLeastFrequent] = useState<number | null>(null);

    const derivApiRef = useRef<any>(null);
    const ticksRef = useRef<number[]>([]);
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousFrequencyRef = useRef<DigitFrequencyData>({});

    // Initialize Deriv API connection
    useEffect(() => {
        try {
            derivApiRef.current = generateDerivApiInstance();
            setConnectionStatus('connected');
            setWarning(null);
        } catch (err) {
            setConnectionStatus('error');
            setWarning('Failed to initialize API connection');
        }

        return () => {
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
        };
    }, []);

    const processTickData = (quotes: number[]) => {
        ticksRef.current = quotes;
        const currentFreq = calculateDigitFrequency(quotes);
        setFrequency(currentFreq);

        const lastTickValue = quotes[quotes.length - 1];
        setLastTick(lastTickValue);
        setLastDigit(Number(getLastDigit(lastTickValue)));
        setTickCount(quotes.length);

        // Calculate digit statistics with trends
        // const stats: DigitStats[] = [];
        const sorted = [];
        for (let i = 0; i < 10; i++) {
            const count = currentFreq[i] || 0;
            const prevCount = previousFrequencyRef.current[i] || 0;
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (count > prevCount) trend = 'up';
            if (count < prevCount) trend = 'down';

            sorted.push({
                digit: i,
                frequency: count,
                percentage: quotes.length > 0 ? (count / quotes.length) * 100 : 0,
                rank: 0,
                trend,
                consecutiveCount: 0,
            });
        }

        // Assign ranks
        sorted.sort((a, b) => b.frequency - a.frequency);
        sorted.forEach((s, idx) => {
            s.rank = idx + 1;
        });

        setDigitStats(sorted);
        setMostFrequent(sorted[0]?.digit ?? null);
        setLeastFrequent(sorted[sorted.length - 1]?.digit ?? null);
        previousFrequencyRef.current = currentFreq;
    };

    // Subscribe to live ticks using WebSocket message pattern
    useEffect(() => {
        if (!derivApiRef.current || connectionStatus === 'error') return;

        setLoading(true);

        const fetchHistory = () =>
            new Promise<any>((resolve, reject) => {
                const handler = (message: any) => {
                    const data = message?.data ? JSON.parse(message.data) : message;
                    if (data.msg_type === 'history' || data.error) {
                        derivApiRef.current?.connection?.removeEventListener?.('message', handler);
                        resolve(data);
                    }
                };

                derivApiRef.current.connection.addEventListener('message', handler);

                derivApiRef.current.send({
                    ticks_history: selectedMarket,
                    adjust_start_time: 1,
                    count: Math.min(sampleSize, 1000),
                    end: 'latest',
                    style: 'ticks',
                });

                setTimeout(() => {
                    derivApiRef.current?.connection?.removeEventListener?.('message', handler);
                    reject(new Error('Request timeout'));
                }, 10000);
            });

        const subscribeTick = () =>
            new Promise<any>(resolve => {
                const handler = (message: any) => {
                    const data = message?.data ? JSON.parse(message.data) : message;
                    if (data.msg_type === 'tick' && data.tick) {
                        derivApiRef.current?.connection?.removeEventListener?.('message', handler);
                        resolve(data);
                    }
                };

                derivApiRef.current.connection.addEventListener('message', handler);
                derivApiRef.current.send({ ticks: selectedMarket });
            });

        const startPolling = () => {
            updateIntervalRef.current = setInterval(() => {
                const handler = (message: any) => {
                    const data = message?.data ? JSON.parse(message.data) : message;
                    if (data.msg_type === 'tick' && data.tick) {
                        const quote = parseFloat(data.tick.quote);
                        ticksRef.current.push(quote);
                        if (ticksRef.current.length > sampleSize) ticksRef.current.shift();
                        processTickData([...ticksRef.current]);
                    }
                };

                derivApiRef.current.connection.addEventListener('message', handler);
                derivApiRef.current.send({ ticks: selectedMarket });

                setTimeout(() => {
                    derivApiRef.current?.connection?.removeEventListener?.('message', handler);
                }, 1200);
            }, 1000);
        };

        const run = () => {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

            fetchHistory()
                .then((historyResponse: any) => {
                    if (historyResponse.error) throw new Error(historyResponse.error.message || 'API Error');
                    const prices = historyResponse.history?.prices;
                    if (prices?.length) {
                        const quotes = prices.map((p: string) => parseFloat(p));
                        processTickData(quotes);
                        previousFrequencyRef.current = calculateDigitFrequency(quotes);
                        setConnectionStatus('connected');
                        setWarning(null);
                    } else {
                        throw new Error('No history');
                    }
                })
                .then(() => subscribeTick())
                .then(() => startPolling())
                .catch((err: any) => {
                    console.error('Statistics fetch error:', err);
                    setWarning('Failed to fetch live data. Retrying...');
                    setConnectionStatus('connecting');
                    setTimeout(run, 2000);
                })
                .finally(() => setLoading(false));
        };

        run();

        return () => {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        };
    }, [selectedMarket, sampleSize, connectionStatus]);

    const handleRetry = () => {
        setConnectionStatus('connecting');
        setWarning(null);
        try {
            derivApiRef.current = generateDerivApiInstance();
            setConnectionStatus('connected');
        } catch (err) {
            console.error('Retry failed:', err);
            setConnectionStatus('error');
            setWarning('Failed to initialize API connection');
        }
    };

    return (
        <div className='digit-stats-container'>
            <div className='ds-header'>
                <div className='ds-header-content'>
                    <h1>📊 Digit Statistics Dashboard</h1>
                    <p>Real-time digit frequency analysis with statistical insights</p>
                </div>
                <div
                    className='ds-connection-badge'
                    style={{
                        background:
                            connectionStatus === 'connected'
                                ? '#10b981'
                                : connectionStatus === 'connecting'
                                  ? '#f59e0b'
                                  : '#ef4444',
                    }}
                >
                    <div className='pulse'></div>
                    {connectionStatus === 'connected'
                        ? 'Live'
                        : connectionStatus === 'connecting'
                          ? 'Connecting...'
                          : 'Disconnected'}
                </div>
            </div>

            {warning && (
                <div className='ds-warning-banner'>
                    <span>⚠️ {warning}</span>
                    <button onClick={handleRetry} className='retry-btn'>
                        Retry
                    </button>
                </div>
            )}

            <div className='ds-controls'>
                <div className='control-group'>
                    <label>Market</label>
                    <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)} disabled={loading}>
                        {MARKET_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className='control-group'>
                    <label>Sample Size: {sampleSize}</label>
                    <input
                        type='range'
                        min='50'
                        max='1000'
                        step='50'
                        value={sampleSize}
                        onChange={e => setSampleSize(parseInt(e.target.value))}
                        disabled={loading}
                    />
                </div>
                <div className='control-group'>
                    <label>Ticks: {tickCount}</label>
                </div>
            </div>

            {frequency && Object.keys(frequency).length > 0 ? (
                <div className='ds-content'>
                    {/* Circle Visualization */}
                    <div className='ds-section circle-section'>
                        <h2>Digit Frequency Circles</h2>
                        <div className='circles-grid'>
                            {digitStats.map(stat => {
                                const size = 60 + stat.percentage * 2;
                                const opacity = 0.3 + stat.percentage / 100;
                                const isHighlight = stat.digit === lastDigit || stat.digit === mostFrequent;

                                return (
                                    <div key={stat.digit} className='circle-item'>
                                        <div
                                            className={`circle ${isHighlight ? 'highlight' : ''} ${stat.trend === 'up' ? 'trending-up' : stat.trend === 'down' ? 'trending-down' : ''}`}
                                            style={{
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                opacity,
                                            }}
                                        >
                                            <span className='digit-number'>{stat.digit}</span>
                                            {stat.digit === lastDigit && <div className='last-indicator'>●</div>}
                                        </div>
                                        <div className='circle-stats'>
                                            <div className='percentage'>{stat.percentage.toFixed(1)}%</div>
                                            <div className='frequency'>{stat.frequency}x</div>
                                            <div className={`trend-indicator ${stat.trend}`}>
                                                {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Statistics Table */}
                    <div className='ds-section stats-section'>
                        <h2>Ranked Statistics</h2>
                        <div className='stats-table'>
                            <div className='table-header'>
                                <div className='col rank'>Rank</div>
                                <div className='col digit'>Digit</div>
                                <div className='col frequency'>Frequency</div>
                                <div className='col percentage'>Percentage</div>
                                <div className='col trend'>Trend</div>
                            </div>
                            {digitStats.slice(0, 10).map(stat => (
                                <div
                                    key={stat.digit}
                                    className={`table-row ${stat.digit === mostFrequent ? 'most-frequent' : stat.digit === leastFrequent ? 'least-frequent' : ''}`}
                                >
                                    <div className='col rank'>#{stat.rank}</div>
                                    <div className='col digit'>{stat.digit}</div>
                                    <div className='col frequency'>{stat.frequency}</div>
                                    <div className='col percentage'>{stat.percentage.toFixed(2)}%</div>
                                    <div className='col trend'>
                                        <span className={`trend-badge ${stat.trend}`}>
                                            {stat.trend === 'up'
                                                ? '↑ Up'
                                                : stat.trend === 'down'
                                                  ? '↓ Down'
                                                  : '→ Stable'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className='ds-section summary-section'>
                        <div className='summary-card'>
                            <div className='summary-label'>Current Tick</div>
                            <div className='summary-value'>{lastTick?.toFixed(2)}</div>
                        </div>
                        <div className='summary-card'>
                            <div className='summary-label'>Last Digit</div>
                            <div className='summary-value highlight-digit'>{lastDigit}</div>
                        </div>
                        <div className='summary-card'>
                            <div className='summary-label'>Most Frequent</div>
                            <div className='summary-value highlight-digit'>{mostFrequent}</div>
                            <div className='summary-sublabel'>{digitStats[0]?.percentage.toFixed(1)}%</div>
                        </div>
                        <div className='summary-card'>
                            <div className='summary-label'>Least Frequent</div>
                            <div className='summary-value highlight-digit'>{leastFrequent}</div>
                            <div className='summary-sublabel'>
                                {digitStats[digitStats.length - 1]?.percentage.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='ds-loading'>
                    <div className='loading-spinner'></div>
                    <p>{loading ? '⏳ Fetching live market data...' : '📍 Initializing analysis...'}</p>
                </div>
            )}
        </div>
    );
};

export default DigitStatistics;
