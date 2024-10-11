const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');


async function handleExchangeCustomChannelButton(interaction, client) {
    try {

        const user_exchange_data = userExchangeData.get(interaction.member.user.id);
        userExchangeData.delete(interaction.member.user.id);

        const guild = await client.guilds.fetch(interaction.guildId);
        const thread = await guild.channels.fetch(interaction.channelId);
    
        const wallet = await checkRequiredBalance(interaction, client, user_exchange_data.rewardPrice, thread);
        if(!wallet) { // if wallet has return error message
            await interaction.deferUpdate();
        }

        
        // Check bot permissions
        const permissionCheck = await checkPermissions(interaction, client, 'MANAGE_CHANNELS', guild);
        if (permissionCheck) {
            await interaction.editReply({ embeds: [permissionCheck] });
            handleCancelThread(interaction, client);
            return;
        }


        // Check if bot can manage channels under the chosen category
        const category = guild.channels.cache.get(user_exchange_data.category.id);
        if (category) {
            const botMember = guild.members.cache.get(client.user.id);
            const hasPermissionInCategory = category.permissionsFor(botMember).has('MANAGE_CHANNELS');

            if (!hasPermissionInCategory) {
                let title = "Permission Error";
                let description = `The bot does not have permission to manage channels in the selected category.`;
                const color = "error";
                const embed = createEmbed(title, description, color);

                await interaction.editReply({
                    embeds: [embed],
                    components: []  // Ensure this is an empty array
                });                
                return;
            }
        }



        try {
            
            const reward = "custom-channel"; // Example reward value
            const awardedReward = new AwardedReward({
                guild_id: interaction.guildId,
                awarded_user_id: interaction.member.user.id,
                user_id: interaction.member.user.id,
                value: user_exchange_data.channelName,
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

            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            return;
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
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
            return;
        }

        try {

            try {
                // Create the channel in the guild
                const createdChannel = await guild.channels.create({
                    name: user_exchange_data.channelName,
                    type: 0, // 0 for a text channel
                    parent: user_exchange_data.category.id, // Assign category if it exists, otherwise null
                });

                const title = "Channel Added";
                const description = `The channel <#${createdChannel.id}> has been successfully added to the server!\n` +
                `You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.`;
                const color = "";
                const embed = createEmbed(title, description, color);

                // Send success message before canceling the thread message
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });

                handleCancelThread(interaction, client);

                // Send message to the parent channel if available
                const parentChannel = thread.parent;
                if (parentChannel) {
                    const parentTitle = "Shop";
                    const parentDescription = `<@${interaction.member.user.id}> has added channel: <#${createdChannel.id}> to the server.`;
                    const parentEmbed = createEmbed(parentTitle, parentDescription, "");
                    
                    await parentChannel.send({
                        embeds: [parentEmbed],
                    });
                }
                
            } catch (error) {
                logger.error("Error creating channel:", error);
                
                const title = "Creating Channel Failed";
                const description = `There was an issue adding the channel to the server. Please try again later.`;
                const color = "error";
                const embed = createEmbed(title, description, color);
                await interaction.editReply({
                    embeds: [embed],
                    components: []  // Ensure this is an empty array
                });                
                handleCancelThread(interaction, client);
            }

        } catch (error) {
            logger.error("Channel Creation Error: ", error);
            
            const title = "Channel Creation Failed";
            const description = `There was an issue adding the channel to the server. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
        }

    } catch (error) {
        logger.error('Error adding custom channel:', error);

        let title = "Add Custom Channel Error";
        let description = `I could not add a custom channel. Your wallet has not been affected.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom channel.\n` +
            `Your wallet has not been affected.`;
        }

        const color = "error";
        const embed = createEmbed(title, description, color);
        await interaction.editReply({
            embeds: [embed],
            components: []  // Ensure this is an empty array
        });
        
        handleCancelThread(interaction, client);
    }

}

module.exports = handleExchangeCustomChannelButton;