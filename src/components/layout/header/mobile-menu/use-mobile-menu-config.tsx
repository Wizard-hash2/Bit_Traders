import { ComponentProps, ReactNode, useMemo } from 'react';
import { standalone_routes } from '@/components/shared';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import useTMB from '@/hooks/useTMB';
import RootStore from '@/stores/root-store';
import {
    LegacyAccountLimitsIcon,
    LegacyHelpCentreIcon,
    LegacyReportsIcon,
    LegacyTheme1pxIcon,
    LegacyWhatsappIcon,
} from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';
import { ToggleSwitch } from '@deriv-com/ui';

// Telegram icon component
const TelegramIcon = () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z' />
    </svg>
);

export type TSubmenuSection = 'accountSettings' | 'cashier' | 'reports';

//IconTypes
type TMenuConfig = {
    LeftComponent: React.ElementType;
    RightComponent?: ReactNode;
    as: 'a' | 'button';
    href?: string;
    label: ReactNode;
    onClick?: () => void;
    removeBorderBottom?: boolean;
    submenu?: TSubmenuSection;
    target?: ComponentProps<'a'>['target'];
    isActive?: boolean;
}[];

const useMobileMenuConfig = (client?: RootStore['client']) => {
    const { localize } = useTranslations();
    const { is_dark_mode_on, toggleTheme } = useThemeSwitcher();

    // const { data } = useRemoteConfig(true);
    // const { cs_chat_whatsapp } = data;

    // const { is_livechat_available } = useIsLiveChatWidgetAvailable();
    // const icAvailable = useIsIntercomAvailable();

    // Get current account information for dependency tracking
    const is_virtual = client?.is_virtual;
    const currency = client?.getCurrency?.();
    const is_logged_in = client?.is_logged_in;
    const client_residence = client?.residence;
    const { isTmbEnabled } = useTMB();
    const is_tmb_enabled = window.is_tmb_enabled || isTmbEnabled();

    // Function to add account parameter to URLs
    // const getAccountUrl = (url: string) => {
    //     try {
    //         const redirect_url = new URL(url);
    //         // Check if the account is a demo account
    //         // Use the URL parameter to determine if it's a demo account, as this will update when the account changes
    //         const urlParams = new URLSearchParams(window.location.search);
    //         const account_param = urlParams.get('account');
    //         const is_virtual = client?.is_virtual || account_param === 'demo';
    //         const currency = client?.getCurrency?.();
    //
    //         if (is_virtual) {
    //             // For demo accounts, set the account parameter to 'demo'
    //             redirect_url.searchParams.set('account', 'demo');
    //         } else if (currency) {
    //             // For real accounts, set the account parameter to the currency
    //             redirect_url.searchParams.set('account', currency);
    //         }
    //
    //         return redirect_url.toString();
    //     } catch (error) {
    //         return url;
    //     }
    // };

    // const has_wallet = Object.keys(accounts).some(id => accounts[id].account_category === 'wallet');
    // Determine the appropriate redirect URL based on user's country
    // const getRedirectUrl = () => {
    //     // Check if the user's country is in the hub-enabled country list
    //     if (has_wallet && is_hub_enabled_country) {
    //         return getAccountUrl(standalone_routes.account_settings);
    //     }
    //     return getAccountUrl(standalone_routes.personal_details);
    // };

    const menuConfig = useMemo(
        (): TMenuConfig[] => [
            [
                {
                    as: 'button',
                    label: localize('Reports'),
                    LeftComponent: LegacyReportsIcon,
                    submenu: 'reports',
                    onClick: () => {},
                },
                {
                    as: 'button',
                    label: localize('Dark theme'),
                    LeftComponent: LegacyTheme1pxIcon,
                    RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
                },
            ].filter(Boolean) as TMenuConfig,
            [
                {
                    as: 'a',
                    href: standalone_routes.help_center,
                    label: localize('Help center'),
                    LeftComponent: LegacyHelpCentreIcon,
                },
                {
                    as: 'a',
                    href: standalone_routes.account_limits,
                    label: localize('Account limits'),
                    LeftComponent: LegacyAccountLimitsIcon,
                },
                {
                    as: 'a',
                    href: 'https://wa.link/wx2jzy',
                    label: localize('WhatsApp'),
                    LeftComponent: LegacyWhatsappIcon,
                    target: '_blank',
                },
                {
                    as: 'a',
                    href: 'https://t.me/YOUR_TELEGRAM_USERNAME',
                    label: localize('Telegram'),
                    LeftComponent: TelegramIcon,
                    target: '_blank',
                },
            ].filter(Boolean) as TMenuConfig,
            [],
        ],
        [is_virtual, currency, is_logged_in, client_residence, is_tmb_enabled]
    );

    return {
        config: menuConfig,
    };
};

export default useMobileMenuConfig;
