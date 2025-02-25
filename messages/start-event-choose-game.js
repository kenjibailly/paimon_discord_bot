const createEmbed = require("../helpers/embed");
const userExchangeData = require("../helpers/userExchangeData");
const cancelThread = require("../helpers/cancel-thread");
const Events = require("../models/events");
const validateNumber = require("../helpers/validate-number");
const { EmbedBuilder } = require("discord.js");

async function handleStartEventChooseGame(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);
  if (user_exchange_data.name !== "start-event-choose-game") {
    return;
  }

  const messageContent = message.content;
  const validationError = validateNumber(
    messageContent,
    user_exchange_data.games
  );

  if (validationError) {
    logger.error("Validation Error:", validationError);
    // Send a confirmation message before closing the thread
    const title = `Input Error`;
    const description = `${validationError}\nPlease try again.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  const game = user_exchange_data.games[Number(messageContent) - 1];

  let newEvent;
  try {
    newEvent = new Events({
      guild_id: message.guildId,
      channel_id: user_exchange_data.channel_id,
      name: user_exchange_data.event_name,
      description: user_exchange_data.event_description,
      max_members_per_team: user_exchange_data.max_members_per_team,
      game: game._id,
      expiration: user_exchange_data.expiration,
      color: user_exchange_data.color,
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

    // Send a confirmation message before closing the thread
    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  const embedEvent = new EmbedBuilder()
    .setTitle(user_exchange_data.event_name || "Event Started!")
    .setDescription(
      user_exchange_data.event_description || "No description provided"
    )
    .setImage(user_exchange_data.image || undefined)
    .setColor(user_exchange_data.color) // Customize the color
    .addFields([
      { name: "Game", value: game.name, inline: true },
      {
        name: "Game Description",
        value: game.description ? game.description : "No description",
        inline: true,
      },
    ]);

  const channel = await client.channels.fetch(user_exchange_data.channel_id);
  const sentMessage = await channel.send({
    embeds: [embedEvent],
    components: [
      {
        type: 1, // Action row type
        components: [
          {
            type: 2, // Button type
            style: 1, // Primary style
            label: "Join Team",
            emoji: {
              name: "⚔️", // Use the name
            },
            custom_id: `join-team:${newEvent._id}`,
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

  // Send a confirmation message before closing the thread
  await message.channel.send({
    embeds: [embed],
  });

  userExchangeData.delete(message.author.id);
  cancelThread(message.guildId, message.channelId, client);
}

module.exports = handleStartEventChooseGame;
