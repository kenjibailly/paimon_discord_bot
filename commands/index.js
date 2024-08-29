const handleAwardTeamCommand = require('./award-team');
const handleWalletCommand = require('./wallet');

module.exports = {
    'award-team': handleAwardTeamCommand,
    'wallet': handleWalletCommand,
};
