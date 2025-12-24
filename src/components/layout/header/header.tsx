import { useCallback } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import PWAInstallButton from '@/components/pwa-install-button';
import { generateOAuthURL, standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useFirebaseCountriesConfig } from '@/hooks/firebase/useFirebaseCountriesConfig';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import useTMB from '@/hooks/useTMB';
import { clearAuthData, handleOidcAuthFailure } from '@/utils/auth-utils';
import { addReferralTracking } from '@/utils/referral-config';
import { requestOidcAuthentication } from '@deriv-com/auth-client';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
// PlatformSwitcher intentionally not imported to keep header icon non-interactive
import './header.scss';

type TAppHeaderProps = {
    isAuthenticating?: boolean;
};

const AppHeader = observer(({ isAuthenticating }: TAppHeaderProps) => {
    const { isDesktop, isTablet } = useDevice();
    const showExpandedHeader = isDesktop || isTablet;
    const { isAuthorizing, activeLoginid } = useApiBase();
    const { client } = useStore() ?? {};

    const { data: activeAccount } = useActiveAccount({ allBalanceData: client?.all_accounts_balance });
    const { accounts, getCurrency, is_virtual } = client ?? {};
    const has_wallet = Object.keys(accounts ?? {}).some(id => accounts?.[id].account_category === 'wallet');

    const currency = getCurrency?.();
    const { localize } = useTranslations();

    const { isSingleLoggingIn } = useOauth2();

    const { hubEnabledCountryList } = useFirebaseCountriesConfig();
    const { onRenderTMBCheck, isTmbEnabled } = useTMB();
    const is_tmb_enabled = isTmbEnabled() || window.is_tmb_enabled === true;
    // No need for additional state management here since we're handling it in the layout component

    const renderAccountSection = useCallback(() => {
        // Show loader during authentication processes
        if (isAuthenticating || isAuthorizing || (isSingleLoggingIn && !is_tmb_enabled)) {
            return <AccountsInfoLoader isLoggedIn isMobile={!showExpandedHeader} speed={3} />;
        } else if (activeLoginid) {
            return (
                <>
                    {/* <CustomNotifications /> */}

                    {showExpandedHeader &&
                        (has_wallet ? (
                            <Button
                                className='manage-funds-button'
                                has_effect
                                text={localize('Manage funds')}
                                onClick={() => {
                                    let redirect_url = new URL(standalone_routes.wallets_transfer);
                                    const is_hub_enabled_country = hubEnabledCountryList.includes(
                                        client?.residence || ''
                                    );
                                    if (is_hub_enabled_country) {
                                        redirect_url = new URL(standalone_routes.recent_transactions);
                                    }
                                    if (is_virtual) {
                                        redirect_url.searchParams.set('account', 'demo');
                                    } else if (currency) {
                                        redirect_url.searchParams.set('account', currency);
                                    }
                                    window.location.assign(redirect_url.toString());
                                }}
                                primary
                            />
                        ) : (
                            <Button
                                primary
                                onClick={() => {
                                    const redirect_url = new URL(standalone_routes.cashier_deposit);
                                    if (currency) {
                                        redirect_url.searchParams.set('account', currency);
                                    }
                                    window.location.assign(redirect_url.toString());
                                }}
                                className='deposit-button'
                            >
                                {localize('Deposit')}
                            </Button>
                        ))}

                    <AccountSwitcher activeAccount={activeAccount} />
                </>
            );
        } else {
            return (
                <div className='auth-actions'>
                    <Button
                        tertiary
                        onClick={async () => {
                            clearAuthData(false);
                            const getQueryParams = new URLSearchParams(window.location.search);
                            const currency = getQueryParams.get('account') ?? '';
                            const query_param_currency =
                                currency || sessionStorage.getItem('query_param_currency') || 'USD';

                            try {
                                // First, explicitly wait for TMB status to be determined
                                const tmbEnabled = await isTmbEnabled();
                                // Now use the result of the explicit check
                                if (tmbEnabled) {
                                    await onRenderTMBCheck(true); // Pass true to indicate it's from login button
                                } else {
                                    // Always use OIDC if TMB is not enabled
                                    try {
                                        await requestOidcAuthentication({
                                            redirectCallbackUri: `${window.location.origin}/callback`,
                                            ...(query_param_currency
                                                ? {
                                                      state: {
                                                          account: query_param_currency,
                                                      },
                                                  }
                                                : {}),
                                        });
                                    } catch (err) {
                                        handleOidcAuthFailure(err);
                                        window.location.replace(generateOAuthURL());
                                    }
                                }
                            } catch (error) {
                                // eslint-disable-next-line no-console
                                console.error(error);
                            }
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            window.open(addReferralTracking(standalone_routes.signup));
                        }}
                    >
                        <Localize i18n_default_text='Sign up' />
                    </Button>
                </div>
            );
        }
    }, [
        isAuthenticating,
        isAuthorizing,
        isSingleLoggingIn,
        showExpandedHeader,
        activeLoginid,
        standalone_routes,
        client,
        has_wallet,
        currency,
        localize,
        activeAccount,
        is_virtual,
        onRenderTMBCheck,
        is_tmb_enabled,
    ]);

    if (client?.should_hide_header) return null;
    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': showExpandedHeader,
                'app-header--mobile': !showExpandedHeader,
            })}
        >
            <Wrapper variant='left'>
                <AppLogo />
                <MobileMenu />
                {showExpandedHeader && <MenuItems.TradershubLink />}
                {showExpandedHeader && <MenuItems />}
                {showExpandedHeader && (
                    <div
                        className='app-header__platform'
                        role='img'
                        aria-label='Bit Traders'
                        style={{ marginLeft: 12 }}
                    >
                        <img src='/BITTRADERS.png' alt='Bit Traders' style={{ height: 44 }} />
                    </div>
                )}
            </Wrapper>

            <Wrapper variant='right'>
                <div
                    className='app-header__brand'
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    role='img'
                    aria-label='Bit Traders'
                >
                    <img src='/BITTRADERS.png' alt='Bit Traders' style={{ height: 28 }} />
                    <span>Bit Traders</span>
                </div>
                {!showExpandedHeader && <PWAInstallButton variant='primary' size='medium' />}
                {renderAccountSection()}
            </Wrapper>

            {/* <PWAInstallModalTest /> */}
        </Header>
    );
});

export default AppHeader;
