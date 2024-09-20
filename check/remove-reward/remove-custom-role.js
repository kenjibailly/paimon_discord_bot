const createEmbed = require('../../helpers/embed');
const getBotChannel = require('../../helpers/get-bot-channel');
const consoleColors = require('../../helpers/console-colors');

async function removeCustomRole(client, reward) {
    try {
        const guild = await client.guilds.fetch(reward.guild_id);
        
        const roleName = reward.value;

        const role = guild.roles.cache.find(e => e.name === roleName);

        if (!role) {
            console.error(consoleColors("red"), "Role not found to remove with name:", roleName);
            return;
        }

        // Try to delete the role
        try {
            await role.delete();
        } catch (error) {
            // Handle any errors that occur during deletion
            console.error(consoleColors("red"), 'Failed to delete role:', error);
        }


        const title = "Award Reset";
        const description = `Role "**${roleName}**" created by <@${reward.user_id}> has been removed. **${reward.time} days** have passed.`;
        const color = "";
        const embed = createEmbed(title, description, color);
        const bot_channel = await getBotChannel(reward.guild_id);

        if (bot_channel && bot_channel.channel) {
            try {
                const channel = await client.channels.fetch(bot_channel.channel);
                await channel.send({ embeds: [embed] });
                
                console.log(consoleColors("green"), 'Message sent to the bot channel successfully.');
                return; // Ensure the function exits here
            } catch (error) {
                console.error(consoleColors("red"), 'Error sending message to the bot channel:', error);
                return; // Exit function if there's an error
            }
        } else {
            console.error(consoleColors("red"), 'Bot channel not found or not set.');
            return; // Exit function if the bot channel is not found
        }
    } catch (error) {
        console.error(consoleColors("red"), `Error removing the role:`, error);
        return; // Exit function if there's an error in the try-catch block
    }
}

module.exports = removeCustomRole;