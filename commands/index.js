const handleAwardTeamCommand = require('./award-team');
const handleWalletCommand = require('./wallet');
const handleDeductUserCommand = require('./deduct-user');
const handleAwardUserCommand = require('./award-user');
const handleShopCommand = require('./shop');
const handleSetRewardCommand = require('./set-reward');
const handleSetAllRewardsCommand = require('./set-all-rewards');
const handleSetTeamsCommand = require('./set-teams');
const handleSetTokenEmojiCommand = require('./set-token-emoji');
const handleSetBotChannelCommand = require('./set-bot-channel');
const handleManageGamesCommand = require('./manage-games');
const handleManageTrollMissionsCommand = require('./manage-troll-missions');
const handleGamesCommand = require('./games');
const handleTrollMissionsCommand = require('./troll-missions');
const handleResetTeamsCommand = require('./reset-teams');
const handleSetStatusCommand = require('./set-status');
const handleStartEventCommand = require('./start-event');
const handleCancelEventCommand = require('./cancel-event');
const handleChannelNameConfigurationCommand = require('./set-channel-name-configuration');
const handleTrollUserCompleteMissionCommand = require('./troll-user-complete-mission');

module.exports = {
    'award-team': handleAwardTeamCommand,
    'wallet': handleWalletCommand,
    'deduct-user': handleDeductUserCommand,
    'award-user': handleAwardUserCommand,
    'shop': handleShopCommand,
    'set-reward': handleSetRewardCommand,
    'set-all-rewards': handleSetAllRewardsCommand,
    'set-teams': handleSetTeamsCommand,
    'set-token-emoji': handleSetTokenEmojiCommand,
    'set-bot-channel': handleSetBotChannelCommand,
    'manage-games': handleManageGamesCommand,
    'manage-troll-missions': handleManageTrollMissionsCommand,
    'games': handleGamesCommand,
    'troll-missions': handleTrollMissionsCommand,
    'reset-teams': handleResetTeamsCommand,
    'set-status': handleSetStatusCommand,
    'start-event': handleStartEventCommand,
    'cancel-event': handleCancelEventCommand,
    'set-channel-name-configuration': handleChannelNameConfigurationCommand,
    'troll-user-complete-mission': handleTrollUserCompleteMissionCommand,
};
