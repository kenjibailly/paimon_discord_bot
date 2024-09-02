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
const handleAddGameCommand = require('./add-game');
const handleGamesCommand = require('./games');
const handleRemoveGameCommand = require('./remove-game');
const handleUpdateGameCommand = require('./update-game');
const handleResetTeamsCommand = require('./reset-teams');
const handleSetStatusCommand = require('./set-status');

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
    'add-game': handleAddGameCommand,
    'games': handleGamesCommand,
    'remove-game': handleRemoveGameCommand,
    'update-game': handleUpdateGameCommand,
    'reset-teams': handleResetTeamsCommand,
    'set-status': handleSetStatusCommand,
};
