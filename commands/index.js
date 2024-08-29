const handleAwardTeamCommand = require('./award-team');
const handleWalletCommand = require('./wallet');
const handleShopCommand = require('./shop');

module.exports = {
    'award-team': handleAwardTeamCommand,
    'wallet': handleWalletCommand,
    'shop': handleShopCommand,
};
