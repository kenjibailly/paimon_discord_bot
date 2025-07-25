const handleAwardTeamCommand = require("./award-team");
const handleWalletCommand = require("./wallet");
const handleDeductUserCommand = require("./deduct-user");
const handleAwardUserCommand = require("./award-user");
const handleShopCommand = require("./shop");
const handleSetRewardCommand = require("./set-reward");
const handleSetAllRewardsCommand = require("./set-all-rewards");
const handleSetTeamsCommand = require("./set-teams");
const handleSetWalletConfigCommand = require("./set-wallet-config");
const handleSetBotChannelCommand = require("./set-bot-channel");
const handleManageGamesCommand = require("./manage-games");
const handleManageTrollMissionsCommand = require("./manage-troll-missions");
const handleGamesCommand = require("./games");
const handleTrollMissionsCommand = require("./troll-missions");
const handleResetTeamsCommand = require("./reset-teams");
const handleSetStatusCommand = require("./set-status");
const handleStartEventCommand = require("./start-event");
const handleCancelEventCommand = require("./cancel-event");
const handleChannelNameConfigurationCommand = require("./set-channel-name-configuration");
const handleTrollUserCompleteMissionCommand = require("./troll-user-complete-mission");
const handleNextGamesCommand = require("./next-games");
const handleCreateImageCommand = require("./create-image");
const handleCreateImageSettingsCommand = require("./create-image-settings");
const handleSendEmbedFileCommand = require("./send-embed-file");
const handleDownloadEmbedFileCommand = require("./download-embed-file");
const handleEditEmbedFileCommand = require("./edit-embed-file");
const handleStaffRoleCommand = require("./set-staff-role");
const handleIntroductionCommand = require("./introduction");
const handleManageDailyCharacterPollCommand = require("./manage-daily-character-poll-command");
const handleRegisterSlashCommandsCommand = require("./register-slash-commands");
const handleLevelConfigCommand = require("./level-config");
const { handleLevelCommand } = require("./level");
const handleSendEmbedCommand = require("./send-embed");
const handleSetIntroductionChannelCommand = require("./set-introduction-channel");
const handleJoinLeaveConfigCommand = require("./join-leave-config");
const handleJoinLeaveCommand = require("./join-leave");
const handleLeaderboardCommand = require("./leaderboard");
const handleSendTicketMessageCommand = require("./ticket-message");

module.exports = {
  "award-team": handleAwardTeamCommand,
  wallet: handleWalletCommand,
  "deduct-user": handleDeductUserCommand,
  "award-user": handleAwardUserCommand,
  shop: handleShopCommand,
  "set-reward": handleSetRewardCommand,
  "set-all-rewards": handleSetAllRewardsCommand,
  "set-teams": handleSetTeamsCommand,
  "set-wallet-config": handleSetWalletConfigCommand,
  "set-bot-channel": handleSetBotChannelCommand,
  "manage-games": handleManageGamesCommand,
  "manage-troll-missions": handleManageTrollMissionsCommand,
  games: handleGamesCommand,
  "troll-missions": handleTrollMissionsCommand,
  "reset-teams": handleResetTeamsCommand,
  "set-status": handleSetStatusCommand,
  "start-event": handleStartEventCommand,
  "cancel-event": handleCancelEventCommand,
  "set-channel-name-configuration": handleChannelNameConfigurationCommand,
  "troll-user-complete-mission": handleTrollUserCompleteMissionCommand,
  "upcoming-games": handleNextGamesCommand,
  "create-image": handleCreateImageCommand,
  "create-image-settings": handleCreateImageSettingsCommand,
  "send-embed-file": handleSendEmbedFileCommand,
  "download-embed-file": handleDownloadEmbedFileCommand,
  "edit-embed-file": handleEditEmbedFileCommand,
  "set-staff-role": handleStaffRoleCommand,
  introduction: handleIntroductionCommand,
  "manage-daily-character-poll": handleManageDailyCharacterPollCommand,
  "register-slash-commands": handleRegisterSlashCommandsCommand,
  "level-config": handleLevelConfigCommand,
  level: handleLevelCommand,
  "send-embed": handleSendEmbedCommand,
  "set-introduction-channel": handleSetIntroductionChannelCommand,
  "join-leave-config": handleJoinLeaveConfigCommand,
  "join-leave": handleJoinLeaveCommand,
  leaderboard: handleLeaderboardCommand,
  "ticket-message": handleSendTicketMessageCommand,
};
