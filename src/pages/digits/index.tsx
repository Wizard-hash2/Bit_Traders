import { useEffect } from 'react';
import './digits.scss';

const Digits = () => {
    useEffect(() => {
        // Inject custom styles to hide derivhub header/footer if needed
        const style = document.createElement('style');
        style.textContent = `
            .digits-iframe {
                border: none;
                width: 100%;
                height: 100%;
                min-height: calc(100vh - 200px);
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className='digits-container'>
            <iframe
                src='https://derivhub.com/digits'
                className='digits-iframe'
                title='Digits Signals'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                sandbox='allow-same-origin allow-scripts allow-popups allow-forms'
            />
        </div>
    );
};

export default Digits;
