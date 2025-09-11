const {
  handleChangeNickname,
  handleChangeUserNickname,
} = require("./change-nickname");
const handleCustomEmoji = require("./custom-emoji");
const {
  handleManageGames,
  handleAddGameName,
  handleAddGameDescription,
  handleUpdateGameName,
  handleUpdateGameDescription,
} = require("./manage-games");
const {
  handleManageTrollMissions,
  handleAddTrollMissionName,
  handleAddTrollMissionDescription,
  handleUpdateTrollMissionName,
  handleUpdateTrollMissionDescription,
} = require("./manage-troll-missions");
const handleStartEventChooseGame = require("./start-event-choose-game");
const { handleCustomRole, handleCustomRoleColor } = require("./custom-role");
const {
  handleCustomChannel,
  handleCustomChannelCategory,
  handleCustomChannelEmoji,
} = require("./custom-channel");
const handleChannelNameConfiguration = require("./channel-name-config");
const handleTrollUser = require("./troll-user");
const handleChooseGame = require("./choose-game");
const handleChooseModel = require("./choose-model");
const handleChooseLora = require("./choose-lora");
const handleChooseDimensions = require("./choose-dimensions");
const {
  handleManageRules,
  handleAddRuleName,
  handleAddRuleDescription,
  handleUpdateRuleName,
  handleUpdateRuleDescription,
} = require("./manage-rules");

module.exports = {
  "change-user-nickname": handleChangeUserNickname,
  "change-own-nickname": handleChangeNickname,
  "manage-games": handleManageGames,
  "add-game-name": handleAddGameName,
  "add-game-description": handleAddGameDescription,
  "update-game-name": handleUpdateGameName,
  "update-game-description": handleUpdateGameDescription,
  "manage-troll-missions": handleManageTrollMissions,
  "add-troll-mission-name": handleAddTrollMissionName,
  "add-troll-mission-description": handleAddTrollMissionDescription,
  "update-troll-mission-name": handleUpdateTrollMissionName,
  "update-troll-mission-description": handleUpdateTrollMissionDescription,
  "start-event-choose-game": handleStartEventChooseGame,
  "custom-emoji": handleCustomEmoji,
  "custom-role": handleCustomRole,
  "custom-role-color": handleCustomRoleColor,
  "custom-channel": handleCustomChannel,
  "custom-channel-category": handleCustomChannelCategory,
  "custom-channel-emoji": handleCustomChannelEmoji,
  "channel-name-config": handleChannelNameConfiguration,
  "troll-user": handleTrollUser,
  "choose-game": handleChooseGame,
  "choose-model": handleChooseModel,
  "choose-lora": handleChooseLora,
  "choose-dimensions": handleChooseDimensions,
  "manage-rules": handleManageRules,
  "add-rule-name": handleAddRuleName,
  "add-rule-description": handleAddRuleDescription,
  "update-rule-name": handleUpdateRuleName,
  "update-rule-description": handleUpdateRuleDescription,
};
