import React from 'react';
import classNames from 'classnames';
import Button from '@/components/shared_ui/button';
import { BotMetadata } from '@/constants/bot-library';
import { localize } from '@deriv-com/translations';

interface BotCardProps {
    bot: BotMetadata;
    onLoadBot: (bot: BotMetadata) => void;
    isLoading?: boolean;
}

const BotCard: React.FC<BotCardProps> = ({ bot, onLoadBot, isLoading }) => {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner':
                return 'success';
            case 'Intermediate':
                return 'warning';
            case 'Advanced':
                return 'danger';
            default:
                return 'default';
        }
    };

    return (
        <div className='pro-bot__card'>
            <div className='pro-bot__card-header'>
                <div className='pro-bot__card-title'>{bot.name}</div>
                <div className='pro-bot__card-badges'>
                    <span className='pro-bot__card-category'>{bot.category}</span>
                    <span
                        className={classNames(
                            'pro-bot__card-difficulty',
                            `pro-bot__card-difficulty--${getDifficultyColor(bot.difficulty)}`
                        )}
                    >
                        {bot.difficulty}
                    </span>
                </div>
            </div>

            <div className='pro-bot__card-body'>
                <p className='pro-bot__card-description'>{bot.description}</p>

                <div className='pro-bot__card-tags'>
                    {bot.tags.slice(0, 3).map(tag => (
                        <span key={tag} className='pro-bot__card-tag'>
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className='pro-bot__card-footer'>
                <Button
                    text={localize('Load Bot')}
                    onClick={() => onLoadBot(bot)}
                    is_disabled={isLoading}
                    has_effect
                    primary
                    className='pro-bot__card-button'
                />
            </div>
        </div>
    );
};

export default BotCard;
