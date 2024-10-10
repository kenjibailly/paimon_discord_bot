const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const validateNumber = require('../helpers/validate-number');
const cancelThread = require('../helpers/cancel-thread');
const getTokenEmoji = require('../helpers/get-token-emoji');
const getReward = require('../helpers/get-reward');

async function handleChooseGame(message, client) {
    const messageContent = message.content;
    const user_exchange_data = userExchangeData.get(message.author.id);
    const validationError = validateNumber(messageContent, user_exchange_data.games);

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

    try {

        // Fetch token emoji using the getTokenEmoji function
        const tokenEmoji = await getTokenEmoji(message.guild.id);
        // Validation when tokenEmoji isn't set
        if (tokenEmoji.data) {
            await message.channel.send({
                embeds: [tokenEmoji],
            });
            return;
        }

        const reward = await getReward(message.guild.id, user_exchange_data.name);

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
        const description = `Do you want to choose this next game to play?\n\n` +
        `- **${game.name}**\n` + 
        (game.description ? `  ${game.description}\n\n` : "  No description available.\n\n") + 
        `This will deduct **${reward.price}** ${emojiDisplay} from your wallet.`;    
        const embed = createEmbed(title, description, "");

        // Update or add new values to the existing data
        userExchangeData.set(message.author.id, {
            ...user_exchange_data,
            rewardPrice: reward.price ,
            tokenEmoji: tokenEmoji,
            game: game,
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
            custom_id: `exchange-choose-game`
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

    } catch (error) {
        logger.error("Error Adding Next Game:", error);
        const title = "Error Choosing Next Game";
        const description = `Something went wrong, please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        // Send a confirmation message before closing the thread
        await message.channel.send({
            embeds: [embed],
        });

        cancelThread(message.guildId, message.channelId, client);
    }

}

module.exports = handleChooseGame;