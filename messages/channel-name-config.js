const createEmbed = require('../helpers/embed');
const ChannelNameConfig = require('../models/channel-name-config');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('../helpers/cancel-thread');


async function handleChannelNameConfiguration (message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    const messageContent = message.content;
    const validationError = validateSeparator(messageContent);

    if (validationError) {
        logger.error("Validation Error", validationError);
        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = `${validationError}\nPlease try again.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }

    try {
        await ChannelNameConfig.findOneAndUpdate(
            { guild_id: message.guildId},
            { 
                emoji: user_exchange_data.emoji,
                separator: messageContent,
            }
        );

        let example;
        if (user_exchange_data.emoji) {
            example = `#💡${messageContent}info`;
        } else {
            example = `#${messageContent}info`;
        }

        const title = "Channel Name Configuration";
        const description = `You have successfully set your channel name configuration to:\n- Emoji: ${user_exchange_data.emoji}\n- Separator: ${messageContent}\n\nExample:\n\`\`\`\n${example}\n\`\`\``;
        const color = "";
        const embed = createEmbed(title, description, color);

        // Send the message
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);

    } catch (error) {
        logger.error("Channel Name Configuration Error:", error);
        const title = "Channel Name Configuration Error";
        const description = `I could not save the configuration to the database, please try again later or contact the administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        // Send the message
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
    }

}

function validateSeparator(separator) {
    // Maximum length for the separator symbol (if any specific limit is required)
    const maxLength = 10;

    // Regex to allow a wide range of characters
    const validCharacters = /^[\s\S]*$/; // Allow all characters, including symbols

    // Check if the separator symbol length is within the acceptable range
    if (separator.length === 0) {
        return "Separator cannot be empty.";
    }
    if (separator.length > maxLength) {
        return `Separator is too long. It should be under ${maxLength} characters.`;
    }

    // Check if the separator symbol contains valid characters
    if (!validCharacters.test(separator)) {
        return "Separator contains invalid characters.";
    }

    // If all checks pass, return null (no errors)
    return null;
}

module.exports = handleChannelNameConfiguration;