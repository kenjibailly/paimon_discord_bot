const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('../helpers/cancel-thread');
const getReward = require('../helpers/get-reward');
const getTokenEmoji = require('../helpers/get-token-emoji');
const validateTaggedUser = require('../helpers/validate-tagged-user');


async function handleTrollUser(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    const messageContent = message.content;
    const validationError = validateTaggedUser(messageContent);

    if (validationError) {
        logger.error("Validation Error:", validationError);
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

    // Fetch token emoji using the getTokenEmoji function
    const tokenEmoji = await getTokenEmoji(message.guild.id);
    // Validation when tokenEmoji isn't set
    if (tokenEmoji.data) {
        await message.channel.send({
            embeds: [tokenEmoji],
        });
        return;
    }

    // Fetch token emoji using the getTokenEmoji function
    const reward = await getReward(message.guild.id, user_exchange_data.name);
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
    const description = `Do you want to troll <@${taggedUser}> ?\n` +
    `This will deduct **${reward.price}** ${emojiDisplay} from your wallet.`;
    const embed = createEmbed(title, description, "");

    // Update or add new values to the existing data
    userExchangeData.set(message.author.id, {
        ...user_exchange_data, // Spread the existing data to keep it intact
        taggedUser: taggedUser,
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
        custom_id: `exchange-troll-user`
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

module.exports = handleTrollUser;