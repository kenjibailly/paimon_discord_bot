require("dotenv/config");
const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");
const express = require("express");
const {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} = require("discord-interactions");
const {
  handleSlashCommand,
  handleButtonClicks,
  handleMessageReplies,
} = require("./utilities/handlers.js");
const botJoinsGuild = require("./bot_joins_guild");
const checkRemoveRewards = require("./check/remove-rewards");
const checkTeamAssignment = require("./check/team-assignment");
const handleTrolledUserJoin = require("./utilities/handle-trolled-user-join");
const Logger = require("./utilities/logger.js");
global.logger = new Logger("Bot");

const mongoose = require("mongoose");
const mongodb_URI = require("./mongodb/URI");
// const registerCommands = require('./commands/deploy-commands');

mongoose
  .connect(mongodb_URI)
  .then(() => {
    logger.success("DB connected!");
  })
  .catch((err) => {
    logger.error(err);
  });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, () => {
  logger.success(`Logged in as ${client.user.tag}!`);

  // // Iterate over all guilds the bot is in
  // client.guilds.cache.forEach((guild) => {
  //   const guildId = guild.id;
  //   logger.log(`Registering commands for guild: ${guild.name} (ID: ${guildId})`);

  //   // Call the function to register commands for this guild
  //   registerCommands(guildId);
  // });

  setInterval(() => {
    checkRemoveRewards(client);
  }, 86400000); // 24 hours in milliseconds 86400000

  setInterval(() => {
    checkTeamAssignment(client);
  }, 300000); // 5 minutes in milliseconds 300000
});

client.on("guildCreate", async (guild) => {
  botJoinsGuild(client, guild);
});

// When a user joins the server, check if they're being trolled
client.on("guildMemberAdd", async (member) => {
  await handleTrolledUserJoin(member);
});

// Express server setup for handling interactions
const app = express();
const PORT = process.env.PORT || 3000;

client.on("interactionCreate", async (interaction) => {
  try {
    const { type } = interaction;

    if (type === InteractionType.APPLICATION_COMMAND) {
      // Define ephemeral commands
      const ephemeralCommands = [
        "create-image-settings",
        "set-teams",
        "set-reward",
        "set-all-rewards",
        "set-token-emoji",
        "set-bot-channel",
        "set-channel-name-configuration",
        "start-event",
        "manage-games",
        "manage-troll-missions",
        "cancel-event",
        "reset-teams",
        "set-status",
        "send-embed-file",
        "download-embed-file",
        "edit-embed-file",
      ];

      const commandName = interaction.commandName;

      // Check if the command requires an ephemeral reply
      const isEphemeral = ephemeralCommands.includes(commandName);
      // Defer the reply and specify if it should be ephemeral
      await interaction.deferReply({ ephemeral: isEphemeral });
      await handleSlashCommand(interaction, client);
    } else if (type === InteractionType.MESSAGE_COMPONENT) {
      await interaction.deferUpdate();
      await handleButtonClicks(interaction, client);
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "There was an error processing your request.",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  const response = await handleMessageReplies(message, client);
  // return res.send(response);
});

app.listen(PORT, () => {
  logger.success("Express server listening on port:", PORT);
});

client.login(process.env.DISCORD_TOKEN);
