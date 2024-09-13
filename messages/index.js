const { handleChangeNickname, handleChangeUserNickname} = require('./change-nickname');
const handleCustomEmoji = require('./custom-emoji');
const { handleManageGames, handleUpdateGameName, handleUpdateGameDescription } = require('./manage-games');
const handleStartEventChooseGame = require('./start-event-choose-game');
const { handleCustomRole, handleCustomRoleColor } = require('./custom-role');

module.exports = {
    'change-user-nickname': handleChangeUserNickname,
    'change-own-nickname': handleChangeNickname,
    'manage-games': handleManageGames,
    'update-game-name': handleUpdateGameName,
    'update-game-description': handleUpdateGameDescription,
    'start-event-choose-game': handleStartEventChooseGame,
    'custom-emoji': handleCustomEmoji,
    'custom-role': handleCustomRole,
    'custom-role-color': handleCustomRoleColor,
};
