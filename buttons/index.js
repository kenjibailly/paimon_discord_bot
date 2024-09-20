const handleExchangeShopButton = require('./shop/exchange-shop');
const handleExchangeShopMenuButton = require('./shop/exchange-shop-menu');
const handleCancelThreadButton = require('./cancel-thread');
const handleExchangeChangeNicknameButton = require('./shop/exchange-reward/exchange-change-nickname');
const handleJoinTeamButton = require('./join-team');
const { handleAddGameNameButton, handleAddGameWithoutDescriptionButton, handleManageGamesButton, handleUpdateGameNameButton, handleUpdateGameDescriptionButton } = require('./manage/manage-games');
const { handleStartEventAddGameButton, handleStartEventNoGameButton } = require('./start-event');
const handleExchangeCustomEmojiButton = require('./shop/exchange-reward/exchange-custom-emoji');
const handleExchangeCustomChannelButton = require('./shop/exchange-reward/exchange-custom-channel');
const handleExchangeCustomRole = require('./shop/exchange-reward/exchange-custom-role');
const handleExchangeTrollUser = require('./shop/exchange-reward/exchange-troll-user');
const { handleChannelNameConfiguration, handleChannelNameConfigurationFinish } = require('./channel-name-configuration');

module.exports = {
    'exchange-shop': handleExchangeShopButton,
    'exchange-shop-menu': handleExchangeShopMenuButton,
    'cancel-thread': handleCancelThreadButton,
    'exchange-change-nickname': handleExchangeChangeNicknameButton,
    'exchange-custom-emoji': handleExchangeCustomEmojiButton,
    'join-team': handleJoinTeamButton,
    'add-game-name': handleAddGameNameButton,
    'add-game-without-description': handleAddGameWithoutDescriptionButton,
    'update-game': handleManageGamesButton,
    'remove-game': handleManageGamesButton,
    'update-game-name': handleUpdateGameNameButton,
    'update-game-description': handleUpdateGameDescriptionButton,
    'start-event-add-game': handleStartEventAddGameButton,
    'start-event-no-game': handleStartEventNoGameButton,
    'exchange-custom-channel': handleExchangeCustomChannelButton,
    'exchange-custom-role': handleExchangeCustomRole,
    'channel-name-config-emoji-yes': handleChannelNameConfiguration,
    'channel-name-config-emoji-no': handleChannelNameConfiguration,
    'channel-name-config-separator-no': handleChannelNameConfigurationFinish,
    'exchange-troll-user': handleExchangeTrollUser,
    'exchange-troll-user': handleExchangeTrollUser,
};
