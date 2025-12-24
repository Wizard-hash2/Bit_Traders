import { useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <div className='app-header__logo' role='img' aria-label='Bit Traders'>
            <img src='/BITTRADERS.png' alt='Bit Traders' style={{ height: 48 }} />
        </div>
    );
};
