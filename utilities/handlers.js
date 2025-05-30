const commandHandlers = require("../commands");
const buttonHandlers = require("../buttons");
const messageHandlers = require("../messages");
const createEmbed = require("../helpers/embed");
const userExchangeData = require("../helpers/userExchangeData");
const {
  createImageSettingsUsersDataCache,
} = require("../helpers/create-image-settings-cache");
const trolledUserCache = require("../helpers/trolled-user-cache");
const TrolledUser = require("../models/trolled-users");
const handleTrollUserChooseMission = require("../messages/troll-user-choose-mission");
const handleExpMessages = require("../messages/exp-messages");

async function handleSlashCommand(interaction, client) {
  const { commandName } = interaction;

  // Check if the command exists in your command handlers
  if (commandHandlers[commandName]) {
    // Execute the corresponding command handler
    await commandHandlers[commandName](interaction, client);
  } else {
    logger.error(`Unknown command: ${commandName}`);

    // Create an embed for the unknown command response
    const title = "Unknown Command";
    const description = `I do not recognize this command.`;
    const color = "#FF0000"; // Use a hex color for 'error'
    const embed = createEmbed(title, description, color);

    // Reply to the user with an ephemeral message
    await interaction.editReply({
      embeds: [embed],
      ephemeral: true, // This will make the reply visible only to the user
    });
  }
}

async function handleButtonClicks(interaction, client) {
  const name = interaction.customId.split(":")[0];

  // Check if the button click handler exists
  if (buttonHandlers[name]) {
    // Execute the corresponding button handler
    await buttonHandlers[name](interaction, client);
  } else {
    logger.error(`Unknown button: ${name}`);

    // Create an embed for the unknown button response
    const title = "Unknown Button";
    const description = `I do not recognize this button.`;
    const color = "#FF0000"; // Use a hex color for 'error'
    const embed = createEmbed(title, description, color);

    // Update the interaction with an error message (ephemeral)
    await interaction.editReply({
      embeds: [embed],
      ephemeral: true, // This will make the reply visible only to the user
    });
  }
}

async function handleMessageReplies(message, client) {
  const userId = message.author.id;

  if (
    userExchangeData.has(userId) &&
    message.channelId === userExchangeData.get(userId).threadId
  ) {
    if (userExchangeData.get(userId).name) {
      return messageHandlers[userExchangeData.get(userId).name](
        message,
        client
      );
    }
  }

  if (
    createImageSettingsUsersDataCache.has(userId) &&
    message.channelId ===
      createImageSettingsUsersDataCache.get(userId).channelId
  ) {
    if (createImageSettingsUsersDataCache.get(userId).name) {
      return messageHandlers[
        createImageSettingsUsersDataCache.get(userId).name
      ](message, client);
    }
  }

  // Check cache for trolled users without mission_id
  const trolledUser = trolledUserCache.get(userId);
  if (
    trolledUser &&
    message.channelId === trolledUser.channel_id &&
    trolledUser.mission_id == null
  ) {
    return handleTrollUserChooseMission(message, client, trolledUser);
  }

  // Handle regular messages for EXP tracking
  await handleExpMessages(message, client);
}

module.exports = {
  handleSlashCommand,
  handleButtonClicks,
  handleMessageReplies,
};
