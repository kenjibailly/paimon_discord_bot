const handleExchangeShopButton = require('./exchange-shop');
const handleExchangeShopMenuButton = require('./exchange-shop-menu');
const handleCancelThreadButton = require('./cancel-thread');
const handleExchangeChangeNicknameButton = require('./exchange-change-nickname');
const handleJoinTeamButton = require('./join-team');
const { handleManageGamesButton, handleUpdateGameNameButton, handleUpdateGameDescriptionButton } = require('./manage/manage-games');
const { handleStartEventAddGameButton, handleStartEventNoGameButton } = require('./start-event');

module.exports = {
    'exchange-shop': handleExchangeShopButton,
    'exchange-shop-menu': handleExchangeShopMenuButton,
    'cancel-thread': handleCancelThreadButton,
    'exchange-change-nickname': handleExchangeChangeNicknameButton,
    'join-team': handleJoinTeamButton,
    'update-game': handleManageGamesButton,
    'remove-game': handleManageGamesButton,
    'update-game-name': handleUpdateGameNameButton,
    'update-game-description': handleUpdateGameDescriptionButton,
    'start-event-add-game': handleStartEventAddGameButton,
    'start-event-no-game': handleStartEventNoGameButton,
};
