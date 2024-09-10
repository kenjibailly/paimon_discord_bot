const { handleChangeNickname, handleChangeUserNickname} = require('./change-nickname');
const { handleManageGames, handleUpdateGameName, handleUpdateGameDescription } = require('./manage-games');
const handleStartEventChooseGame = require('./start-event-choose-game');

module.exports = {
    'change-user-nickname': handleChangeUserNickname,
    'change-own-nickname': handleChangeNickname,
    'manage-games': handleManageGames,
    'update-game-name': handleUpdateGameName,
    'update-game-description': handleUpdateGameDescription,
    'start-event-choose-game': handleStartEventChooseGame,
};
