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
const checkDailyCharacterPoll = require("./check/daily-character-poll");
const checkTeamAssignment = require("./check/team-assignment");
const handleTrolledUserJoin = require("./utilities/handle-trolled-user-join");
const Logger = require("./utilities/logger.js");
global.logger = new Logger("Bot");
const game = require("./introduction/game.json");
const countries = require("./introduction/countries.json");
const activeVoiceChannelsData = require("./helpers/activeVoiceChannelsData");
const mongoose = require("mongoose");
const mongodb_URI = require("./mongodb/URI");
// const registerCommands = require('./commands/deploy-commands');
const giveExp = require("./helpers/give-exp");
const userLastMessageTimestamps = require("./helpers/userLastMessageTimestamps");
const handleNicknameUserJoin = require("./utilities/handle-nickname-user-join.js");

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
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.GuildVoiceStates,
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
    checkDailyCharacterPoll(client);
  }, 300000); // 5 minutes in milliseconds 300000

  // ✅ Start inactivity interval once after bot is ready
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const voiceChannels = guild.channels.cache.filter(
        (ch) => ch.type === 2 && ch.members.size > 0
      );

      for (const channel of voiceChannels.values()) {
        for (const [userId, member] of channel.members) {
          if (member.user.bot) continue;

          const isMuted = member.voice.selfMute;
          const lastTextTime = userLastMessageTimestamps.get(userId) || 0;
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

          if (isMuted && lastTextTime < tenMinutesAgo) {
            try {
              await member.voice.disconnect();
              logger.warn(`Disconnected ${member.user.tag} for inactivity.`);
            } catch (err) {
              logger.error(`Failed to disconnect ${member.user.tag}:`, err);
            }
          }
        }
      }
    }
  }, 10 * 59 * 1000); // every 10 minutes
});

client.on("guildCreate", async (guild) => {
  botJoinsGuild(client, guild);
});

// When a user joins the server, check if they're being trolled
client.on("guildMemberAdd", async (member) => {
  await handleTrolledUserJoin(member);
  await handleNicknameUserJoin(member);
});

// Express server setup for handling interactions
const app = express();
const PORT = process.env.PORT || 3000;

client.on("interactionCreate", async (interaction) => {
  try {
    const { type } = interaction;

    if (type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      // Handle autocomplete for "favorite_character" in "introduction" command
      if (
        interaction.commandName === "introduction" &&
        interaction.options.getFocused(true).name === "favorite_character"
      ) {
        const focusedOption = interaction.options.getFocused(true);
        const typed = focusedOption.value.toLowerCase();

        // Filter characters by typed input and limit to 25
        const filtered = game.characters
          .filter((c) => c.name.toLowerCase().startsWith(typed))
          .slice(0, 25);

        const choices = filtered.map((c) => ({
          name: c.name,
          value: c.name,
        }));

        await interaction.respond(choices);
        return;
      } else if (
        interaction.commandName === "introduction" &&
        interaction.options.getFocused(true).name === "country"
      ) {
        const focusedOption = interaction.options.getFocused(true);
        const typed = focusedOption.value.toLowerCase();

        // Filter characters by typed input and limit to 25
        const filtered = countries
          .filter((c) => c.name.toLowerCase().startsWith(typed))
          .slice(0, 25);

        const choices = filtered.map((c) => ({
          name: c.name,
          value: c.name,
        }));

        await interaction.respond(choices);
        return;
      }
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
      // Define ephemeral commands
      const ephemeralCommands = [
        "create-image-settings",
        "set-teams",
        "set-reward",
        "set-all-rewards",
        "set-wallet-config",
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
        "set-staff-role",
        "manage-daily-character-poll",
        "register-slash-commands",
        "set-introduction-channel",
        "join-leave",
        "join-leave-config",
        "manage-rules",
        "timeout-user",
      ];

      const commandName = interaction.commandName;

      // Check if the command requires an ephemeral reply
      const isEphemeral = ephemeralCommands.includes(commandName);
      if (isEphemeral) {
        // Defer the reply and specify if it should be ephemeral
        await interaction.deferReply({ ephemeral: isEphemeral });
      }
      await handleSlashCommand(interaction, client);
    } else if (type === InteractionType.MESSAGE_COMPONENT) {
      if (interaction.customId !== "create-ticket") {
        await interaction.deferUpdate();
      }
      await handleButtonClicks(interaction, client);
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "There was an error processing your request.",
        flags: 64, // ephemeral
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  const response = await handleMessageReplies(message, client);
  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) return; // user not in VC
  userLastMessageTimestamps.set(message.author.id, Date.now());
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const channel = newState.channel || oldState.channel;
  if (!channel || channel.type !== 2) return;

  const guildId = newState.guild?.id || oldState.guild?.id;
  if (!guildId) return;

  const nonBotMembers = channel.members.filter((member) => !member.user.bot);

  if (nonBotMembers.size >= 2) {
    if (!activeVoiceChannelsData.has(channel.id)) {
      const intervalId = setInterval(async () => {
        const updatedChannel = await client.channels.fetch(channel.id);
        const updatedMembers = updatedChannel.members.filter(
          (m) => !m.user.bot
        );

        if (updatedMembers.size < 2) {
          clearInterval(activeVoiceChannelsData.get(channel.id));
          activeVoiceChannelsData.delete(channel.id);
          return;
        }

        for (const member of updatedMembers.values()) {
          await giveExp(member.user.id, channel.id, guildId, client);
        }
      }, 60_000);

      activeVoiceChannelsData.set(channel.id, intervalId);
    }
  } else {
    if (activeVoiceChannelsData.has(channel.id)) {
      clearInterval(activeVoiceChannelsData.get(channel.id));
      activeVoiceChannelsData.delete(channel.id);
    }
  }
});

app.listen(PORT, () => {
  logger.success("Express server listening on port:", PORT);
});

client.login(process.env.DISCORD_TOKEN);
