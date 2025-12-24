import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Button from '@/components/shared_ui/button';
import Input from '@/components/shared_ui/input';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import '@/pages/pro-bot/pro-bot.scss';

type Strategy = {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    fileUrl: string; // points to /bots/Free-Dbots/*.xml
    imageUrl?: string;
    tags?: string[];
};

const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
        case 'Beginner':
            return 'success';
        case 'Intermediate':
            return 'warning';
        case 'Advanced':
            return 'danger';
        default:
            return 'default';
    }
};

const BotLibrary: React.FC = observer(() => {
    const store = useStore();

    const [strategies, setStrategies] = React.useState<Strategy[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
    const [isLoadingBot, setIsLoadingBot] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = async () => {
            try {
                setError(null);
                const res = await fetch('/strategies.json');
                if (!res.ok) throw new Error(`Failed to fetch strategies.json: ${res.statusText}`);
                const data: Strategy[] = await res.json();
                setStrategies(data);
            } catch (e: any) {
                // eslint-disable-next-line no-console
                console.error('Failed to load strategies.json', e);
                setError('Unable to load strategies. Please refresh.');
            }
        };
        load();
    }, []);

    const categories = React.useMemo(() => {
        const set = new Set<string>(['All']);
        strategies.forEach(s => set.add(s.category));
        return Array.from(set);
    }, [strategies]);

    const filteredStrategies = React.useMemo(() => {
        let list = strategies;
        if (selectedCategory !== 'All') list = list.filter(s => s.category === selectedCategory);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(
                s =>
                    s.name.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q) ||
                    (s.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }
        return list;
    }, [strategies, searchTerm, selectedCategory]);

    const loadStrategy = async (url: string, strategyName?: string) => {
        try {
            setIsLoadingBot(true);
            const response = await fetch(url);
            const text = await response.text();

            const Blockly = (window as any).Blockly;
            if (!Blockly) throw new Error('Blockly not available');

            // 1. Parse text to DOM
            const xml = Blockly.Xml.textToDom(text);

            // Prefer derivWorkspace if present, else fallback to mainWorkspace
            const workspace = Blockly?.derivWorkspace || Blockly?.mainWorkspace;
            if (!workspace) throw new Error('Workspace not found');

            // 2. Clear the current workspace
            workspace.clear();

            // 3. Render the blocks
            Blockly.Xml.domToWorkspace(xml, workspace);

            // Switch UI to Bot Builder tab if dashboard store exists
            store?.dashboard?.setActiveTab?.(DBOT_TABS.BOT_BUILDER);

            alert('Strategy Loaded!' + (strategyName ? `\n${strategyName}` : ''));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load bot:', error);
            alert('Failed to load bot. Check console for details.');
        } finally {
            setIsLoadingBot(false);
        }
    };

    return (
        <div className='pro-bot__wrapper'>
            <div className='pro-bot__header'>
                <div className='pro-bot__header-text'>
                    <h2 className='pro-bot__title'>
                        <Localize i18n_default_text='Bot Library' />
                    </h2>
                    <p className='pro-bot__subtitle'>
                        <Localize i18n_default_text='Browse and load your XML strategies from strategies.json' />
                    </p>
                </div>

                <div className='pro-bot__filters'>
                    <div className='pro-bot__search'>
                        <Input
                            type='text'
                            placeholder={localize('Search strategies...')}
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className='pro-bot__search-input'
                        />
                    </div>

                    <div className='pro-bot__categories'>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={classNames('pro-bot__category-btn', {
                                    'pro-bot__category-btn--active': selectedCategory === category,
                                })}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className='pro-bot__empty'>
                    <div className='pro-bot__empty-icon'>⚠️</div>
                    <p className='pro-bot__empty-text'>{error}</p>
                </div>
            )}

            <div className='pro-bot__content'>
                {filteredStrategies.length === 0 ? (
                    <div className='pro-bot__empty'>
                        <div className='pro-bot__empty-icon'>🤖</div>
                        <h3 className='pro-bot__empty-title'>
                            <Localize i18n_default_text='No strategies found' />
                        </h3>
                        <p className='pro-bot__empty-text'>
                            <Localize i18n_default_text='Try adjusting your search or filter criteria' />
                        </p>
                    </div>
                ) : (
                    <div className='pro-bot__grid'>
                        {filteredStrategies.map(strategy => (
                            <div key={strategy.id} className='pro-bot__card'>
                                <div className='pro-bot__card-header'>
                                    <div className='pro-bot__card-title'>{strategy.name}</div>
                                    <div className='pro-bot__card-badges'>
                                        <span className='pro-bot__card-category'>{strategy.category}</span>
                                        {strategy.difficulty && (
                                            <span
                                                className={classNames(
                                                    'pro-bot__card-difficulty',
                                                    `pro-bot__card-difficulty--${getDifficultyColor(strategy.difficulty)}`
                                                )}
                                            >
                                                {strategy.difficulty}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className='pro-bot__card-body'>
                                    <p className='pro-bot__card-description'>{strategy.description}</p>
                                    {!!strategy.tags?.length && (
                                        <div className='pro-bot__card-tags'>
                                            {(strategy.tags || []).slice(0, 3).map(tag => (
                                                <span key={tag} className='pro-bot__card-tag'>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className='pro-bot__card-footer'>
                                    <Button
                                        text={localize('Load Bot')}
                                        onClick={() => loadStrategy(strategy.fileUrl, strategy.name)}
                                        is_disabled={isLoadingBot}
                                        has_effect
                                        primary
                                        className='pro-bot__card-button'
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {filteredStrategies.length > 0 && (
                <div className='pro-bot__footer'>
                    <p className='pro-bot__footer-text'>
                        <Localize
                            i18n_default_text='Showing {{count}} strategy(ies)'
                            values={{ count: filteredStrategies.length }}
                        />
                    </p>
                </div>
            )}
        </div>
    );
});

export default BotLibrary;
