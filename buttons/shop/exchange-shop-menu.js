const handleChangeNickname = require("./menu-handler/handle-change-nickname");
const handleCustomEmoji = require("./menu-handler/handle-custom-emoji");
const handleCustomChannel = require("./menu-handler/handle-custom-channel");
const handleCustomRole = require("./menu-handler/handle-custom-role");
const handleTrollUser = require("./menu-handler/handle-troll-user");
const handleChooseGame = require("./menu-handler/handle-choose-game");

async function handleExchangeShopMenuButton(interaction, client) {
  const name = interaction.values[0];

  switch (name) {
    case "change-own-nickname":
      return await handleChangeNickname(name, interaction, client);
    case "change-user-nickname":
      return await handleChangeNickname(name, interaction, client);
    case "custom-emoji":
      return await handleCustomEmoji(name, interaction);
    case "custom-channel":
      return await handleCustomChannel(name, interaction);
    case "custom-role":
      return await handleCustomRole(name, interaction);
    case "troll-user":
      return await handleTrollUser(name, interaction);
    case "choose-game":
      return await handleChooseGame(name, interaction, client);
    default:
      break;
  }
}

module.exports = handleExchangeShopMenuButton;
