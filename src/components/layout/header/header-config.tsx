import { ReactNode } from 'react';
import { standalone_routes } from '@/components/shared';
import { LegacyCashierIcon as CashierLogo, LegacyReportsIcon as ReportsLogo } from '@deriv/quill-icons/Legacy';
import { localize } from '@deriv-com/translations';

export type PlatformsConfig = {
    active: boolean;
    buttonIcon: ReactNode;
    description: string;
    href: string;
    icon: ReactNode;
    showInEU: boolean;
};

export type MenuItemsConfig = {
    as: 'a' | 'button';
    href: string;
    icon: ReactNode;
    label: string;
};

export type TAccount = {
    balance: string;
    currency: string;
    icon: React.ReactNode;
    isActive: boolean;
    isEu: boolean;
    isVirtual: boolean;
    loginid: string;
    token: string;
    type: string;
};

export const platformsConfig: PlatformsConfig[] = [
    {
        active: true,
        // Use project branding image instead of Deriv Bot logo
        buttonIcon: <img src='/BITTRADERS.png' alt='Bit Traders' style={{ height: 25 }} />,
        description: localize('Automated trading at your fingertips. No coding needed.'),
        href: standalone_routes.bot,
        icon: <img src='/BITTRADERS.png' alt='Bit Traders' style={{ height: 32 }} />,
        showInEU: false,
    },
];

export const TRADERS_HUB_LINK_CONFIG = {
    as: 'a',
    href: standalone_routes.traders_hub,
    icon: <img src='/BITTRADERS.png' alt='BIT TRADERS' style={{ height: 16 }} />,
    label: 'BIT TRADERS',
};

export const MenuItems: MenuItemsConfig[] = [
    {
        as: 'a',
        href: standalone_routes.cashier,
        icon: <CashierLogo iconSize='xs' />,
        label: localize('Cashier'),
    },
    {
        as: 'a',
        href: standalone_routes.reports,
        icon: <ReportsLogo iconSize='xs' />,
        label: localize('Reports'),
    },
];
