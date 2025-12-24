type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    ANALYZER: 3,
    DIGIT_STATISTICS: 4,
    DIGIT_PRO: 5,
    BOTS_BY_BITS: 6,
    TUTORIAL: 7,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-analyzer',
    'id-digit-statistics',
    'id-digit-pro',
    'id-bots-by-bits',
    'id-tutorials',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
