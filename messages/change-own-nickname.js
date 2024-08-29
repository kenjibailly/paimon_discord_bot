const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');

async function handleChangeOwnNickname(message, client) {

    const messageContent = message.content;
    const validationError = validateNicknameAndEmoji(messageContent);

    if (validationError) {
        console.log(validationError);
        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = validationError + `
        Please try again.`;
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }

    userExchangeData.delete(message.author.id);

    const title = "Shop";
    const description = `
    Do you want to change your name to **${messageContent}** ?
    This will deduct **1** 🪙 from your wallet.`;
    const embed = createEmbed(title, description, "");

    // Encode the message content to make it URL-safe
    const encodedContent = encodeURIComponent(messageContent);

    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 1,
                        label: "Exchange",
                        emoji: {
                            name: "🪙",
                        },
                        custom_id: `exchange-change-own-nickname:${encodedContent}`
                    },
                    {
                        type: 2,
                        style: 4,
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ]
            }
        ]
    });
}

function validateNicknameAndEmoji(content) {
    // Regular expression to match any emoji
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

    // Extract all emojis from the content
    const emojis = content.match(emojiRegex) || [];

    // Check if there are more than one emoji
    if (emojis.length > 1) {
        return 'Please include no more than one emoji in your message.';
    }

    // Remove the emoji from the content to validate the nickname
    const nicknameWithoutEmoji = content.replace(emojiRegex, '').trim();

    // Check the length of the nickname
    if (nicknameWithoutEmoji.length < 1 || nicknameWithoutEmoji.length > 32) {
        return 'Your nickname must be between 1 and 32 characters long.';
    }

    // Check for valid characters in the nickname (letters, numbers, underscores, spaces)
    const validNicknameRegex = /^[\w\s]+$/;
    if (!validNicknameRegex.test(nicknameWithoutEmoji)) {
        return 'Your nickname can only contain letters, numbers, underscores, and spaces.';
    }

    // If all validations pass
    return null;
}

module.exports = handleChangeOwnNickname;