const createEmbed = require('../helpers/embed');


async function handleCancelThreadButton(interaction, client) {
    try {
        // Fetch the guild (server) using the guild_id from the interaction
        const guild = await client.guilds.fetch(interaction.guildId);
        
        // Fetch the thread channel using the channel_id from the interaction
        const thread = await guild.channels.fetch(interaction.channelId);

        // Send a confirmation message before closing the thread
        const title = "Exit";
        const description = `This thread will be closed shortly.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        setTimeout(async () => {
            await thread.send({ embeds: [embed] });

            const members = await thread.members.fetch(); // Get all members of the thread

            // Remove all members except the bot itself
            members.forEach(async member => {
                if (member.id !== client.user.id) { // `client.user.id` is the bot's ID
                    await thread.members.remove(member.id, 'Removing all members except the bot');
                }
            });
        }, 1000);

        setTimeout(() => {
            thread.delete();
        }, 20000);

        // Respond to the interaction to avoid the "This interaction failed" message
        try {
            await interaction.deferUpdate();
        } catch {}
    } catch (error) {
        logger.error('Failed to close the thread:', error);

        const title = "Exit";
        const description = `This thread will be closed shortly.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
}

module.exports = handleCancelThreadButton;