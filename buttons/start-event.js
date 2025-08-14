const createEmbed = require("../helpers/embed");
const { EmbedBuilder } = require("discord.js");
const Games = require("../models/games");
const Events = require("../models/events");
const userExchangeData = require("../helpers/userExchangeData");
const cancelThread = require("./cancel-thread");

async function handleStartEventAddGameButton(interaction, client) {
  try {
    const games = await Games.find({ guild_id: interaction.guildId });

    if (games.length > 0) {
      let games_list = "";

      games.forEach((game, index) => {
        games_list += `${index + 1}. **${game.name}**\n`;
      });

      // Retrieve the existing data
      let existingData = userExchangeData.get(interaction.member.user.id) || {};

      // Update or add new values to the existing data
      userExchangeData.set(interaction.member.user.id, {
        ...existingData, // Spread the existing data to keep it intact
        threadId: interaction.channelId,
        name: "start-event-choose-game",
        games: existingData.games || games,
      });

      const title = `Start Event`;
      const description = `Please reply with the number next to the game to add that game to your event.\n\n${games_list}`;
      const embed = createEmbed(title, description, "");
      await interaction.editReply({
        embeds: [embed],
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a game)
                label: "Cancel",
                custom_id: "cancel-thread",
              },
            ],
          },
        ],
        flags: 64, // ephemeral
      });
    } else {
      const title = "No games found";
      const description = `I couldn't find any games, please add one first using the \`/add-game\` command.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
      await interaction.editReply({
        embeds: [embed],
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a game)
                label: "Cancel",
                custom_id: "cancel-thread",
              },
            ],
          },
        ],
      });
      cancelThread(interaction, client);
    }
  } catch (error) {
    const title = "Error";
    const description = `Something went wrong, please try again later or contact your administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
    await interaction.editReply({ embeds: [embed], flags: 64 });
    cancelThread(interaction, client);
  }
}

async function handleStartEventNoGameButton(interaction, client) {
  const user_exchange_data = userExchangeData.get(interaction.member.user.id);
  let newEvent;
  try {
    newEvent = new Events({
      guild_id: interaction.guildId,
      channel_id: user_exchange_data.channel_id,
      name: user_exchange_data.event_name,
      description: user_exchange_data.event_description,
      auto_team_generation: user_exchange_data.auto_team_generation,
      max_members_per_team: user_exchange_data.max_members_per_team,
      expiration: user_exchange_data.expiration,
      color: user_exchange_data.color,
      event_date: user_exchange_data.event_date,
      timezone: user_exchange_data.timezone,
    });
    const savedEvent = await newEvent.save();

    if (!savedEvent) {
      // If the result is falsy, throw an error
      throw new Error("New event could not be saved.");
    }
  } catch (error) {
    logger.error("Add Event Error:", error);
    const title = "Add Event Error";
    const description = `I could not add the event to the database. Please contact your administrator, or try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
    return;
  }

  // Build embed content
  const eventTitle = user_exchange_data.event_name || "Event Started!";
  const eventColor = user_exchange_data.color;
  const timezone = user_exchange_data.timezone;

  const rawDescription =
    user_exchange_data.event_description || "No description provided";

  // Convert "\n" (typed literally in the command) into real line breaks
  const eventDescription = rawDescription.replace(/\\n/g, "\n");

  const embedEvent = new EmbedBuilder()
    .setTitle(eventTitle)
    .setDescription(eventDescription)
    .setColor(eventColor || null);

  // Add image if it exists
  if (user_exchange_data.image) {
    embedEvent.setImage(user_exchange_data.image);
  }

  // Add "Sign up ends on:" field
  if (user_exchange_data.expiration) {
    embedEvent.addFields({
      name: "Sign up ends in:",
      value: `${user_exchange_data.expiration} days`,
    });
  }

  // Add "Event starts on:" field (raw string with timezone)
  if (user_exchange_data.event_date) {
    embedEvent.addFields({
      name: "Event starts on:",
      value: `${user_exchange_data.event_date} ${timezone}`,
    });
  }

  // Clean up user data
  userExchangeData.delete(interaction.member.user.id);

  // Send embed with buttons
  const channel = await client.channels.fetch(user_exchange_data.channel_id);
  const sentMessage = await channel.send({
    content: user_exchange_data.tag_everyone ? "@everyone" : undefined,
    embeds: [embedEvent],
    components: [
      {
        type: 1, // Action row
        components: [
          {
            type: 2,
            style: 1,
            label: "Sign up",
            emoji: { name: "⚔️" },
            custom_id: `join-team:${newEvent._id}`,
          },
          {
            type: 2,
            style: 4,
            label: "Sign off",
            emoji: { name: "⛔" },
            custom_id: `leave-team:${newEvent._id}`,
          },
        ],
      },
    ],
  });

  try {
    // Get the message ID from the sent message
    const messageId = sentMessage.id;
    await Events.findOneAndUpdate(
      { _id: newEvent._id },
      { message_id: messageId }
    );
  } catch (error) {
    logger.error("Add Event Error:", error);
    const title = "Add Event Error";
    const description = `I could not add the event's message ID to the database. Please contact your administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    // Send a confirmation message before closing the thread
    await message.channel.send({
      embeds: [embed],
    });
  }

  const title = "Event Posted";
  const description = `Your event has been posted where you started the \`/start-event\` command.`;
  const color = "";
  const embed = createEmbed(title, description, color);

  // Send the embed with the button to the specified channel
  await interaction.editReply({
    embeds: [embed],
    components: [], // Ensure this is an empty array
  });
  cancelThread(interaction, client);
}

module.exports = {
  handleStartEventAddGameButton,
  handleStartEventNoGameButton,
};
