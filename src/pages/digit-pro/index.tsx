import React, { useEffect, useRef, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { calculateDigitFrequency, DigitFrequencyData, getLastDigit } from '@/utils/frequency-analyzer-service';
import './digit-pro.scss';

const MARKET_OPTIONS = [
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
];

type ConnectionState = 'connected' | 'connecting' | 'error';

interface OverUnderStats {
    over: number;
    under: number;
    overPct: number;
    underPct: number;
    streakType: 'over' | 'under' | 'none';
    streakLength: number;
}

interface MatchDiffStats {
    matches: number;
    differs: number;
    matchPct: number;
    differPct: number;
    streakType: 'match' | 'diff' | 'none';
    streakLength: number;
}

interface EvenOddStats {
    even: number;
    odd: number;
    evenPct: number;
    oddPct: number;
    streakType: 'even' | 'odd' | 'none';
    streakLength: number;
}

interface RiseFallStats {
    rises: number;
    falls: number;
    risePct: number;
    fallPct: number;
    streakType: 'rise' | 'fall' | 'none';
    streakLength: number;
}

const DigitPro: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_100');
    const [sampleSize, setSampleSize] = useState(1000);
    const [frequency, setFrequency] = useState<DigitFrequencyData>({});
    const [lastTick, setLastTick] = useState<number | null>(null);
    const [lastDigit, setLastDigit] = useState<number | null>(null);
    const [tickCount, setTickCount] = useState(0);
    const [warning, setWarning] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connecting');
    const [loading, setLoading] = useState(false);
    const [overUnder, setOverUnder] = useState<OverUnderStats>({
        over: 0,
        under: 0,
        overPct: 0,
        underPct: 0,
        streakType: 'none',
        streakLength: 0,
    });
    const [matchDiff, setMatchDiff] = useState<MatchDiffStats>({
        matches: 0,
        differs: 0,
        matchPct: 0,
        differPct: 0,
        streakType: 'none',
        streakLength: 0,
    });
    const [evenOdd, setEvenOdd] = useState<EvenOddStats>({
        even: 0,
        odd: 0,
        evenPct: 0,
        oddPct: 0,
        streakType: 'none',
        streakLength: 0,
    });
    const [riseFall, setRiseFall] = useState<RiseFallStats>({
        rises: 0,
        falls: 0,
        risePct: 0,
        fallPct: 0,
        streakType: 'none',
        streakLength: 0,
    });
    const [riseFallHistory, setRiseFallHistory] = useState<string[]>([]);

    const derivApiRef = useRef<any>(null);
    const ticksRef = useRef<number[]>([]);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const clearData = () => {
        ticksRef.current = [];
        setFrequency({});
        setTickCount(0);
        setLastTick(null);
        setLastDigit(null);
        setOverUnder({
            over: 0,
            under: 0,
            overPct: 0,
            underPct: 0,
            streakType: 'none',
            streakLength: 0,
        });
        setMatchDiff({
            matches: 0,
            differs: 0,
            matchPct: 0,
            differPct: 0,
            streakType: 'none',
            streakLength: 0,
        });
        setEvenOdd({
            even: 0,
            odd: 0,
            evenPct: 0,
            oddPct: 0,
            streakType: 'none',
            streakLength: 0,
        });
        setRiseFall({
            rises: 0,
            falls: 0,
            risePct: 0,
            fallPct: 0,
            streakType: 'none',
            streakLength: 0,
        });
        setRiseFallHistory([]);
    };

    const calcStreak = (states: string[]): { type: string; length: number } => {
        if (!states.length) return { type: 'none', length: 0 };
        const last = states[states.length - 1];
        let len = 0;
        for (let i = states.length - 1; i >= 0; i -= 1) {
            if (states[i] === last) {
                len += 1;
            } else {
                break;
            }
        }
        return { type: last, length: len };
    };

    const processTicks = (quotes: number[]) => {
        if (!quotes.length) return;
        ticksRef.current = quotes;
        const digits = quotes.map(getLastDigit).filter(d => d >= 0);
        const len = digits.length;
        setTickCount(len);

        const freq = calculateDigitFrequency(quotes);
        setFrequency(freq);

        const latestTick = quotes[quotes.length - 1];
        setLastTick(latestTick);
        setLastDigit(getLastDigit(latestTick));

        const overCount = digits.filter(d => d >= 5).length;
        const underCount = len - overCount;
        const ouStates = digits.map(d => (d >= 5 ? 'over' : 'under'));
        const ouStreak = calcStreak(ouStates);

        setOverUnder({
            over: overCount,
            under: underCount,
            overPct: len ? (overCount / len) * 100 : 0,
            underPct: len ? (underCount / len) * 100 : 0,
            streakType:
                ouStreak.type === 'over' || ouStreak.type === 'under' ? (ouStreak.type as 'over' | 'under') : 'none',
            streakLength: ouStreak.length,
        });

        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = len - evenCount;
        const eoStates = digits.map(d => (d % 2 === 0 ? 'even' : 'odd'));
        const eoStreak = calcStreak(eoStates);

        setEvenOdd({
            even: evenCount,
            odd: oddCount,
            evenPct: len ? (evenCount / len) * 100 : 0,
            oddPct: len ? (oddCount / len) * 100 : 0,
            streakType:
                eoStreak.type === 'even' || eoStreak.type === 'odd' ? (eoStreak.type as 'even' | 'odd') : 'none',
            streakLength: eoStreak.length,
        });

        let matches = 0;
        let differs = 0;
        const mdStates: string[] = [];
        for (let i = 1; i < digits.length; i += 1) {
            if (digits[i] === digits[i - 1]) {
                matches += 1;
                mdStates.push('match');
            } else {
                differs += 1;
                mdStates.push('diff');
            }
        }
        const mdStreak = calcStreak(mdStates);

        setMatchDiff({
            matches,
            differs,
            matchPct: mdStates.length ? (matches / mdStates.length) * 100 : 0,
            differPct: mdStates.length ? (differs / mdStates.length) * 100 : 0,
            streakType:
                mdStreak.type === 'match' || mdStreak.type === 'diff' ? (mdStreak.type as 'match' | 'diff') : 'none',
            streakLength: mdStreak.length,
        });

        let rises = 0;
        let falls = 0;
        const rfStates: string[] = [];
        for (let i = 1; i < quotes.length; i += 1) {
            if (quotes[i] > quotes[i - 1]) {
                rises += 1;
                rfStates.push('rise');
            } else if (quotes[i] < quotes[i - 1]) {
                falls += 1;
                rfStates.push('fall');
            }
        }
        const rfStreak = calcStreak(rfStates);

        const totalMoves = rises + falls;

        const trimmedHistory = rfStates.slice(-10).map(s => (s === 'rise' ? 'R' : 'F'));
        setRiseFallHistory(trimmedHistory);

        setRiseFall({
            rises,
            falls,
            risePct: totalMoves ? (rises / totalMoves) * 100 : 0,
            fallPct: totalMoves ? (falls / totalMoves) * 100 : 0,
            streakType:
                rfStreak.type === 'rise' || rfStreak.type === 'fall' ? (rfStreak.type as 'rise' | 'fall') : 'none',
            streakLength: rfStreak.length,
        });
    };

    useEffect(() => {
        try {
            derivApiRef.current = generateDerivApiInstance();
            setConnectionStatus('connected');
            setWarning(null);
        } catch (err) {
            setConnectionStatus('error');
            setWarning('Failed to initialize Deriv API');
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    useEffect(() => {
        if (!derivApiRef.current || connectionStatus === 'error') return undefined;

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
            pollRef.current = setInterval(() => {
                const handler = (message: any) => {
                    const data = message?.data ? JSON.parse(message.data) : message;
                    if (data.msg_type === 'tick' && data.tick) {
                        const quote = parseFloat(data.tick.quote);
                        ticksRef.current.push(quote);
                        if (ticksRef.current.length > sampleSize) ticksRef.current.shift();
                        processTicks([...ticksRef.current]);
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
            if (pollRef.current) clearInterval(pollRef.current);

            clearData();

            fetchHistory()
                .then((historyResponse: any) => {
                    if (historyResponse.error) throw new Error(historyResponse.error.message || 'API Error');
                    const prices = historyResponse.history?.prices;
                    if (prices?.length) {
                        processTicks(prices.map((p: string) => parseFloat(p)));
                        setConnectionStatus('connected');
                        setWarning(null);
                    } else {
                        setWarning('No tick data received');
                        clearData();
                        throw new Error('No history');
                    }
                })
                .then(() => subscribeTick())
                .then(() => startPolling())
                .catch((err: any) => {
                    console.error('DigitPro fetch error:', err);
                    clearData();
                    setWarning('Failed to fetch live data. Retrying...');
                    setConnectionStatus('connecting');
                    setTimeout(run, 2000);
                })
                .finally(() => setLoading(false));
        };

        run();

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selectedMarket, sampleSize, connectionStatus]);

    const mostFrequentDigit = React.useMemo(() => {
        let maxDigit = 0;
        let maxValue = -1;
        for (let i = 0; i < 10; i += 1) {
            const val = frequency[i] || 0;
            if (val > maxValue) {
                maxValue = val;
                maxDigit = i;
            }
        }
        return maxDigit;
    }, [frequency]);

    const renderDigitCircles = () => {
        const totalDigits = Object.values(frequency).reduce((acc, val) => acc + (val || 0), 0);
        return (
            <div className='dp-circles'>
                {Array.from({ length: 10 }).map((_, idx) => {
                    const freqVal = frequency[idx] || 0;
                    const pct = totalDigits ? (freqVal / totalDigits) * 100 : 0;
                    const isLast = lastDigit === idx;
                    const isTop = mostFrequentDigit === idx && totalDigits > 0;
                    return (
                        <div key={idx} className={`dp-circle ${isTop ? 'top' : ''} ${isLast ? 'last' : ''}`}>
                            <div className='dp-circle-inner'>
                                <div className='dp-digit'>{idx}</div>
                                <div className='dp-pct'>{pct.toFixed(2)}%</div>
                            </div>
                            {isLast && <div className='dp-last-marker' />}
                        </div>
                    );
                })}
            </div>
        );
    };

    const showBlocking = (loading || connectionStatus !== 'connected') && tickCount === 0;

    return (
        <div className='digit-pro-page'>
            <div className='dp-header'>
                <div>
                    <h1>Digit Pattern Studio</h1>
                    <p>Live market digit frequency with over/under, even/odd, match/differ, and rise/fall streaks</p>
                </div>
                <div className={`dp-status ${connectionStatus}`}>
                    <span className='dot' />
                    {connectionStatus === 'connected'
                        ? 'Live'
                        : connectionStatus === 'connecting'
                          ? 'Connecting...'
                          : 'Disconnected'}
                </div>
            </div>

            {warning && (
                <div className='dp-warning'>
                    <span>⚠️ {warning}</span>
                    <button onClick={() => setConnectionStatus('connecting')}>Retry</button>
                </div>
            )}

            <div className='dp-controls'>
                <div className='control'>
                    <label>Market</label>
                    <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)} disabled={loading}>
                        {MARKET_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className='control'>
                    <label>Sample Size: {sampleSize}</label>
                    <input
                        type='range'
                        min={100}
                        max={1000}
                        step={50}
                        value={sampleSize}
                        onChange={e => setSampleSize(parseInt(e.target.value, 10))}
                        disabled={loading}
                    />
                </div>
                <div className='control stats'>
                    <div className='stat-label'>Tick</div>
                    <div className='stat-value'>{lastTick ? lastTick.toFixed(2) : '—'}</div>
                </div>
                <div className='control stats'>
                    <div className='stat-label'>Last Digit</div>
                    <div className='stat-value highlight'>{lastDigit ?? '—'}</div>
                </div>
                <div className='control stats'>
                    <div className='stat-label'>Ticks Count</div>
                    <div className='stat-value'>{tickCount}</div>
                </div>
            </div>
            {showBlocking ? (
                <div className='dp-card dp-blocking'>
                    <div className='blocking-spinner' />
                    <p className='blocking-text'>Connecting to live Deriv ticks…</p>
                </div>
            ) : (
                <>
                    <div className='dp-card'>{renderDigitCircles()}</div>

                    <div className='dp-card split'>
                        <div className='split-header'>
                            <div>
                                <h2>Over / Under Analysis</h2>
                                <p>Digits 5-9 vs 0-4 with current streak</p>
                            </div>
                            <div className='streak'>
                                Current Streak:{' '}
                                <strong>
                                    {overUnder.streakLength}x{' '}
                                    {overUnder.streakType === 'none' ? '—' : overUnder.streakType}
                                </strong>
                            </div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Over</div>
                            <div className='bar-track'>
                                <div className='bar-fill over' style={{ width: `${overUnder.overPct}%` }} />
                            </div>
                            <div className='bar-value'>{overUnder.overPct.toFixed(2)}%</div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Under</div>
                            <div className='bar-track'>
                                <div className='bar-fill under' style={{ width: `${overUnder.underPct}%` }} />
                            </div>
                            <div className='bar-value'>{overUnder.underPct.toFixed(2)}%</div>
                        </div>
                    </div>

                    <div className='dp-card split'>
                        <div className='split-header'>
                            <div>
                                <h2>Even / Odd Analysis</h2>
                                <p>Parity distribution with active streak</p>
                            </div>
                            <div className='streak'>
                                Current Streak:{' '}
                                <strong>
                                    {evenOdd.streakLength}x {evenOdd.streakType === 'none' ? '—' : evenOdd.streakType}
                                </strong>
                            </div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Even</div>
                            <div className='bar-track'>
                                <div className='bar-fill even' style={{ width: `${evenOdd.evenPct}%` }} />
                            </div>
                            <div className='bar-value'>{evenOdd.evenPct.toFixed(2)}%</div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Odd</div>
                            <div className='bar-track'>
                                <div className='bar-fill odd' style={{ width: `${evenOdd.oddPct}%` }} />
                            </div>
                            <div className='bar-value'>{evenOdd.oddPct.toFixed(2)}%</div>
                        </div>
                    </div>

                    <div className='dp-card split'>
                        <div className='split-header'>
                            <div>
                                <h2>Matches / Differs Analysis</h2>
                                <p>Consecutive digit comparison with streak</p>
                            </div>
                            <div className='streak'>
                                Current Streak:{' '}
                                <strong>
                                    {matchDiff.streakLength}x{' '}
                                    {matchDiff.streakType === 'none' ? '—' : matchDiff.streakType}
                                </strong>
                            </div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Matches</div>
                            <div className='bar-track'>
                                <div className='bar-fill match' style={{ width: `${matchDiff.matchPct}%` }} />
                            </div>
                            <div className='bar-value'>{matchDiff.matchPct.toFixed(2)}%</div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Differs</div>
                            <div className='bar-track'>
                                <div className='bar-fill differ' style={{ width: `${matchDiff.differPct}%` }} />
                            </div>
                            <div className='bar-value'>{matchDiff.differPct.toFixed(2)}%</div>
                        </div>
                    </div>

                    <div className='dp-card split'>
                        <div className='split-header'>
                            <div>
                                <h2>Rise / Fall Analysis</h2>
                                <p>Tick-to-tick price moves, last 10 moves shown as R / F</p>
                            </div>
                            <div className='streak'>
                                Current Streak:{' '}
                                <strong>
                                    {riseFall.streakLength}x{' '}
                                    {riseFall.streakType === 'none' ? '—' : riseFall.streakType}
                                </strong>
                            </div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Rise</div>
                            <div className='bar-track'>
                                <div className='bar-fill rise' style={{ width: `${riseFall.risePct}%` }} />
                            </div>
                            <div className='bar-value'>{riseFall.risePct.toFixed(2)}%</div>
                        </div>
                        <div className='bars'>
                            <div className='bar-label'>Fall</div>
                            <div className='bar-track'>
                                <div className='bar-fill fall' style={{ width: `${riseFall.fallPct}%` }} />
                            </div>
                            <div className='bar-value'>{riseFall.fallPct.toFixed(2)}%</div>
                        </div>
                        <div className='rf-history'>
                            <div className='history-label'>Last 10</div>
                            <div className='history-chips'>
                                {riseFallHistory.length === 0 ? (
                                    <span className='history-empty'>No moves yet</span>
                                ) : (
                                    riseFallHistory.map((item, idx) => (
                                        <span
                                            key={`${item}-${idx}`}
                                            className={`chip ${item === 'R' ? 'rise' : 'fall'}`}
                                        >
                                            {item}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DigitPro;
