const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');


async function handleExchangeCustomRoleButton(interaction, client) {
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
        const permissionCheck = await checkPermissions(interaction, client, 'MANAGE_ROLES', guild);
        if (permissionCheck) {
            await interaction.editReply({ embeds: [permissionCheck] });
            handleCancelThread(interaction, client);
            return;
        }



        try {
            const reward = "custom-role"; // Example reward value

            const awardedReward = new AwardedReward({
                guild_id: interaction.guildId,
                awarded_user_id: interaction.member.user.id,
                user_id: interaction.member.user.id,
                value: user_exchange_data.roleName,
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
            // Create the role and store it in 'newRole'
            const newRole = await guild.roles.create({
                name: user_exchange_data.roleName,
                color: user_exchange_data.roleColor,
                reason: `Claimed shop reward from user: ${interaction.member.user.id}`,
                hoist: true // This will make the role appear separately in the member list
            });

            // Get the list of roles in the guild
            const roles = guild.roles.cache;

            // Set the new role's position to be above the existing highest role
            const highestRole = roles.sort((a, b) => b.position - a.position).first();
            if (highestRole) {
                await newRole.setPosition(highestRole.rawPosition);
            }

            // Assign the role to the user
            const member = await guild.members.fetch(interaction.member.user.id);
            await member.roles.add(newRole.id);

            if (newRole) {
                // Send a success message once the emoji is added
                const title = "Role Added";
                const description = `You have successfully created the new role: <@&${newRole.id}> and it has been granted to you!\n` +
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
                    const parentDescription = `<@${interaction.member.user.id}> has claimed a new role: <@&${newRole.id}>.`;
                    const parentEmbed = createEmbed(parentTitle, parentDescription, "");
                    
                    await parentChannel.send({
                        embeds: [parentEmbed],
                    });
                }
            
            } else {
                throw new Error("Error wile creating the role");
            }

        } catch (error) {
            logger.error("Role Creation Error: ", error);
            
            const title = "Role Creation Failed";
            const description = `There was an issue creating the role. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
        }

    } catch (error) {
        logger.error('Error adding custom server emoji:', error);

        let title = "Add Custom Server Emoji Error";
        let description = `I could not add a custom server emoji. Your wallet has not been affected.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom server emoji.\n` +
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

module.exports = handleExchangeCustomRoleButton;