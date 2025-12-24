import { action, computed, makeObservable, observable } from 'mobx';
import { botNotification } from '@/components/bot-notification/bot-notification';
import { BOT_CATEGORIES, PRO_BOTS, ProBot } from '@/constants/pro-bots';
import { load } from '@/external/bot-skeleton';
import RootStore from './root-store';

export default class ProBotStore {
    root_store: RootStore;

    constructor(root_store: RootStore) {
        makeObservable(this, {
            selected_bot: observable,
            is_preview_modal_open: observable,
            search_term: observable,
            selected_category: observable,
            is_loading: observable,
            is_loading_bot: observable,
            filtered_bots: computed,
            selectBot: action.bound,
            togglePreviewModal: action.bound,
            loadBotToBuilder: action.bound,
            setSearchTerm: action.bound,
            setSelectedCategory: action.bound,
        });

        this.root_store = root_store;
    }

    selected_bot: ProBot | null = null;
    is_preview_modal_open = false;
    search_term = '';
    selected_category = BOT_CATEGORIES.ALL;
    is_loading = false;
    is_loading_bot = false;

    get filtered_bots(): ProBot[] {
        let bots = PRO_BOTS;

        // Filter by category
        if (this.selected_category !== BOT_CATEGORIES.ALL) {
            bots = bots.filter(bot => bot.category === this.selected_category);
        }

        // Filter by search term
        if (this.search_term.trim()) {
            const search = this.search_term.toLowerCase();
            bots = bots.filter(
                bot =>
                    bot.name.toLowerCase().includes(search) ||
                    bot.description.toLowerCase().includes(search) ||
                    bot.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }

        return bots;
    }

    selectBot = (bot: ProBot | null): void => {
        this.selected_bot = bot;
    };

    togglePreviewModal = (): void => {
        this.is_preview_modal_open = !this.is_preview_modal_open;
        if (!this.is_preview_modal_open) {
            this.selected_bot = null;
        }
    };

    setSearchTerm = (term: string): void => {
        this.search_term = term;
    };

    setSelectedCategory = (category: string): void => {
        this.selected_category = category;
    };

    loadBotToBuilder = async (bot: ProBot): Promise<void> => {
        const { dashboard, blockly_store } = this.root_store;

        try {
            this.is_loading_bot = true;
            blockly_store.setLoading(true);

            // Fetch XML from local bots folder
            const response = await fetch(`/bots/Free-Dbots/${bot.fileName}`);

            if (!response.ok) {
                throw new Error(`Failed to load bot: ${response.statusText}`);
            }

            const xml_content = await response.text();

            // Load bot into workspace
            await load({
                block_string: xml_content,
                file_name: bot.name,
                workspace: window.Blockly?.derivWorkspace,
                from: 'pro_bot',
                drop_event: {},
                strategy_id: window.Blockly?.utils?.idGenerator?.genUid(),
                showIncompatibleStrategyDialog: true,
                show_snackbar: true,
            });

            // Switch to Bot Builder tab
            dashboard.setActiveTab(1); // BOT_BUILDER tab index

            botNotification(
                {
                    message: `${bot.name} loaded successfully!`,
                },
                undefined,
                {
                    className: 'success-toast',
                }
            );

            // Close preview modal if open
            if (this.is_preview_modal_open) {
                this.togglePreviewModal();
            }
        } catch (error) {
            console.error('Error loading Pro Bot:', error);
            botNotification(
                {
                    message: `Failed to load ${bot.name}. Please try again.`,
                },
                undefined,
                {
                    className: 'error-toast',
                }
            );
        } finally {
            this.is_loading_bot = false;
            blockly_store.setLoading(false);
        }
    };
}
