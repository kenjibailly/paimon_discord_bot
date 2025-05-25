const createEmbed = require("../helpers/embed");
const userExchangeData = require("../helpers/userExchangeData");
const getWalletConfig = require("../helpers/get-wallet-config");
const getReward = require("../helpers/get-reward");

async function handleCustomRole(message, client) {
  const messageContent = message.content;
  const user_exchange_data = userExchangeData.get(message.author.id);

  const contentValidationError = validateRoleName(messageContent);
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
  const roleName = messageContent;
  const existingRoles = guild.roles.cache;
  // Check if a role with the given name already exists
  const roleExists = existingRoles.some((role) => role.name === roleName);

  if (roleExists) {
    const title = "Role Name Taken";
    const description = `A role with the name "${roleName}" already exists. Please choose a different name.`;
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

  // Update or add new values to the existing data
  userExchangeData.set(message.author.id, {
    ...user_exchange_data, // Spread the existing data to keep it intact
    roleName: roleName,
    name: "custom-role-color",
    rewardPrice: reward.price,
    tokenEmoji: tokenEmoji,
  });

  if (reward.data) {
    await message.channel.send({
      embeds: [reward],
    });
    return;
  }

  const title = "Shop";
  const description = `Please reply with the hex color code for your new role.\nYou can pick a color [here](https://www.fffuel.co/cccolor/), please copy the one with the hashtag in front.\nExample: \`#9000FF\``;
  const embed = createEmbed(title, description, "");

  // Send the message
  await message.channel.send({
    embeds: [embed],
    components: [
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
    ],
  });
}

async function handleCustomRoleColor(message, client) {
  const messageContent = message.content;
  const user_exchange_data = userExchangeData.get(message.author.id);

  const contentValidationError = validateColor(messageContent);
  if (contentValidationError) {
    // Handle message content validation error
    logger.error("Validation Error", contentValidationError);
    const title = "Shop";
    const description = `${contentValidationError}\nPlease try again.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  user_exchange_data.roleColor = messageContent;
  userExchangeData.set(message.author.id, user_exchange_data);

  // Determine if the emoji is custom or normal
  const emojiDisplay = user_exchange_data.tokenEmoji.token_emoji_id
    ? `<:${user_exchange_data.tokenEmoji.token_emoji_name}:${user_exchange_data.tokenEmoji.token_emoji_id}>`
    : user_exchange_data.tokenEmoji.token_emoji;

  const title = "Shop";
  const description =
    `Do you want to add this custom role and be assigned to it?\n\n` +
    `Role name: **${user_exchange_data.roleName}**\n` +
    `Role color: **${user_exchange_data.roleColor}**\n\n` +
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
    custom_id: `exchange-custom-role`,
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

function validateRoleName(roleName) {
  // Discord role names can be up to 100 characters
  const maxLength = 100;

  // Regex to allow letters, numbers, spaces, hyphens, and underscores
  const validCharacters = /^[a-zA-Z0-9 _-]+$/;

  // Check if the role name exceeds the length limit
  if (roleName.length === 0) {
    return "Role name cannot be empty.";
  }
  if (roleName.length > maxLength) {
    return `Role name cannot be longer than ${maxLength} characters.`;
  }

  // Check if the role name contains invalid characters
  if (!validCharacters.test(roleName)) {
    return "Role name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed.";
  }

  // If all checks pass, return null (no errors)
  return null;
}

function validateColor(color) {
  // Regular expression to match a valid hex color code
  const hexColorRegex = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;

  // Check if the provided color matches the regex
  if (!hexColorRegex.test(color)) {
    return "Invalid color format. Please provide a valid hex color code.";
  }

  return null; // No error
}

module.exports = { handleCustomRole, handleCustomRoleColor };
