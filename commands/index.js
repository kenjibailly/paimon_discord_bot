const handleAwardTeamCommand = require('./award-team');
const handleWalletCommand = require('./wallet');
const handleDeductUserCommand = require('./deduct-user');
const handleAwardUserCommand = require('./award-user');
const handleShopCommand = require('./shop');

module.exports = {
    'award-team': handleAwardTeamCommand,
    'wallet': handleWalletCommand,
    'deduct-user': handleDeductUserCommand,
    'award-user': handleAwardUserCommand,
    'shop': handleShopCommand,
};
