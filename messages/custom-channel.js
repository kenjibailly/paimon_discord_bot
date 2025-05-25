const { ChannelType } = require("discord.js");
const createEmbed = require("../helpers/embed");
const userExchangeData = require("../helpers/userExchangeData");
const getWalletConfig = require("../helpers/get-wallet-config");
const getReward = require("../helpers/get-reward");
const validateNumber = require("../helpers/validate-number");
const ChannelNameConfig = require("../models/channel-name-config");

async function handleCustomChannel(message, client) {
  const messageContent = message.content;
  const user_exchange_data = userExchangeData.get(message.author.id);

  const contentValidationError = validateChannelName(messageContent);
  if (contentValidationError) {
    // Handle message content validation error
    logger.error("Validation Error:", contentValidationError);
    const title = "Shop";
    const description = `${contentValidationError}\nPlease try again.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }
  const guild = await client.guilds.fetch(message.guild.id);
  const channelName = messageContent.toLowerCase();
  const existingChannels = guild.channels.cache;
  // Check if a channel with the given name already exists
  const channelExists = existingChannels.some(
    (channel) => channel.name === channelName
  );

  if (channelExists) {
    const title = "Channel Name Taken";
    const description = `A channel with the name "${channelName}" already exists. Please choose a different name.`;
    const color = "error"; // Assuming you have a color constant for errors
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  // Fetch token emoji using the getWalletConfig function
  const tokenEmoji = await getWalletConfig(message.guild.id);
  // Validation when tokenEmoji isn't set
  if (tokenEmoji.data) {
    await message.channel.send({
      embeds: [tokenEmoji],
    });
    return;
  }

  const reward = await getReward(message.guild.id, user_exchange_data.name);

  // Filter for category channels
  const categories = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.GuildCategory
  );

  // Filter categories that contain at least one text channel
  const validCategories = categories.filter((category) =>
    guild.channels.cache.some(
      (channel) =>
        channel.parentId === category.id &&
        channel.type === ChannelType.GuildText
    )
  );

  // Map the valid categories into an array of objects with id and name
  const categoriesArray = validCategories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  // Update or add new values to the existing data
  userExchangeData.set(message.author.id, {
    ...user_exchange_data, // Spread the existing data to keep it intact
    channelName: channelName,
    name: "custom-channel-category",
    rewardPrice: reward.price,
    tokenEmoji: tokenEmoji,
    categories: categoriesArray,
  });

  if (reward.data) {
    await message.channel.send({
      embeds: [reward],
    });
    return;
  }

  // Convert categories into a numbered list with a line break
  const categoryList = categoriesArray
    .map((category, index) => `${index + 1}. **${category.name}**`)
    .join("\n");

  const title = "Shop";
  const description =
    `Under which category would you like to add the new channel?\n` +
    `Please reply with the according number next to the already existing categories listed below.\n\n${categoryList}`;
  const embed = createEmbed(title, description, "");

  let buttonComponent = [];
  if (categoriesArray.length < 0) {
    buttonComponent = [
      {
        type: 1, // Action row type
        components: [
          {
            type: 2, // Button type
            style: 4, // Danger style
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ];
  }

  // Send the message
  await message.channel.send({
    embeds: [embed],
    components: buttonComponent,
  });

  if (categoriesArray.length < 1) {
    await handleCustomChannelCategory(message, client);
  }
}

async function handleCustomChannelCategory(message, client) {
  const messageContent = message.content;
  const user_exchange_data = userExchangeData.get(message.author.id);
  const validationError = validateNumber(
    messageContent,
    user_exchange_data.categories
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

  user_exchange_data.category =
    user_exchange_data.categories[Number(messageContent) - 1];
  delete user_exchange_data.categories;
  userExchangeData.set(message.author.id, user_exchange_data);

  // Determine if the emoji is custom or normal
  const emojiDisplay = user_exchange_data.tokenEmoji.token_emoji_id
    ? `<:${user_exchange_data.tokenEmoji.token_emoji_name}:${user_exchange_data.tokenEmoji.token_emoji_id}>`
    : user_exchange_data.tokenEmoji.token_emoji;

  let channel_name_config = "\n";
  try {
    channel_name_config = await ChannelNameConfig.findOne({
      guild_id: message.guild.id,
    });
  } catch (error) {
    logger.error(
      "Error getting Channel Name Configuration from the database",
      error
    );
    // Send a confirmation message before closing the thread
    const title = `Channel Name Configuration Error`;
    const description = `I could not find the channel name configuration in the database, please try again later or contact your administrator.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  const title = "Shop";
  const description =
    `Do you want to add this custom channel?\n` +
    `Channel name: **${user_exchange_data.channelName}**\nChannel category: **${user_exchange_data.category.name}**\n\n` +
    `This will deduct **${user_exchange_data.rewardPrice}** ${emojiDisplay} from your wallet.`;
  const embed = createEmbed(title, description, "");

  // Construct the button component
  const buttonComponent = {
    type: 2, // Button type
    style: 1, // Primary style
    label: "Exchange",
    emoji: {
      name: user_exchange_data.tokenEmoji.token_emoji_name, // Use the emoji name
      id: user_exchange_data.tokenEmoji.token_emoji_id, // Include the ID if it's a custom emoji
    },
    custom_id: `exchange-custom-channel`,
  };

  // Send the message
  await message.channel.send({
    embeds: [embed],
    components: [
      {
        type: 1, // Action row type
        components: [
          buttonComponent,
          {
            type: 2, // Button type
            style: 4, // Danger style
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
  });
}

function validateChannelName(channelName) {
  // Discord channel names can be up to 100 characters
  const maxLength = 100;

  // Regex to allow lowercase letters, numbers, hyphens, and underscores (spaces are not allowed)
  const validCharacters = /^[a-z0-9_-]+$/;

  // Check if the channel name exceeds the length limit
  if (channelName.length === 0) {
    return "Channel name cannot be empty.";
  }
  if (channelName.length > maxLength) {
    return `Channel name cannot be longer than ${maxLength} characters.`;
  }

  // Check if the channel name contains invalid characters
  if (!validCharacters.test(channelName)) {
    return "Channel name contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.";
  }

  // If all checks pass, return null (no errors)
  return null;
}

module.exports = { handleCustomChannel, handleCustomChannelCategory };
