import React from 'react';
import { observer } from 'mobx-react-lite';
import { botNotification } from '@/components/bot-notification/bot-notification';
import Input from '@/components/shared_ui/input';
import { DBOT_TABS } from '@/constants/bot-contents';
import { BOT_LIBRARY, BOT_LIBRARY_CATEGORIES, BotMetadata } from '@/constants/bot-library';
import { load } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import BotCard from './bot-card';
import './pro-bot.scss';

const ProBot = observer(() => {
    const store = useStore();

    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string>(BOT_LIBRARY_CATEGORIES.ALL);
    const [isLoadingBot, setIsLoadingBot] = React.useState(false);

    const categories = Object.values(BOT_LIBRARY_CATEGORIES);

    const filteredBots = React.useMemo(() => {
        let bots = BOT_LIBRARY;
        if (selectedCategory !== BOT_LIBRARY_CATEGORIES.ALL) {
            bots = bots.filter(bot => bot.category === selectedCategory);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            bots = bots.filter(
                bot =>
                    bot.name.toLowerCase().includes(search) ||
                    bot.description.toLowerCase().includes(search) ||
                    bot.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }
        return bots;
    }, [searchTerm, selectedCategory]);

    const loadBotToBuilder = async (bot: BotMetadata) => {
        try {
            setIsLoadingBot(true);

            // Fetch XML from the bot's xmlUrl
            const response = await fetch(bot.xmlUrl);
            if (!response.ok) {
                throw new Error(`Failed to load bot: ${response.statusText}`);
            }
            const xmlContent = await response.text();

            // Use the project's load function which properly handles Blockly workspace
            await load({
                block_string: xmlContent,
                file_name: bot.name,
                workspace: (window as any).Blockly?.derivWorkspace,
                from: 'pro_bot',
                drop_event: {},
                strategy_id: (window as any).Blockly?.utils?.idGenerator?.genUid?.(),
                showIncompatibleStrategyDialog: true,
                show_snackbar: true,
            });

            // If dashboard store exists, switch to Bot Builder tab
            store?.dashboard?.setActiveTab?.(DBOT_TABS.BOT_BUILDER);

            botNotification(`${bot.name} loaded successfully!`, undefined, { className: 'success-toast' });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error loading Bot:', error);
            botNotification(`Failed to load ${bot.name}. Please try again.`, undefined, { className: 'error-toast' });
        } finally {
            setIsLoadingBot(false);
        }
    };

    return (
        <div className='pro-bot__wrapper'>
            <div className='pro-bot__header'>
                <div className='pro-bot__header-text'>
                    <h2 className='pro-bot__title'>
                        <Localize i18n_default_text='Pro Bot Library' />
                    </h2>
                    <p className='pro-bot__subtitle'>
                        <Localize i18n_default_text='Browse and load pre-configured trading bots from our curated library' />
                    </p>
                </div>

                <div className='pro-bot__filters'>
                    <div className='pro-bot__search'>
                        <Input
                            type='text'
                            placeholder={localize('Search bots...')}
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className='pro-bot__search-input'
                        />
                    </div>

                    <div className='pro-bot__categories'>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`pro-bot__category-btn ${selectedCategory === category ? 'pro-bot__category-btn--active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className='pro-bot__content'>
                {filteredBots.length === 0 ? (
                    <div className='pro-bot__empty'>
                        <div className='pro-bot__empty-icon'>🤖</div>
                        <h3 className='pro-bot__empty-title'>
                            <Localize i18n_default_text='No bots found' />
                        </h3>
                        <p className='pro-bot__empty-text'>
                            <Localize i18n_default_text='Try adjusting your search or filter criteria' />
                        </p>
                    </div>
                ) : (
                    <div className='pro-bot__grid'>
                        {filteredBots.map(bot => (
                            <BotCard key={bot.id} bot={bot} onLoadBot={loadBotToBuilder} isLoading={isLoadingBot} />
                        ))}
                    </div>
                )}
            </div>

            {filteredBots.length > 0 && (
                <div className='pro-bot__footer'>
                    <p className='pro-bot__footer-text'>
                        <Localize
                            i18n_default_text='Showing {{count}} bot(s)'
                            values={{ count: filteredBots.length }}
                        />
                    </p>
                </div>
            )}
        </div>
    );
});

export default ProBot;
