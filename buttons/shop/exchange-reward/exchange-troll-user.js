const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');


async function handleExchangeTrollUserButton(interaction, client) {
    try {

        const user_exchange_data = userExchangeData.get(interaction.member.user.id);
        userExchangeData.delete(interaction.member.user.id);

        await trollUser(interaction, client, user_exchange_data);

        const guild = await client.guilds.fetch(interaction.guild_id);
        const thread = await guild.channels.fetch(interaction.channel_id);
    
        const wallet = await checkRequiredBalance(interaction, client, user_exchange_data.rewardPrice, thread);
        if(!wallet) { // if wallet has return error message
            return {
                type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
            };
        }

        
        // Check bot permissions
        const permissionCheck = await checkPermissions(interaction, client, 'MANAGE_ROLES', guild);
        if (permissionCheck) {
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [permissionCheck],
                },
            };
        }


        try {
            
            const reward = "troll-user"; // Example reward value
            const awardedReward = new AwardedReward({
                guild_id: interaction.guild_id,
                awarded_user_id: interaction.member.user.id,
                user_id: interaction.member.user.id,
                reward: reward,
                date: new Date(),
            });

            await awardedReward.save();

        } catch (error) {
            logger.error('Error adding reward to DB:', error);

            let title = "Reward Database Error";
            let description = `I could not add the reward to the database. Please contact the administrator.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        try {
            // Deduct from the wallet
            wallet.amount -= Number(user_exchange_data.rewardPrice);
            await wallet.save();
        } catch (error) {
            logger.error("Failed to save wallet:", error);
            
            const title = "Transaction Error";
            const description = "There was an error while processing your wallet transaction. Please try again later.";
            const color = "error"; // Assuming you have a color constant for errors
            const embed = createEmbed(title, description, color);
            
            handleCancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            }
        }

        try {

            try {
                // troll user code here

                const title = "You trolled someone!";
                const description = `You have successfully trolled <@${user_exchange_data.taggedUser}>!
                You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.`;
                const color = "";
                const embed = createEmbed(title, description, color);

                // Send success message before canceling the thread message
                await thread.send({ embeds: [embed] });

                handleCancelThread(interaction, client);

                // Send message to the parent channel if available
                const parentChannel = thread.parent;
                if (parentChannel) {
                    const parentTitle = "Shop";
                    const parentDescription = `<@${interaction.member.user.id}> has trolled <@${user_exchange_data.taggedUser}>!`;
                    const parentEmbed = createEmbed(parentTitle, parentDescription, "");
                    
                    await parentChannel.send({
                        embeds: [parentEmbed],
                    });
                }

                return {
                    type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
                };
                
            } catch (error) {
                logger.error("Error trolling user:", error);
                
                const title = "Troll someone has failled";
                const description = `There was an issue trolling someone. Please try again later.`;
                const color = "error";
                const embed = createEmbed(title, description, color);

                handleCancelThread(interaction, client);

                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        embeds: [embed],
                    },
                };
            }

        } catch (error) {
            logger.error("Error trolling user:", error);
            
            const title = "Troll someone has failled";
            const description = `There was an issue trolling someone. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            handleCancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

    } catch (error) {
        logger.error("Error trolling user:", error);
            
        let title = "Troll someone has failled";
        let description = `There was an issue trolling someone. Please try again later.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom soundboard sound.
            Your wallet has not been affected.`;
        }

        const color = "error";
        const embed = createEmbed(title, description, color);

        handleCancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }

}

async function trollUser (interaction, client, user_exchange_data) {
    try {
        
    } catch (error) {
        logger.error("Error trolling user:", error);
    }
}

module.exports = handleExchangeTrollUserButton;