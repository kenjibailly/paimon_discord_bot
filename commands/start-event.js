const {
  InteractionResponseType,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord-interactions");
const Events = require("../models/events");
const NextGames = require("../models/next-games");
const Games = require("../models/games");
const createEmbed = require("../helpers/embed"); // Assuming this is a helper function to create embeds
const userExchangeData = require("../helpers/userExchangeData");

async function handleStartEventCommand(interaction, client) {
  const { guildId, channelId } = interaction;

  try {
    const event = await Events.findOne({ guild_id: guildId });
    if (event) {
      const title = "Error Start Event";
      const description = `You already have an ongoing event, please let it finish or cancel it using the \`/cancel-event\` command.`;
      const color = "error";
      const embed = createEmbed(title, description, color);
      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    // Find each option by name
    const event_name = interaction.options.getString("name");
    const event_description = interaction.options.getString("description");
    const auto_team_generation = interaction.options.getBoolean(
      "auto_team_generation"
    );
    const max_members_per_team = interaction.options.getInteger(
      "max_members_per_team"
    );
    const image = interaction.options.getString("image");
    const color = interaction.options.getString("color");
    const expiration = interaction.options.getInteger("expiration");

    if (image && !isValidImageUrl(image)) {
      // Handle invalid image URL
      const title = "Invalid Image URL";
      const description =
        "The provided image URL is not valid. Please ensure it ends with .jpg, .jpeg, .png, .gif, .bmp, or .webp.";
      const color = "error";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    let color_embed = "#7f2aff";
    if (color) {
      switch (color) {
        case "purple":
          color_embed = "#7f2aff";
          break;
        case "red":
          color_embed = "error";
          break;
        case "yellow":
          color_embed = "#ffb800";
          break;
        case "green":
          color_embed = "#47ff00";
          break;
        case "cyan":
          color_embed = "#00ffe0";
          break;
        case "blue":
          color_embed = "#00b8ff";
          break;
        case "pink":
          color_embed = "#ff008f";
          break;
        default:
          break;
      }
    }

    let time_generation = 24;
    if (expiration) {
      time_generation = expiration;
    }

    let user_exchange_data = {};
    user_exchange_data.channel_id = channelId;
    user_exchange_data.event_name = event_name;
    user_exchange_data.event_description = event_description;
    user_exchange_data.auto_team_generation = auto_team_generation;
    user_exchange_data.max_members_per_team = max_members_per_team;
    user_exchange_data.image = image;
    user_exchange_data.color = color_embed;
    user_exchange_data.expiration = time_generation;
    // Store the updated object back into userExchangeData
    userExchangeData.set(interaction.member.user.id, user_exchange_data);

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    // Create a private thread that is only visible to the user who clicked the button
    const thread = await channel.threads.create({
      name: `Start Event - ${interaction.member.user.globalName}`, // Ensure you use the correct user property
      autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
      reason: "User initiated start event interaction",
      invitable: false, // Don't allow other users to join the thread
      type: 12, // Private Thread (only visible to members who are added)
    });

    // Add the user who clicked the button to the thread
    await thread.members.add(interaction.member.user.id);

    let description;
    let button_component = [];

    const next_game = await NextGames.findOne({ guild_id: guildId }).sort({
      date: 1,
    });

    if (next_game) {
      const game = await Games.findById(next_game.game_id);
      if (game) {
        description =
          `Someone has added an upcoming game, do you want to select this game?\n\n` +
          `- Name: **${game.name}**\n` +
          `  Description: **${
            game.description ? game.description : "No description available."
          }**\n\n` +
          `Or do you want to add another existing game to your event?`;
        button_component = [
          {
            type: 2, // Button
            style: 1, // Primary style (for updating a game)
            label: "Upcoming Game",
            emoji: { name: "➕" },
            custom_id: "start-event-next-game",
          },
          {
            type: 2, // Button
            style: 1, // Primary style (for updating a game)
            label: "Other Game",
            emoji: { name: "✅" },
            custom_id: "start-event-add-game",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "No Game",
            emoji: { name: "🫸" },
            custom_id: "start-event-no-game",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ];
        user_exchange_data.game = game;
        userExchangeData.set(interaction.member.user.id, user_exchange_data);
      } else {
        description = `There are no upcoming games, would you like to add an existing game to your event?`;
        button_component = [
          {
            type: 2, // Button
            style: 1, // Primary style (for updating a game)
            label: "Yes",
            emoji: { name: "✅" }, // Pencil emoji for updating
            custom_id: "start-event-add-game",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "No",
            emoji: { name: "🫸" }, // Trash bin emoji for removing
            custom_id: "start-event-no-game",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ];
      }
    } else {
      description = `There are no upcoming games, would you like to add an existing game to your event?`;
      button_component = [
        {
          type: 2, // Button
          style: 1, // Primary style (for updating a game)
          label: "Yes",
          emoji: { name: "✅" }, // Pencil emoji for updating
          custom_id: "start-event-add-game",
        },
        {
          type: 2, // Button
          style: 4, // Danger style (for removing a game)
          label: "No",
          emoji: { name: "🫸" }, // Trash bin emoji for removing
          custom_id: "start-event-no-game",
        },
        {
          type: 2, // Button
          style: 4, // Danger style (for removing a game)
          label: "Cancel",
          custom_id: "cancel-thread",
        },
      ];
    }

    // Post the message in the thread
    let title = "Start Event";
    let embed = createEmbed(title, description, "");

    // Send the message to the thread
    const message = await thread.send({
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: button_component,
        },
      ],
    });

    title = "Start Event";
    description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
    embed = createEmbed(title, description, "");
    await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    logger.error("Error handling start event command:", error);
    await interaction.editReply({
      content: "An error occurred while handling the command.",
      flags: 64, // ephemeral // Ephemeral message
    });
  }
}

function isValidImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
}

module.exports = handleStartEventCommand;
