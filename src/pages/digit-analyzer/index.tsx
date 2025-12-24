import React, { useEffect, useRef, useState } from 'react';
import DigitAnalyzer from '@/components/digit-analyzer/DigitAnalyzer';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';

const DigitAnalyzerPage: React.FC = () => {
    const [ticks, setTicks] = useState<number[]>([]);
    const [market, setMarket] = useState('R_100');
    const [range, setRange] = useState(100);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>(
        'connecting'
    );
    const [warning, setWarning] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
                        ticks_history: market,
                        count: range + 500,
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
                    setTicks([...ticksRef.current]);
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
                        ticks: market,
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
                                if (ticksRef.current.length > range + 500) {
                                    ticksRef.current.shift();
                                }
                                setTicks([...ticksRef.current]);
                                derivApiRef.current?.connection?.removeEventListener?.('message', messageHandler);
                            }
                        };

                        derivApiRef.current.connection.addEventListener('message', messageHandler);

                        derivApiRef.current.send({
                            ticks: market,
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
    }, [market, range, connectionStatus]);

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
        <div style={{ padding: '1rem' }}>
            <h1 style={{ margin: '0 0 12px 0' }}>Market Digit Analyzer</h1>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-less-prominent)' }}>
                Real-time live ticks from Deriv API. Select market and tick count to analyze patterns.
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

            {warning && (
                <div
                    style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
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

            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                        Market:
                    </label>
                    <select
                        value={market}
                        onChange={e => setMarket(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '0.95rem',
                        }}
                    >
                        <option value='R_100'>Volatility 100 Index</option>
                        <option value='R_50'>Volatility 50 Index</option>
                        <option value='R_25'>Volatility 25 Index</option>
                        <option value='EURUSD'>EUR/USD</option>
                        <option value='GBPUSD'>GBP/USD</option>
                        <option value='USDJPY'>USD/JPY</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                        Number of Ticks:
                    </label>
                    <select
                        value={range}
                        onChange={e => setRange(Number(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '0.95rem',
                        }}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                    </select>
                </div>

                {loading && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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

            {ticks.length > 0 ? (
                <DigitAnalyzer ticks={ticks} defaultRange={range} />
            ) : (
                <div style={{ padding: '48px', textAlign: 'center', background: '#f5f7fa', borderRadius: '8px' }}>
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
    );
};

export default DigitAnalyzerPage;
