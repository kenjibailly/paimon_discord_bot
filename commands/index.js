const handleAwardTeamCommand = require('./award-team');
const handleWalletCommand = require('./wallet');
const handleDeductUserCommand = require('./deduct-user');
const handleAwardUserCommand = require('./award-user');
const handleShopCommand = require('./shop');
const handleSetRewardCommand = require('./set-reward');
const handleSetAllRewardsCommand = require('./set-all-rewards');
const handleSetTeamsCommand = require('./set-teams');
const handleSetTokenEmojiCommand = require('./set-token-emoji');

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
};
