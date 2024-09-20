const { InteractionResponseType } = require('discord-interactions');
const Rewards = require('../models/rewards');
const TokenEmoji = require('../models/token-emoji');
const createEmbed = require('../helpers/embed');


async function handleSetAllRewardsCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Ensure data.options is defined
    const options = data.options || [];

    // Find each option by name
    const priceOption = options.find(opt => opt.name === 'price');
    const timeOption = options.find(opt => opt.name === 'time');

    const price = priceOption ? priceOption.value : null;
    const time = timeOption ? timeOption.value : null;

    // Validate that at least one of price or time is provided
    if (price === null && time === null) {
        const title = "Invalid Input";
        const description = "Either price or time must be provided.";
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

        // Update all rewards in the guild
        const result = await Rewards.updateMany(
            { guild_id: guild_id },
            update
        );

        const title = "Rewards Updated";
        const descriptionParts = [];

        const token_emoji = await TokenEmoji.findOne({guild_id: guild_id});
        
        if (price !== null) descriptionParts.push(`Price updated to **${price}** ${token_emoji.token_emoji}`);
        if (time !== null) descriptionParts.push(`Reset time updated to **${time} days**`);
        
        const description = descriptionParts.length > 0 
            ? `All rewards on the server have been updated:\n${descriptionParts.join('\n')}`
            : `No updates were made.`;

        const color = "";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };

    } catch (error) {
        logger.error('Error updating rewards:', error);

        const title = "Error";
        const description = `An error occurred while updating the rewards. Please try again later.`;
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

module.exports = handleSetAllRewardsCommand;