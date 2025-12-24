import { observer } from 'mobx-react-lite';
import { useTranslations } from '@deriv-com/translations';
import { PlatformSwitcher as UIPlatformSwitcher, PlatformSwitcherItem } from '@deriv-com/ui';
import { platformsConfig } from '../header-config';
import './platform-switcher.scss';

const PlatformSwitcher = observer(() => {
    const { localize } = useTranslations();

    // Add the account parameter to the URL
    // let final_url = redirect_url_str;
    // try {
    //     const redirect_url = new URL(redirect_url_str);
    //     if (is_virtual) {
    //         // For demo accounts, set the account parameter to 'demo'
    //         redirect_url.searchParams.set('account', 'demo');
    //     } else if (client.currency) {
    //         // For real accounts, set the account parameter to the currency
    //         redirect_url.searchParams.set('account', client.currency);
    //     }
    //     final_url = redirect_url.toString();
    // } catch (error) {
    //     console.error('Error parsing redirect URL:', error);
    // }
    return (
        <UIPlatformSwitcher
            // no bottom link needed when only one platform is present
            buttonProps={{
                icon: platformsConfig[0]?.buttonIcon,
            }}
        >
            {platformsConfig.map(({ active, description, href, icon }) => (
                <PlatformSwitcherItem
                    active={active}
                    className='platform-switcher'
                    description={localize('{{description}}', { description })}
                    href={window.location.search ? `${href}/${window.location.search}` : href}
                    icon={icon}
                    key={description}
                />
            ))}
        </UIPlatformSwitcher>
    );
});

export default PlatformSwitcher;
