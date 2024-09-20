const createEmbed = require('../../helpers/embed');
const getBotChannel = require('../../helpers/get-bot-channel');
const Logger = require("../../helpers/logger");
const logger = new Logger("Bot");

async function removeCustomRole(client, reward) {
    try {
        const guild = await client.guilds.fetch(reward.guild_id);
        
        const roleName = reward.value;

        const role = guild.roles.cache.find(e => e.name === roleName);

        if (!role) {
            logger.error("Role not found to remove with name:", roleName);
            return;
        }

        // Try to delete the role
        try {
            await role.delete();
        } catch (error) {
            // Handle any errors that occur during deletion
            logger.error('Failed to delete role:', error);
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
                
                logger.success('Message sent to the bot channel successfully.');
                return; // Ensure the function exits here
            } catch (error) {
                logger.error('Error sending message to the bot channel:', error);
                return; // Exit function if there's an error
            }
        } else {
            logger.error('Bot channel not found or not set.');
            return; // Exit function if the bot channel is not found
        }
    } catch (error) {
        logger.error(`Error removing the role:`, error);
        return; // Exit function if there's an error in the try-catch block
    }
}

module.exports = removeCustomRole;