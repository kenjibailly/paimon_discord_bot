const Rewards = require("./models/rewards");
const TokenEmoji = require("./models/wallet-config"); // Import the TokenEmoji model
const deployCommands = require("./commands/deploy-commands");
const ChannelNameConfig = require("./models/channel-name-config");
const TrollMissions = require("./models/troll-missions");

async function botJoinsGuild(client, guild) {
  const guildId = guild.id;

  try {
    deployCommands(guildId);
  } catch (error) {
    logger.error("Deploy Commands Error: ", error);

    const title = "Deploy Commands Error";
    const description = `I could not deploy some slash commands, please contact your administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    try {
      // Fetch the guild (server) using the guild ID
      const guild = await client.guilds.fetch(guildId);

      // Fetch the owner of the guild
      const owner = await guild.fetchOwner();

      // Send the embed as a direct message (DM) to the owner
      await owner.send({
        embeds: [embed],
      });

      logger.success("Message sent to the server owner successfully.");
    } catch (error) {
      logger.error("Error sending message to the server owner:", error);
    }
  }

  // Define the rewards to add
  const rewardsToAdd = [
    {
      guild_id: guildId,
      name: "change-own-nickname",
      short_description: "Change your nickname",
    },
    {
      guild_id: guildId,
      name: "change-user-nickname",
      short_description: "Change someone's nickname",
    },
    {
      guild_id: guildId,
      name: "custom-emoji",
      short_description: "Add a custom server emoji",
    },
    {
      guild_id: guildId,
      name: "custom-channel",
      short_description: "Add a custom channel",
    },
    {
      guild_id: guildId,
      name: "custom-role",
      short_description: "Add a custom role name and color",
    },
    {
      guild_id: guildId,
      name: "choose-game",
      short_description: "Choose the next game",
    },
    {
      guild_id: guildId,
      name: "troll-user",
      time: null,
      short_description: `Troll someone`,
      long_description: `This person won't see any channels in the server until a mission on the list is completed. This person can choose their own mission from the list of missions. To see all missions use the \`/troll-missions\` command`,
    },
  ];

  const trollMissionsToAdd = [
    {
      guild_id: guildId,
      name: `Embarrassing Selfie Challenge`,
      description: `You must post a funny or embarrassing selfie.`,
    },
    {
      guild_id: guildId,
      name: `Draw Something Silly`,
      description: `You must create and upload a goofy artwork, like a doodle of a meme.`,
    },
    {
      guild_id: guildId,
      name: `Public Declaration`,
      description: `You must post a funny or harmless "confession" in the general chat.`,
    },
    {
      guild_id: guildId,
      name: `Touch Grass`,
      description: `You must take a picture of themselves outside,  while holding a sign that says “I’ve been trolled”.`,
    },
    {
      guild_id: guildId,
      name: `Pet Dress-Up`,
      description: `You must dress up your pet in a silly costume and take a picture.`,
    },
    {
      guild_id: guildId,
      name: `Create a Meme`,
      description: `You must make a meme related to the server or a popular trend.`,
    },
    {
      guild_id: guildId,
      name: `Dance Party`,
      description: `You must post a short video of themselves doing a random or embarrassing dance.`,
    },
  ];

  try {
    // Check if each reward already exists, and add it if it doesn't
    for (const reward of rewardsToAdd) {
      const exists = await Rewards.findOne({
        guild_id: guildId,
        name: reward.name,
      });

      if (!exists) {
        await Rewards.create(reward);
        logger.success(`Reward "${reward.name}" added for guild ${guildId}`);
      } else {
        logger.log(
          `Reward "${reward.name}" already exists for guild ${guildId}`
        );
      }
    }

    for (const trollMission of trollMissionsToAdd) {
      const exists = await TrollMissions.findOne({
        guild_id: guildId,
        name: trollMission.name,
      });

      if (!exists) {
        await TrollMissions.create(trollMission);
        logger.success(
          `Troll Mission "${trollMission.name}" added for guild ${guildId}`
        );
      } else {
        logger.log(
          `Troll Mission "${trollMission.name}" already exists for guild ${guildId}`
        );
      }
    }

    // Check if token emoji is already set, and add the default if not
    const tokenEmojiEntry = await TokenEmoji.findOne({ guild_id: guildId });

    if (!tokenEmojiEntry) {
      // Create a new entry with the default emoji 🪙
      await TokenEmoji.create({
        guild_id: guildId,
        token_emoji: "🪙", // Default emoji
        token_emoji_name: "🪙",
        token_emoji_id: null,
      });
      logger.success(`Default token emoji set for guild ${guildId}`);
    } else {
      logger.log(`Token emoji already set for guild ${guildId}`);
    }
  } catch (error) {
    logger.error(
      `Error processing rewards, token emoji or troll missions for guild ${guildId}:`,
      error
    );
  }

  try {
    const ChannelNameConfigEntry = await ChannelNameConfig.findOne({
      guild_id: guildId,
    });

    if (!ChannelNameConfigEntry) {
      // Create a new entry with the default emoji 🪙
      await ChannelNameConfig.create({
        guild_id: guildId,
      });
      logger.success(
        `Default channel name configuration set for guild ${guildId}`
      );
    } else {
      logger.log(`Channel Name Configuration already set for guild ${guildId}`);
    }
  } catch (error) {
    logger.error(
      `Error processing channel name configuration for guild ${guildId}:`,
      error
    );
  }
}

module.exports = botJoinsGuild;
