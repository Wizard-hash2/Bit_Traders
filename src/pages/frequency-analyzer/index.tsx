import React, { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { calculateDigitFrequency, DigitFrequencyData, getLastDigit } from '@/utils/frequency-analyzer-service';
import './frequency-analyzer.scss';

const MARKET_OPTIONS = [
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
];

const DIGIT_COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
    '#8dd1e1',
    '#d084d0',
    '#ffa07a',
    '#98d8c8',
    '#f7dc6f',
    '#bb8fce',
];

const FrequencyAnalyzer: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_100');
    const [sampleSize, setSampleSize] = useState(500);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastTick, setLastTick] = useState<number | null>(null);
    const [tickCount, setTickCount] = useState(0);
    const [warning, setWarning] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');

    const derivApiRef = useRef<any>(null);
    const ticksRef = useRef<number[]>([]);
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Deriv API connection
    useEffect(() => {
        try {
            derivApiRef.current = generateDerivApiInstance();
            setConnectionStatus('connected');
            setWarning(null);
        } catch (err) {
            console.error('Failed to initialize Deriv API:', err);
            setConnectionStatus('error');
            setWarning('Deriv API unavailable. Using last live data.');
        }

        return () => {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        };
    }, []);

    const updateChartData = (freq: DigitFrequencyData, total: number) => {
        const data = Object.entries(freq)
            .map(([digit, count]) => ({
                digit,
                frequency: count,
                percentage: Number(((count / total) * 100).toFixed(2)),
            }))
            .sort((a, b) => parseInt(a.digit) - parseInt(b.digit));
        setChartData(data);
    };

    // Subscribe to live ticks and update every second
    useEffect(() => {
        if (connectionStatus === 'error') {
            setLoading(false);
            return;
        }

        setLoading(true);

        const subscribeLiveData = async () => {
            try {
                // Request initial ticks_history
                const historyResponse: any = await new Promise((resolve, reject) => {
                    const messageHandler = (message: any) => {
                        const data = message?.data ? JSON.parse(message.data) : message;
                        if (data.msg_type === 'history' || data.error) {
                            derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                            resolve(data);
                        }
                    };

                    derivApiRef.current.connection.addEventListener('message', messageHandler);

                    derivApiRef.current.send({
                        ticks_history: selectedMarket,
                        count: sampleSize,
                        adjust_start_time: 1,
                        end: 'latest',
                        style: 'ticks',
                    });

                    setTimeout(() => {
                        derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                        reject(new Error('Request timeout'));
                    }, 15000);
                });

                if (historyResponse.error) {
                    throw new Error(historyResponse.error.message || 'API Error');
                }

                if (historyResponse.history?.prices) {
                    ticksRef.current = historyResponse.history.prices.map((p: string) => parseFloat(p));
                    (window as any).__shared_ticks__ = ticksRef.current.slice(-1000);
                    const freq = calculateDigitFrequency(ticksRef.current);
                    setFrequency(freq);
                    setTickCount(ticksRef.current.length);
                    setLastTick(ticksRef.current[ticksRef.current.length - 1]);
                    updateChartData(freq, ticksRef.current.length);
                    setConnectionStatus('connected');
                    setWarning(null);
                    setLoading(false);
                }

                // Now subscribe to live ticks
                const tickResponse: any = await new Promise(resolve => {
                    const messageHandler = (message: any) => {
                        const data = message?.data ? JSON.parse(message.data) : message;
                        if (data.msg_type === 'tick' && data.tick) {
                            resolve(data);
                            derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                        }
                    };

                    derivApiRef.current.connection.addEventListener('message', messageHandler);

                    derivApiRef.current.send({
                        ticks: selectedMarket,
                    });
                });

                if (tickResponse.tick) {
                    // Start polling every second
                    updateIntervalRef.current = setInterval(() => {
                        const messageHandler = (message: any) => {
                            const data = message?.data ? JSON.parse(message.data) : message;
                            if (data.msg_type === 'tick' && data.tick) {
                                const newTick = parseFloat(data.tick.quote);
                                ticksRef.current.push(newTick);
                                if (ticksRef.current.length > sampleSize) {
                                    ticksRef.current.shift();
                                }
                                (window as any).__shared_ticks__ = ticksRef.current.slice(-1000);
                                const freq = calculateDigitFrequency(ticksRef.current);
                                setFrequency(freq);
                                setLastTick(newTick);
                                setTickCount(ticksRef.current.length);
                                updateChartData(freq, ticksRef.current.length);
                                derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                            }
                        };

                        derivApiRef.current.connection.addEventListener('message', messageHandler);

                        derivApiRef.current.send({
                            ticks: selectedMarket,
                        });

                        setTimeout(() => {
                            derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                        }, 5000);
                    }, 1000);
                }
            } catch (err) {
                console.error('Error subscribing to live ticks:', err);
                setConnectionStatus('error');
                setWarning('Failed to fetch live data. Showing last available ticks.');
                setLoading(false);
            }
        };

        subscribeLiveData();

        return () => {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        };
    }, [selectedMarket, sampleSize, connectionStatus]);

    const handleRetry = async () => {
        setLoading(true);
        setConnectionStatus('connecting');
        try {
            derivApiRef.current = generateDerivApiInstance();
            setConnectionStatus('connected');
            setWarning(null);
        } catch (err) {
            console.error('Retry failed:', err);
            setConnectionStatus('error');
            setWarning('Deriv API still unavailable. Using last live data.');
            setLoading(false);
        }
    };

    return (
        <div className='frequency-analyzer'>
            <div className='analyzer-header'>
                <h1>Digit Frequency Analyzer</h1>
                <p>
                    Real-time live ticks from Deriv API
                    <span
                        style={{
                            marginLeft: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color:
                                connectionStatus === 'connected'
                                    ? '#00b894'
                                    : connectionStatus === 'connecting'
                                      ? '#ffc658'
                                      : '#ff9aa2',
                        }}
                    >
                        [{connectionStatus}]
                    </span>
                </p>
            </div>

            {warning && (
                <div
                    style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        marginLeft: '1rem',
                        marginRight: '1rem',
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ color: '#856404', fontWeight: 500 }}>⚠️ {warning}</span>
                    {connectionStatus === 'error' && (
                        <button
                            onClick={handleRetry}
                            disabled={loading}
                            style={{
                                padding: '6px 12px',
                                background: loading ? '#ccc' : '#ffc107',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                color: '#333',
                            }}
                        >
                            {loading ? 'Retrying...' : 'Retry'}
                        </button>
                    )}
                </div>
            )}

            <div className='analyzer-controls'>
                <div className='control-group'>
                    <label htmlFor='market-select'>Market:</label>
                    <select
                        id='market-select'
                        value={selectedMarket}
                        onChange={e => setSelectedMarket(e.target.value)}
                        className='select'
                    >
                        {MARKET_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='control-group'>
                    <label htmlFor='sample-size'>Sample Size:</label>
                    <input
                        id='sample-size'
                        type='range'
                        min='100'
                        max='1000'
                        step='50'
                        value={sampleSize}
                        onChange={e => setSampleSize(parseInt(e.target.value))}
                        className='slider'
                    />
                    <span className='sample-display'>{sampleSize}</span>
                </div>

                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            disabled
                            style={{
                                padding: '8px 16px',
                                background: '#4aa8ff',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '14px',
                                    height: '14px',
                                    border: '2px solid #fff',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                            Loading...
                        </button>
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}
            </div>

            <div className='analyzer-content'>
                {tickCount > 0 ? (
                    <>
                        <div className='chart-container'>
                            <h2>Digit Frequency Visualizer</h2>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width='100%' height={400}>
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis
                                            dataKey='digit'
                                            label={{ value: 'Digit', position: 'bottom', offset: 10 }}
                                        />
                                        <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                if (name === 'frequency') return [value, 'Count'];
                                                if (name === 'percentage') return [`${value}%`, 'Percentage'];
                                                return value;
                                            }}
                                            contentStyle={{
                                                backgroundColor: 'var(--general-main-1)',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '4px',
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey='frequency' name='Frequency' radius={[8, 8, 0, 0]}>
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={DIGIT_COLORS[index]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className='chart-placeholder'>
                                    <p>📊 Processing data...</p>
                                </div>
                            )}
                        </div>

                        <div className='statistics-section'>
                            <h3>Statistics</h3>
                            <div className='stats-grid'>
                                <div className='stat-card'>
                                    <span className='stat-label'>Total Ticks</span>
                                    <span className='stat-value'>{tickCount || '-'}</span>
                                </div>
                                <div className='stat-card'>
                                    <span className='stat-label'>Last Tick</span>
                                    <span className='stat-value'>{lastTick !== null ? lastTick.toFixed(4) : '-'}</span>
                                </div>
                                <div className='stat-card'>
                                    <span className='stat-label'>Last Digit</span>
                                    <span className='stat-value'>
                                        {lastTick !== null ? getLastDigit(lastTick) : '-'}
                                    </span>
                                </div>
                                <div className='stat-card'>
                                    <span className='stat-label'>Status</span>
                                    <span className={`stat-value ${connectionStatus === 'connected' ? 'live' : ''}`}>
                                        {connectionStatus === 'connected' ? '🔴 LIVE' : '⏹ BUFFERED'}
                                    </span>
                                </div>
                            </div>

                            <div className='digit-distribution'>
                                <h4>Distribution Details</h4>
                                {chartData.length > 0 ? (
                                    <div className='digit-circles'>
                                        {chartData.map((item, index) => (
                                            <div
                                                key={item.digit}
                                                className='digit-circle'
                                                style={{
                                                    backgroundColor: DIGIT_COLORS[index],
                                                    opacity:
                                                        0.8 +
                                                        (item.frequency /
                                                            Math.max(...chartData.map(d => d.frequency))) *
                                                            0.2,
                                                }}
                                                title={`${item.digit}: ${item.frequency} (${item.percentage}%)`}
                                            >
                                                <span className='digit-number'>{item.digit}</span>
                                                <span className='digit-percent'>{item.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='distribution-placeholder'>
                                        <p>🎯 Digit distribution will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            padding: '48px',
                            textAlign: 'center',
                            background: '#f5f7fa',
                            borderRadius: '8px',
                            margin: '1rem',
                        }}
                    >
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#3a5580', marginBottom: '8px' }}>
                            {loading ? '⏳ Fetching live data...' : '⚠️ No data available'}
                        </div>
                        <p style={{ color: '#7a8fa8', margin: 0 }}>
                            {loading
                                ? 'Connecting to Deriv API and retrieving tick history.'
                                : 'Unable to fetch data from Deriv API. Please check your connection or retry.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrequencyAnalyzer;
