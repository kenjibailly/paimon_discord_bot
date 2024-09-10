const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');

async function handleManageGamesCommand(interaction, client) {
    const { guild_id, channel_id } = interaction;

    const guild = await client.guilds.fetch(guild_id);
    const channel = await guild.channels.fetch(channel_id);

    // Create a private thread that is only visible to the user who clicked the button
    const thread = await channel.threads.create({
        name: `Manage Games - ${interaction.member.user.global_name}`, // Ensure you use the correct user property
        autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
        reason: 'User initiated manage games interaction',
        invitable: false, // Don't allow other users to join the thread
        type: 12, // Private Thread (only visible to members who are added)
    });

    // Add the user who clicked the button to the thread
    await thread.members.add(interaction.member.user.id);

    // Post the message in the thread
    let title = "Manage Games";
    let description = `Do you want to create, update or remove a game?`;
    let embed = createEmbed(title, description, "");

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
                        label: "Update",
                        emoji: { name: "🖊️" }, // Pencil emoji for updating
                        custom_id: "update-game"
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger style (for removing a game)
                        label: "Remove",
                        emoji: { name: "🗑️" }, // Trash bin emoji for removing
                        custom_id: "remove-game"
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
    


    title = "Manage Games";
    description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
    embed = createEmbed(title, description, "");
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            flags: 64,
        },
    };
}

module.exports = handleManageGamesCommand;