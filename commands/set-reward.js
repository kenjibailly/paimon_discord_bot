const { InteractionResponseType } = require('discord-interactions');
const Rewards = require('../models/rewards');
const TokenEmoji = require('../models/token-emoji');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function handleSetRewardCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const rewardOption = data.options.find(opt => opt.name === 'reward');
    const priceOption = data.options.find(opt => opt.name === 'price');
    const timeOption = data.options.find(opt => opt.name === 'time');
    const enableOption = data.options.find(opt => opt.name === 'enable');

    const rewardName = rewardOption ? rewardOption.value : null;
    const price = priceOption ? priceOption.value : null;
    const time = timeOption ? timeOption.value : null;
    const enable = enableOption ? enableOption.value === 'true' : null;

    // Validate that at least one of price, time, or enable is provided
    if (!rewardName || (price === null && time === null && enable === null)) {
        const title = "Invalid Input";
        const description = "At least one of price, time, or enable must be provided.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }

    try {
        // Prepare the update object dynamically
        const update = {};
        if (price !== null) update.price = price;
        if (time !== null) update.time = time;
        if (enable !== null) update.enable = enable;

        // Update the reward in the database
        const reward = await Rewards.findOneAndUpdate(
            { guild_id: guild_id, name: rewardName },
            update,
            { new: true } // Returns the updated document
        );

        if (reward) {
            let description = `The reward **${reward.description}** has been updated.`;

            const token_emoji = await TokenEmoji.findOne({guild_id: guild_id});

            // Add only the fields that were updated to the description
            if (price !== null) description += `\nNew Price: **${price}** ${token_emoji.token_emoji}`;
            if (time !== null) description += `\nNew Reset Time: **${time} days**`;
            if (enable !== null) description += `\nStatus: **${enable ? 'Enabled' : 'Disabled'}**`;

            const title = "Reward Updated";
            const color = "";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        } else {
            // Handle the case where the reward was not found
            const title = "Reward Not Found";
            const description = `The reward **${rewardName}** was not found for this guild.`;
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }

    } catch (error) {
        console.error(consoleColors("red"), 'Error updating reward:', error);

        const title = "Error";
        const description = `An error occurred while updating the reward. Please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }
}

module.exports = handleSetRewardCommand;
