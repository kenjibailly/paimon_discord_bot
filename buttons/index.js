const handleExchangeShopButton = require('./exchange-shop');
const handleExchangeShopMenuButton = require('./exchange-shop-menu');
const handleCancelThreadButton = require('./cancel-thread');
const handleExchangeChangeNicknameButton = require('./exchange-change-nickname');
const handleJoinTeamButton = require('./join-team');

module.exports = {
    'exchange-shop': handleExchangeShopButton,
    'exchange-shop-menu': handleExchangeShopMenuButton,
    'cancel-thread': handleCancelThreadButton,
    'exchange-change-nickname': handleExchangeChangeNicknameButton,
    'join-team': handleJoinTeamButton,
};
