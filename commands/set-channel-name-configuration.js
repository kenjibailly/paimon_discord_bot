const { InteractionResponseType } = require('discord-interactions');
const ChannelNameConfig = require('../models/channel-name-config');
const createEmbed = require('../helpers/embed');


async function handleSetChannelNameConfigurationCommand (interaction, client) {
    const { data, guild_id, channel_id } = interaction;

    try {

        const guild = await client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(channel_id);

        // Create a private thread that is only visible to the user who clicked the button
        const thread = await channel.threads.create({
            name: `Channel Name Configuration - ${interaction.member.user.global_name}`, // Ensure you use the correct user property
            autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
            reason: 'User initiated channel name configuration interaction',
            invitable: false, // Don't allow other users to join the thread
            type: 12, // Private Thread (only visible to members who are added)
        });

        // Add the user who clicked the button to the thread
        await thread.members.add(interaction.member.user.id);
        
        const channel_name_config = await ChannelNameConfig.find({ guild_id: guild_id });

        let title = "Channel Name Configuration";
        let description = `Your current configuration is set to: 
        - Emoji: ${channel_name_config.emoji ? 'Yes' : 'No'}\n- Separator: ${channel_name_config.separator || 'None'}
        \n\nDo your channels start with an emoji?`;
        let color = "";
        let embed = createEmbed(title, description, color);

       // Send the message to the thread
        const message = await thread.send({
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 1, // Primary style (for updating a game)
                            label: "Yes",
                            emoji: { name: "✅" },
                            custom_id: "channel-name-config-emoji-yes"
                        },
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a game)
                            label: "No",
                            emoji: { name: "🫸" },
                            custom_id: "channel-name-config-emoji-no"
                        },
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a game)
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ],
                },
            ],
        });

        title = "Channel Name Configuration";
        description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
        embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };

    } catch (error) {
        logger.error('Error handling Set Channel Name Configuration command:', error);

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

module.exports = handleSetChannelNameConfigurationCommand;