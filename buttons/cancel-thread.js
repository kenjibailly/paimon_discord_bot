const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');

async function handleCancelThread(interaction, client) {
    try {
        // Fetch the guild (server) using the guild_id from the interaction
        const guild = await client.guilds.fetch(interaction.guild_id);
        
        // Fetch the thread channel using the channel_id from the interaction
        const thread = await guild.channels.fetch(interaction.channel_id);

        // Send a confirmation message before closing the thread
        const title = "Shop";
        const description = `This thread will be closed shortly.`;
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);
        await thread.send({ embeds: [embed] });

        // Remove the user from the thread
        await thread.members.remove(interaction.member.user.id, 'User requested to close the thread');

        setTimeout(() => {
            thread.delete();
        }, 10000);

        console.log(`Thread ${thread.name} has been deleted and user removed by ${interaction.member.user.global_name}`);

        // Respond to the interaction to avoid the "This interaction failed" message
        return {
            type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
        };
    } catch (error) {
        console.error('Failed to close the thread:', error);

        // In case of failure, send an error message as a response
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Failed to close the thread. Please try again.',
                flags: 64,
            },
        };
    }
}

module.exports = handleCancelThread;