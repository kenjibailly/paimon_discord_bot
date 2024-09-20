const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const getTokenEmoji = require('../helpers/get-token-emoji');
const getReward = require('../helpers/get-reward');
const consoleColors = require('../helpers/console-colors');

async function handleChangeNickname(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "change-own-nickname") {
        return;
    }

    const messageContent = message.content;
    const validationError = validateNicknameAndEmoji(messageContent);

    if (validationError) {
        console.error(consoleColors("red"), "Validation Error:", validationError);
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

    let user_text;
    if (user_exchange_data.taggedUser) {
        let guild = await client.guilds.fetch(message.guild.id);
        let member = await guild.members.fetch(user_exchange_data.taggedUser);
        user_text = `**${member.user.globalName}**'s`;
    } else {
        user_text = "your";
    }

    // Fetch token emoji using the getTokenEmoji function
    const tokenEmoji = await getTokenEmoji(message.guild.id);
    // Validation when tokenEmoji isn't set
    if (tokenEmoji.data) {
        await message.channel.send({
            embeds: [tokenEmoji],
        });
        return;
    }

    let rewardName;
    if(user_exchange_data.taggedUser) {
        rewardName = "change-user-nickname";
    } else {
        rewardName = user_exchange_data.name;
    }

    // Fetch token emoji using the getTokenEmoji function
    const reward = await getReward(message.guild.id, rewardName);
    // Validation when tokenEmoji isn't set
    if (reward.data) {
        await message.channel.send({
            embeds: [reward],
        });
        return;
    }
    
    // Determine if the emoji is custom or normal
    const emojiDisplay = tokenEmoji.token_emoji_id 
        ? `<:${tokenEmoji.token_emoji_name}:${tokenEmoji.token_emoji_id}>` 
        : tokenEmoji.token_emoji;

    const title = "Shop";
    const description = `
    Do you want to change ${user_text} nickname to **${messageContent}**?
    This will deduct **${reward.price}** ${emojiDisplay} from your wallet.`;
    const embed = createEmbed(title, description, "");

    // Update or add new values to the existing data
    userExchangeData.set(message.author.id, {
        ...user_exchange_data, // Spread the existing data to keep it intact
        nickname: messageContent,
        rewardPrice: reward.price ,
        tokenEmoji: tokenEmoji,
    });

    
    // Construct the button component
    const buttonComponent = {
        type: 2, // Button type
        style: 1, // Primary style
        label: "Exchange",
        emoji: {
            name: tokenEmoji.token_emoji_name, // Use the emoji name
            id: tokenEmoji.token_emoji_id // Include the ID if it's a custom emoji
        },
        custom_id: `exchange-change-nickname`
    };

    // Send the message
    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action row type
                components: [buttonComponent, {
                    type: 2, // Button type
                    style: 4, // Danger style
                    label: "Cancel",
                    custom_id: "cancel-thread"
                }]
            }
        ]
    });
}

async function handleChangeUserNickname(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "change-user-nickname") {
        return;
    }

    const messageContent = message.content;
    const validationError = validateTaggedUser(messageContent);

    if (validationError) {
        console.error(consoleColors("red"), "Validation Error:", validationError);
        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = `${validationError}\nPlease try again.`;
        const color = "#ff0000"; // Changed to hex code for red
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
        name: "change-own-nickname", // Update or add the name property
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
