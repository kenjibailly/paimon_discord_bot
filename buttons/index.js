const handleExchangeShopButton = require('./shop/exchange-shop');
const handleExchangeShopMenuButton = require('./shop/exchange-shop-menu');
const handleCancelThreadButton = require('./cancel-thread');
const handleExchangeChangeNicknameButton = require('./shop/exchange-reward/exchange-change-nickname');
const handleJoinTeamButton = require('./join-team');
const { handleAddGameNameButton, handleAddGameWithoutDescriptionButton, handleManageGamesButton, handleUpdateGameNameButton, handleUpdateGameDescriptionButton } = require('./manage/manage-games');
const { handleAddTrollMissionNameButton, handleAddTrollMissionWithoutDescriptionButton, handleManageTrollMissionsButton, handleUpdateTrollMissionNameButton, handleUpdateTrollMissionDescriptionButton } = require('./manage/manage-troll-missions');
const { handleStartEventAddGameButton, handleStartEventNoGameButton } = require('./start-event');
const handleStartEventNextGameButton = require('./start-event-next-game');
const handleExchangeCustomEmojiButton = require('./shop/exchange-reward/exchange-custom-emoji');
const handleExchangeCustomChannelButton = require('./shop/exchange-reward/exchange-custom-channel');
const handleExchangeCustomRoleButton = require('./shop/exchange-reward/exchange-custom-role');
const handleExchangeTrollUserButton = require('./shop/exchange-reward/exchange-troll-user');
const { handleChannelNameConfigurationButton, handleChannelNameConfigurationFinishButton } = require('./channel-name-configuration');
const handleExchangeChooseGameButton = require('./shop/exchange-reward/exchange-choose-game');

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
    'add-troll-mission-name': handleAddTrollMissionNameButton,
    'add-troll-mission-without-description': handleAddTrollMissionWithoutDescriptionButton,
    'update-troll-mission': handleManageTrollMissionsButton,
    'remove-troll-mission': handleManageTrollMissionsButton,
    'update-troll-mission-name': handleUpdateTrollMissionNameButton,
    'update-troll-mission-description': handleUpdateTrollMissionDescriptionButton,
    'start-event-next-game': handleStartEventNextGameButton,
    'start-event-add-game': handleStartEventAddGameButton,
    'start-event-no-game': handleStartEventNoGameButton,
    'exchange-custom-channel': handleExchangeCustomChannelButton,
    'exchange-custom-role': handleExchangeCustomRoleButton,
    'channel-name-config-emoji-yes': handleChannelNameConfigurationButton,
    'channel-name-config-emoji-no': handleChannelNameConfigurationButton,
    'channel-name-config-separator-no': handleChannelNameConfigurationFinishButton,
    'exchange-troll-user': handleExchangeTrollUserButton,
    'exchange-troll-user': handleExchangeTrollUserButton,
    'exchange-choose-game': handleExchangeChooseGameButton,
};
