import React from 'react';
import { observer } from 'mobx-react-lite';
import BotLibrary from '@/components/bot-library/BotLibrary';

const BotLibraryPage: React.FC = observer(() => {
    return <BotLibrary />;
});

export default BotLibraryPage;
