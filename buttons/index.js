const handleExchangeShopButton = require('./shop/exchange-shop');
const handleExchangeShopMenuButton = require('./shop/exchange-shop-menu');
const handleCancelThreadButton = require('./cancel-thread');
const handleExchangeChangeNicknameButton = require('./shop/exchange-reward/exchange-change-nickname');
const handleJoinTeamButton = require('./join-team');
const { handleManageGamesButton, handleUpdateGameNameButton, handleUpdateGameDescriptionButton } = require('./manage/manage-games');
const { handleStartEventAddGameButton, handleStartEventNoGameButton } = require('./start-event');
const handleExchangeCustomEmojiButton = require('./shop/exchange-reward/exchange-custom-emoji');

module.exports = {
    'exchange-shop': handleExchangeShopButton,
    'exchange-shop-menu': handleExchangeShopMenuButton,
    'cancel-thread': handleCancelThreadButton,
    'exchange-change-nickname': handleExchangeChangeNicknameButton,
    'exchange-custom-emoji': handleExchangeCustomEmojiButton,
    'join-team': handleJoinTeamButton,
    'update-game': handleManageGamesButton,
    'remove-game': handleManageGamesButton,
    'update-game-name': handleUpdateGameNameButton,
    'update-game-description': handleUpdateGameDescriptionButton,
    'start-event-add-game': handleStartEventAddGameButton,
    'start-event-no-game': handleStartEventNoGameButton,
};
