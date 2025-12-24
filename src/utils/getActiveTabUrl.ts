export const getActiveTabUrl = () => {
    const current_tab_number = Number(localStorage.getItem('active_tab')) || 0;
    // Extend hash mapping to include additional tabs (keep existing indices intact)
    const TAB_NAMES = [
        'dashboard',
        'bot_builder',
        'chart',
        'tutorial',
        // Optional extended tabs: these indices may not be used by URL routing everywhere,
        // but adding here prevents defaulting to 'dashboard' for newer tabs.
        'analyzer',
        'digit_statistics',
        'digit_pro',
        'pro_bot',
        'bots_by_bits',
        'bot_library',
    ] as const;
    const current_tab_name = TAB_NAMES[current_tab_number] || TAB_NAMES[0];

    const current_url = window.location.href.split('#')[0];
    const active_tab_url = `${current_url}#${current_tab_name}`;
    return active_tab_url;
};
