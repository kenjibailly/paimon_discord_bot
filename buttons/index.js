const handleExchangeShopButton = require('./exchange-shop');
const handleExchangeShopMenu = require('./exchange-shop-menu');
const handleCancelThread = require('./cancel-thread');
const handleExchangeChangeOwnNickname = require('./exchange-change-own-nickname');

module.exports = {
    'exchange-shop': handleExchangeShopButton,
    'exchange-shop-menu': handleExchangeShopMenu,
    'cancel-thread': handleCancelThread,
    'exchange-change-own-nickname': handleExchangeChangeOwnNickname,
};
