const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const TrollMissions = require('../../../models/troll-missions');
const TrolledUser = require('../../../models/trolled-users');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');
const trolledUserCache = require('../../../helpers/trolled-user-cache');
const { PermissionsBitField, ChannelType, AttachmentBuilder, ButtonComponent } = require('discord.js');
const path = require('path');


async function handleExchangeTrollUserButton(interaction, client) {
    try {

        const user_exchange_data = userExchangeData.get(interaction.member.user.id);

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
            
            const reward = "troll-user"; // Example reward value
            const awardedReward = new AwardedReward({
                guild_id: interaction.guildId,
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

            await interaction.editReply({
                embeds: [embed],
                components: []
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
                components: []
            });
            handleCancelThread(interaction, client);
            return;
        }

            
        try {
            const trolledUser = await trollUser(interaction, client, user_exchange_data);
            // If successful, you can handle success logic here
        } catch (error) {
            const title = "Troll someone has failed";
            const description = error.message;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []
            });
            handleCancelThread(interaction, client);        
            return;
        }

        try {
            // troll user code here

            const title = "You trolled someone!";
            const description = `You have successfully trolled <@${user_exchange_data.taggedUser}>!\n` +
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
                const parentDescription = `<@${interaction.member.user.id}> has trolled <@${user_exchange_data.taggedUser}>!`;
                const parentEmbed = createEmbed(parentTitle, parentDescription, "");
                
                await parentChannel.send({
                    embeds: [parentEmbed],
                });
            }
            
        } catch (error) {
            logger.error("Error trolling user:", error);
            
            const title = "Troll someone has failled";
            const description = `There was an issue trolling someone. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []
            });
            handleCancelThread(interaction, client);
        }

    } catch (error) {
        logger.error("Error trolling user:", error);
            
        let title = "Troll someone has failled";
        let description = `There was an issue trolling someone. Please try again later.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom soundboard sound.\n` +
            `Your wallet has not been affected.`;
        }

        const color = "error";
        const embed = createEmbed(title, description, color);
        await interaction.editReply({
                embeds: [embed],
                components: []
            });
        handleCancelThread(interaction, client);
    }

}

async function trollUser(interaction, client, user_exchange_data) {
    try {
        const guild = await client.guilds.fetch(interaction.guildId);
        const taggedUser = await guild.members.fetch(user_exchange_data.taggedUser);
        const guild_id = interaction.guildId;

        // Get all the role IDs except the @everyone role
        const user_roles = taggedUser.roles.cache
        .filter(role => role.id !== guild.id) // Exclude the @everyone role
        .map(role => role.id);

        // 1. Check if the "Trolled" role exists, if not, create it
        let trolledRole = guild.roles.cache.find(role => role.name === "Trolled");
        if (!trolledRole) {
            trolledRole = await guild.roles.create({
                name: "Trolled",
                color: "#FF0000",
                reason: "User got trolled",
                hoist: true, // Appear separately in the member list
                permissions: [
                    PermissionsBitField.Flags.SendMessages, // Allow sending messages
                    PermissionsBitField.Flags.AttachFiles,  // Allow uploading images
                ],
                deny: [
                    PermissionsBitField.Flags.CreateInvite, 
                    PermissionsBitField.Flags.ChangeNickname,
                    PermissionsBitField.Flags.CreatePublicThreads,
                    PermissionsBitField.Flags.CreatePrivateThreads,
                    PermissionsBitField.Flags.MentionEveryone,
                    PermissionsBitField.Flags.UseApplicationCommands, // Creating polls/events is a command
                    PermissionsBitField.Flags.CreateEvents,
                ],
            });
        }

        // Use the fetched taggedUser's info to get the nickname, global name, or username
        const displayName = taggedUser.nickname || taggedUser.user.globalName || taggedUser.user.username;


        // 2. Create a new channel named "Trolled - <username>"
        const trolledChannel = await guild.channels.create({
            name: `Trolled - ${displayName}`,
            type: ChannelType.GuildText, 
            permissionOverwrites: [
                {
                    id: guild.roles.everyone, // Deny access to everyone else
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: taggedUser.id, // Allow access to the trolled user
                    allow: [
                        PermissionsBitField.Flags.ViewChannel, 
                        PermissionsBitField.Flags.SendMessages, 
                        PermissionsBitField.Flags.AttachFiles, // Allow uploading images
                        PermissionsBitField.Flags.ReadMessageHistory
                    ],
                },
            ],
        });

        // 3. Add the "Trolled" role to the user and remove all roles
        await taggedUser.roles.remove(user_roles);
        await taggedUser.roles.add(trolledRole);

        // 4. Set permissions for the "Trolled" role in all other channels
        guild.channels.cache.forEach(channel => {
            if (channel.id !== trolledChannel.id) {
                if (channel.permissionOverwrites && channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageChannels)) {
                    // Ensure the bot has the "Manage Channels" permission
                    channel.permissionOverwrites.edit(trolledRole.id, {
                        [PermissionsBitField.Flags.ViewChannel]: false
                    }).catch(error => {
                        logger.error(`Failed to update permissions for channel ${channel.name}`, error);
                    });
                } else {
                    // Handle channels where permission overwrites are missing or bot lacks permission
                    logger.warn(`No permission overwrites found or insufficient permissions for channel: ${channel.name}`);
                }
            }
        });        

        // 5. Fetch and format troll missions
        const troll_missions = await TrollMissions.find({ guild_id: guild_id });

        if (troll_missions.length === 0) {
            const title = "Troll Missions";
            const description = `I couldn't find any troll missions.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await trolledChannel.send({ embeds: [embed] });
        } else {

            const troll_missions_list = [];
            troll_missions.forEach((troll_mission, index) => {
                const missionNumber = index + 1; // +1 to start counting from 1
                // Create a field for each troll_mission
                troll_missions_list.push({
                    name: `${missionNumber}. ${troll_mission.name}`,
                    value: troll_mission.description ? troll_mission.description : "No description available",
                    inline: false // You can set this to `true` to display fields inline
                });
            });
            
            const title = "You got trolled!";
            const nickname = interaction.member.nick || interaction.member.user.globalName || interaction.member.user.username;
            const description = `Oh no, you have been trolled by **${nickname}**!.\n\n` + 
            `You now have to complete one of these missions listed below to get back access to the server.\n` +
            `Please reply with the number next to the the mission you want to complete.\n` +
            `The staff will then accept your completion when satisfied and get you back access to the server, your completion entry will be shared with the rest of the server.\n` +
            `\nThese are all the troll missions:\n\u200B\n`;
            const embed = createEmbed(title, description, "");
            embed.addFields(troll_missions_list);


            // 6. Send the missions embed to the newly created channel
            // Construct the absolute path using __dirname
            const filePath = path.join(__dirname, '../../../media/rick-roll.webp');

            // Upload the local GIF file as an attachment
            const attachment = new AttachmentBuilder(filePath, { name: 'rick-roll.webp' });

            // Add the GIF to the embed using the attachment's URL
            embed.setImage('attachment://rick-roll.webp');

            // Send the embed along with the attachment
            await trolledChannel.send({ embeds: [embed], files: [attachment] });

            try {
                const newTrolledUser = new TrolledUser({
                    guild_id: guild_id,
                    user_id: user_exchange_data.taggedUser,
                    channel_id: trolledChannel.id,
                    previous_roles: user_roles,
                });
                
                await newTrolledUser.save();
            } catch (error) {
                logger.error("New Trolled User Error", error);
                throw new Error("Failed to save trolled someone to the database, could it be that this person is already being trolled?");
            }

            // Update or add new values to the existing data
            userExchangeData.delete(interaction.member.user.id);

            // Refresh the cache immediately
            await trolledUserCache.refresh();
        }

    } catch (error) {
        logger.error('Failed to troll user', error);
        
        // Optionally, you can check if the error message matches a specific string
        const errorMessage = error.message.includes("Failed to save")
            ? error.message
            : "Failed to troll user, please try again later.";
    
        throw new Error(errorMessage);
    }
}


module.exports = handleExchangeTrollUserButton;