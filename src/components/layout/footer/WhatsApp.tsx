import { LegacyWhatsappIcon } from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';
import { Tooltip } from '@deriv-com/ui';

const WhatsApp = () => {
    const { localize } = useTranslations();

    // TODO: Replace with your actual WhatsApp number in international format
    const WHATSAPP_LINK = 'https://wa.link/wx2jzy'; // Example: https://wa.me/1234567890

    return (
        <Tooltip
            as='a'
            className='app-footer__icon'
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noreferrer'
            tooltipContent={localize('WhatsApp')}
        >
            <LegacyWhatsappIcon iconSize='xs' />
        </Tooltip>
    );
};

export default WhatsApp;
