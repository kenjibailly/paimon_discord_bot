const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');
const Rewards = require('../models/rewards');


async function handleShopCommand(interaction, client) {
    let tokenEmoji;
    const rewards_list = [];
    try {

        // Fetch the token emoji
        tokenEmoji = await getTokenEmoji(interaction.guild.id);

        // Check if we got an embed back instead of token emoji data
        if (tokenEmoji && tokenEmoji.type === 'error') {
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [tokenEmoji], // Return the error embed
                }
            };
        }

        const rewards = await Rewards.find();
        rewards.forEach((reward) => {
            // Create a field for each reward
            if (reward.enable === true) {
                // Build the reward time string conditionally
                const rewardTime = reward.time ? ` (${reward.time} days)` : '';

                // Add the reward to the list
                rewards_list.push({
                    name: `**${reward.price}** ${tokenEmoji.token_emoji} - ${reward.short_description}${rewardTime}`,
                    value: reward.long_description ? reward.long_description : " ",
                    inline: false // You can set this to `true` to display fields inline
                });
            }
        });
    } catch (error) {
        logger.error("Rewards Error:", error);
        const title = "Error Rewards";
        const description = `I could not find the rewards in the database. Pleae contact the administrator.`;
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
    const title = "Shop";
    const description = `Exchange your ${tokenEmoji.token_emoji} for the following rewards:\n\u200B\n`;
    const embed = createEmbed(title, description, "");
    embed.addFields(rewards_list); // Add the fields to the embed

    try {

        const buttonComponent = {
            type: 2, // Button type
            style: 1, // Primary style
            label: "Exchange",
            emoji: {
                name: tokenEmoji.token_emoji_name, // Use the name
                id: tokenEmoji.token_emoji_id || undefined, // Use the ID if available
            },
            custom_id: `exchange-shop`
        };
        

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                components: [
                    {
                        type: 1, // Action row type
                        components: [buttonComponent] // Add the button component
                    }
                ]
            }
        };

    } catch (error) {
        logger.error('Error handling shop command:', error);

        const errorTitle = "Error";
        const errorDescription = "An error occurred while processing the shop command. Please try again later.";
        const errorColor = "error";
        const errorEmbed = createEmbed(errorTitle, errorDescription, errorColor);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [errorEmbed]
            }
        };
    }
}

module.exports = handleShopCommand;