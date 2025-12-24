import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './digit-analyzer.scss';

type DigitAnalyzerProps = {
    ticks: number[];
    defaultRange?: 100 | 500 | 1000 | 50 | 25;
};

type AnalysisMode = 'even_odd' | 'over_under' | 'match_differ' | 'rise_fall';

// const RANGE_OPTIONS = [25, 50, 100, 500, 1000] as const;
// const MARKETS = [
//   { value: 'R_100', label: 'Volatility 100 Index' },
//   { value: 'R_50', label: 'Volatility 50 Index' },
//   { value: 'R_25', label: 'Volatility 25 Index' },
//   { value: 'EURUSD', label: 'EUR/USD' },
// ];

const extractLastDigit = (price: number): number => {
    const d = Math.floor(price * 100) % 10;
    return d < 0 ? -d : d;
};

const analyzeEvenOdd = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    let even = 0,
        odd = 0;
    for (const p of recent) {
        const d = extractLastDigit(p);
        if (d % 2 === 0) even++;
        else odd++;
    }
    const total = recent.length || 1;
    return {
        even: +((even * 100) / total).toFixed(2),
        odd: +((odd * 100) / total).toFixed(2),
        trend: even > odd ? 'Even' : 'Odd',
    };
};

const analyzeOverUnder = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    const midpoint = (Math.min(...recent) + Math.max(...recent)) / 2;
    let over = 0,
        under = 0;
    for (const p of recent)
        if (p > midpoint) over++;
        else under++;
    const total = recent.length || 1;
    return {
        over: +((over * 100) / total).toFixed(2),
        under: +((under * 100) / total).toFixed(2),
        trend: over > under ? 'Over' : 'Under',
        midpoint,
    };
};

const analyzeMatchDiffer = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    if (recent.length < 2) return { match: 0, differ: 0, trend: 'N/A' };
    let match = 0,
        differ = 0;
    for (let i = 1; i < recent.length; i++) {
        const d1 = extractLastDigit(recent[i - 1]);
        const d2 = extractLastDigit(recent[i]);
        if (d1 === d2) match++;
        else differ++;
    }
    const total = match + differ || 1;
    return {
        match: +((match * 100) / total).toFixed(2),
        differ: +((differ * 100) / total).toFixed(2),
        trend: match > differ ? 'Match' : 'Differ',
        pairs: recent,
    };
};

const analyzeRiseFall = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    if (recent.length < 2) return { rise: 0, fall: 0, trend: 'N/A' };
    let rise = 0,
        fall = 0;
    for (let i = 1; i < recent.length; i++) {
        if (recent[i] > recent[i - 1]) rise++;
        else fall++;
    }
    const total = rise + fall || 1;
    return {
        rise: +((rise * 100) / total).toFixed(2),
        fall: +((fall * 100) / total).toFixed(2),
        trend: rise > fall ? 'Rise' : 'Fall',
        pairs: recent,
    };
};

const getDigitFreq = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    const counts = new Array(10).fill(0);
    for (const p of recent) counts[extractLastDigit(p)]++;
    const total = recent.length || 1;
    return counts.map((c, i) => ({
        digit: String(i),
        frequency: +((c * 100) / total).toFixed(2),
        count: c,
    }));
};

const getOverUnderDigitFreq = (prices: number[], range: number, midpoint: number) => {
    const recent = prices.slice(-range);
    const overCounts = new Array(10).fill(0);
    const underCounts = new Array(10).fill(0);
    let overTotal = 0;
    let underTotal = 0;
    for (const p of recent) {
        const d = extractLastDigit(p);
        if (p > midpoint) {
            overCounts[d]++;
            overTotal++;
        } else {
            underCounts[d]++;
            underTotal++;
        }
    }
    const overData = overCounts.map((c, i) => ({
        digit: String(i),
        frequency: overTotal ? +((c * 100) / overTotal).toFixed(2) : 0,
        count: c,
    }));
    const underData = underCounts.map((c, i) => ({
        digit: String(i),
        frequency: underTotal ? +((c * 100) / underTotal).toFixed(2) : 0,
        count: c,
    }));
    return { overData, underData };
};

const getMatchDifferDigitFreq = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    const matchCounts = new Array(10).fill(0);
    const differCounts = new Array(10).fill(0);
    let matchTotal = 0;
    let differTotal = 0;
    for (let i = 1; i < recent.length; i++) {
        const prev = extractLastDigit(recent[i - 1]);
        const curr = extractLastDigit(recent[i]);
        if (prev === curr) {
            matchCounts[curr]++;
            matchTotal++;
        } else {
            differCounts[curr]++;
            differTotal++;
        }
    }
    const matchData = matchCounts.map((c, i) => ({
        digit: String(i),
        frequency: matchTotal ? +((c * 100) / matchTotal).toFixed(2) : 0,
        count: c,
    }));
    const differData = differCounts.map((c, i) => ({
        digit: String(i),
        frequency: differTotal ? +((c * 100) / differTotal).toFixed(2) : 0,
        count: c,
    }));
    return { matchData, differData };
};

const getRiseFallDigitFreq = (prices: number[], range: number) => {
    const recent = prices.slice(-range);
    const riseCounts = new Array(10).fill(0);
    const fallCounts = new Array(10).fill(0);
    let riseTotal = 0;
    let fallTotal = 0;
    for (let i = 1; i < recent.length; i++) {
        // const prev = extractLastDigit(recent[i - 1]);
        const curr = extractLastDigit(recent[i]);
        if (recent[i] > recent[i - 1]) {
            riseCounts[curr]++;
            riseTotal++;
        } else {
            fallCounts[curr]++;
            fallTotal++;
        }
    }
    const riseData = riseCounts.map((c, i) => ({
        digit: String(i),
        frequency: riseTotal ? +((c * 100) / riseTotal).toFixed(2) : 0,
        count: c,
    }));
    const fallData = fallCounts.map((c, i) => ({
        digit: String(i),
        frequency: fallTotal ? +((c * 100) / fallTotal).toFixed(2) : 0,
        count: c,
    }));
    return { riseData, fallData };
};

export const DigitAnalyzer: React.FC<DigitAnalyzerProps> = ({ ticks, defaultRange = 100 }) => {
    const [range] = useState<number>(defaultRange);
    const [mode, setMode] = useState<AnalysisMode>('even_odd');
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    const lastUpdateRef = useRef<number>(0);

    const sliced = useMemo(() => ticks.slice(-range), [ticks, range]);

    useEffect(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 500) return;
        lastUpdateRef.current = now;
        if (sliced.length > 0) setCurrentPrice(sliced[sliced.length - 1]);
    }, [sliced]);

    const analysis = useMemo(() => {
        if (mode === 'even_odd') return analyzeEvenOdd(sliced, range);
        if (mode === 'over_under') return analyzeOverUnder(sliced, range);
        if (mode === 'match_differ') return analyzeMatchDiffer(sliced, range);
        if (mode === 'rise_fall') return analyzeRiseFall(sliced, range);
        return { even: 0, odd: 0, trend: 'N/A' };
    }, [sliced, range, mode]);

    const digitFreq = useMemo(() => getDigitFreq(sliced, range), [sliced, range]);
    const overUnderDigitFreq = useMemo(() => {
        if (mode !== 'over_under' || !('midpoint' in analysis)) return null;
        return getOverUnderDigitFreq(sliced, range, (analysis as any).midpoint);
    }, [mode, analysis, sliced, range]);
    const matchDifferDigitFreq = useMemo(() => {
        if (mode !== 'match_differ') return null;
        return getMatchDifferDigitFreq(sliced, range);
    }, [mode, sliced, range]);
    const riseFallDigitFreq = useMemo(() => {
        if (mode !== 'rise_fall') return null;
        return getRiseFallDigitFreq(sliced, range);
    }, [mode, sliced, range]);

    const rfSequence = useMemo(() => {
        if (mode !== 'rise_fall' || sliced.length < 2) return '';
        const seq: string[] = [];
        for (let i = 1; i < sliced.length; i++) {
            seq.push(sliced[i] > sliced[i - 1] ? 'R' : 'F');
        }
        // Show last 60 transitions for readability
        return seq.slice(-60).join(' ');
    }, [mode, sliced]);

    const getModeLabel = () => {
        const labels: Record<AnalysisMode, string> = {
            even_odd: 'Even/Odd',
            over_under: 'Over/Under',
            match_differ: 'Match/Differ',
            rise_fall: 'Rise/Fall',
        };
        return labels[mode];
    };

    const getAnalysisData = () => {
        if (mode === 'even_odd') {
            const data = [
                { name: 'Even', value: analysis.even, fill: '#4aa8ff' },
                { name: 'Odd', value: analysis.odd, fill: '#ff9f43' },
            ];
            return { type: 'pie', data, label1: 'Even', val1: analysis.even, label2: 'Odd', val2: analysis.odd };
        }
        if (mode === 'over_under') {
            return {
                type: 'over-under-bars',
                label1: 'Over',
                val1: analysis.over,
                label2: 'Under',
                val2: analysis.under,
                overData: overUnderDigitFreq?.overData || [],
                underData: overUnderDigitFreq?.underData || [],
            };
        }
        if (mode === 'match_differ') {
            return {
                type: 'match-differ-bars',
                label1: 'Match',
                val1: analysis.match,
                label2: 'Differ',
                val2: analysis.differ,
                matchData: matchDifferDigitFreq?.matchData || [],
                differData: matchDifferDigitFreq?.differData || [],
            };
        }
        if (mode === 'rise_fall') {
            return {
                type: 'rise-fall-bars',
                label1: 'Rise',
                val1: analysis.rise,
                label2: 'Fall',
                val2: analysis.fall,
                riseData: riseFallDigitFreq?.riseData || [],
                fallData: riseFallDigitFreq?.fallData || [],
            };
        }
        return { type: 'empty', data: [] };
    };

    const analysisData = getAnalysisData();

    return (
        <div className='digit-analyzer-v2'>
            <div className='da-sidebar'>
                <div className='da-section-title'>ANALYSIS</div>
                <div className='da-subtitle'>Trading Pattern Recognition</div>
                <div className='da-menu'>
                    <button
                        className={`da-menu-item ${mode === 'even_odd' ? 'active' : ''}`}
                        onClick={() => setMode('even_odd')}
                    >
                        Even/odd
                    </button>
                    <button
                        className={`da-menu-item ${mode === 'over_under' ? 'active' : ''}`}
                        onClick={() => setMode('over_under')}
                    >
                        Over/under
                    </button>
                    <button
                        className={`da-menu-item ${mode === 'match_differ' ? 'active' : ''}`}
                        onClick={() => setMode('match_differ')}
                    >
                        Match/differ
                    </button>
                    <button
                        className={`da-menu-item ${mode === 'rise_fall' ? 'active' : ''}`}
                        onClick={() => setMode('rise_fall')}
                    >
                        Rise/fall
                    </button>
                </div>

                {mode === 'rise_fall' && rfSequence && (
                    <div className='da-sequence-card'>
                        <div className='da-sequence-title'>Last R/F Sequence</div>
                        <div className='da-sequence-string'>{rfSequence}</div>
                    </div>
                )}
            </div>

            <div className='da-main'>
                <div className='da-header-section'>
                    <div className='da-price-box'>
                        <div className='da-price-label'>CURRENT PRICE</div>
                        <div className='da-price-value'>{currentPrice ? currentPrice.toFixed(4) : 'Loading...'}</div>
                    </div>
                </div>

                <div className='da-analysis-section'>
                    <div className='da-analysis-title'>{getModeLabel()}</div>
                    {analysisData.type === 'pie' ? (
                        <div className='da-chart-container'>
                            <ResponsiveContainer width='100%' height={280}>
                                <PieChart>
                                    <Pie
                                        data={analysisData.data}
                                        cx='50%'
                                        cy='50%'
                                        innerRadius={60}
                                        outerRadius={100}
                                        dataKey='value'
                                    >
                                        {analysisData.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={v => `${v}%`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : null}

                    {analysisData.type === 'over-under-bars' ? (
                        <div className='da-over-under-grid'>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.overData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#ff9aa2' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.underData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#2ecc71' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : null}

                    {analysisData.type === 'match-differ-bars' ? (
                        <div className='da-over-under-grid'>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.matchData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#a29bfe' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.differData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#2ecc71' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : null}

                    {analysisData.type === 'rise-fall-bars' ? (
                        <div className='da-over-under-grid'>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.riseData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#00b894' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className='da-chart-container'>
                                <ResponsiveContainer width='100%' height={260}>
                                    <BarChart
                                        data={analysisData.fallData}
                                        margin={{ top: 12, right: 12, left: -20, bottom: 12 }}
                                    >
                                        <XAxis dataKey='digit' />
                                        <YAxis />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey='frequency' fill='#ff9aa2' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : null}

                    {analysisData.type === 'rise-fall-bars' ? (
                        <div className='da-summary-bars'>
                            <div className='bar-row'>
                                <span className='bar-label'>Rise</span>
                                <div className='bar-track'>
                                    <div
                                        className='bar-fill rise'
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (analysis as any).rise || analysisData.val1))}%`,
                                        }}
                                    />
                                </div>
                                <span className='bar-value'>
                                    {((analysis as any).rise ?? analysisData.val1).toFixed
                                        ? ((analysis as any).rise ?? analysisData.val1).toFixed(2)
                                        : ((analysis as any).rise ?? analysisData.val1)}
                                    %
                                </span>
                            </div>
                            <div className='bar-row'>
                                <span className='bar-label'>Fall</span>
                                <div className='bar-track'>
                                    <div
                                        className='bar-fill fall'
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (analysis as any).fall || analysisData.val2))}%`,
                                        }}
                                    />
                                </div>
                                <span className='bar-value'>
                                    {((analysis as any).fall ?? analysisData.val2).toFixed
                                        ? ((analysis as any).fall ?? analysisData.val2).toFixed(2)
                                        : ((analysis as any).fall ?? analysisData.val2)}
                                    %
                                </span>
                            </div>
                            <div className='da-summary-footer'>
                                Rise:{' '}
                                {((analysis as any).rise ?? analysisData.val1).toFixed
                                    ? ((analysis as any).rise ?? analysisData.val1).toFixed(2)
                                    : ((analysis as any).rise ?? analysisData.val1)}
                                % | Fall:{' '}
                                {((analysis as any).fall ?? analysisData.val2).toFixed
                                    ? ((analysis as any).fall ?? analysisData.val2).toFixed(2)
                                    : ((analysis as any).fall ?? analysisData.val2)}
                                %
                            </div>
                        </div>
                    ) : null}

                    {analysisData.type === 'pie' && (
                        <div className='da-stats'>
                            <div className='stat-item'>
                                <span className='stat-label'>{analysisData.label1}</span>
                                <span className='stat-value'>{analysisData.val1}%</span>
                            </div>
                            <div className='stat-item'>
                                <span className='stat-label'>{analysisData.label2}</span>
                                <span className='stat-value'>{analysisData.val2}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className='da-digit-distribution'>
                    <div className='da-analysis-title'>Digit Distribution</div>
                    <div className='da-chart-container'>
                        <ResponsiveContainer width='100%' height={240}>
                            <BarChart data={digitFreq} margin={{ top: 12, right: 12, left: -20, bottom: 12 }}>
                                <XAxis dataKey='digit' />
                                <YAxis />
                                <Tooltip formatter={v => `${v}%`} />
                                <Bar dataKey='frequency' radius={[8, 8, 0, 0]}>
                                    {digitFreq.map(d => (
                                        <Cell
                                            key={d.digit}
                                            fill={
                                                d.frequency > 12 ? '#2ecc71' : d.frequency < 8 ? '#ff6b6b' : '#4aa8ff'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitAnalyzer;
