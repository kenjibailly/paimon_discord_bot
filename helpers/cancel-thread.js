const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function handleCancelThread(guild_id, channel_id, client) {
    // Fetch the guild (server) using the guild_id from the interaction
    const guild = await client.guilds.fetch(guild_id);

    // Fetch the thread channel using the channel_id from the interaction
    const thread = await guild.channels.fetch(channel_id);

    try {

        // Send a confirmation message before closing the thread
        const title = "Exit";
        const description = `This thread will be closed shortly.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        await thread.send({ embeds: [embed] });

        const members = await thread.members.fetch(); // Get all members of the thread

        // Remove all members except the bot itself
        members.forEach(async member => {
            if (member.id !== client.user.id) { // `client.user.id` is the bot's ID
                await thread.members.remove(member.id, 'Removing all members except the bot');
            }
        });

        setTimeout(() => {
            thread.delete();
        }, 5000);

    } catch (error) {
        console.error(consoleColors("red"), 'Failed to close the thread:', error);
        const title = "Error Thread";
        const description = `Failed to close the thread. Please close the thread manually.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        await thread.send({ embeds: [embed] });
    }
}

module.exports = handleCancelThread;