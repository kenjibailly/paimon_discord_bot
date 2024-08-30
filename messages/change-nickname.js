const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');

async function handleChangeNickname(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if(!user_exchange_data.name == "change-nickname") {
        return;
    }
    const messageContent = message.content;
    const validationError = validateNicknameAndEmoji(messageContent);

    if (validationError) {
        console.log(validationError);
        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = validationError + `
        Please try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }
    let user_text;
    if (user_exchange_data.taggedUser) {
        let guild = await client.guilds.fetch(message.guild.id);
        member = await guild.members.fetch(user_exchange_data.taggedUser);
        user_text = `**${member.user.globalName}**'s`;
    } else {
        user_text = "your";
    }
    const title = "Shop";
    const description = `
    Do you want to change ${user_text} nickname to **${messageContent}** ?
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
                        custom_id: `exchange-change-nickname:${encodedContent}`
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

async function handleChangeUserNickname(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if(!user_exchange_data.name == "change-user-nickname") {
        return;
    }
    const messageContent = message.content;
    const validationError = validateTaggedUser(messageContent);

    if (validationError) {
        console.log(validationError);
        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = validationError + `
        Please try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }


    // Extract the tagged user ID from the message content
    const taggedUser = messageContent.match(/<@(\d+)>/)[1];

    // Fetch the guild and the member associated with the tagged user
    const guild = await client.guilds.fetch(message.guild.id);
    const member = await guild.members.fetch(taggedUser);

    // Fetch the thread (assuming you're working within a thread)
    const thread = await message.channel.fetch(); // This fetches the current thread

    // Remove the tagged user from the thread if they are in it
    if (thread.isThread() && member && thread.members.cache.has(taggedUser)) { // Check if it's a thread, member exists, and is in the thread
        await thread.members.remove(taggedUser, 'Tagged user removed from the thread');
    }

    
    const title = "Shop";
    const description = `Reply with desired new nickname for **${member.user.globalName}**.`;
    const embed = createEmbed(title, description, "");
    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
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

    // Retrieve the existing data
    const existingData = userExchangeData.get(message.author.id) || {};

    // Update only the properties you want to change
    const updatedData = {
        ...existingData, // Spread the existing properties
        name: "change-nickname", // Update or add the name property
        taggedUser: taggedUser,  // Update or add the taggedUser property
    };

    // Set the updated object back into the Map
    userExchangeData.set(message.author.id, updatedData);
    // handleChangeNickname(message, client);
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
        return 'Nickname must be between 1 and 32 characters long.';
    }

    // Check for valid characters in the nickname (letters, numbers, underscores, spaces)
    const validNicknameRegex = /^[\w\s]+$/;
    if (!validNicknameRegex.test(nicknameWithoutEmoji)) {
        return 'Nickname can only contain letters, numbers, underscores, and spaces.';
    }

    // If all validations pass
    return null;
}

function validateTaggedUser(content) {
    // Define the regex pattern to match a user tag
    const userTagRegex = /<@(\d+)>/;

    // Test the content against the regex pattern
    const match = content.match(userTagRegex);

    // If there is no match, return an error message
    if (!match) {
        return "No valid user tag found in the message.";
    }

    // If there is a match, return null indicating no error
    return null;
}

module.exports = { handleChangeNickname, handleChangeUserNickname };