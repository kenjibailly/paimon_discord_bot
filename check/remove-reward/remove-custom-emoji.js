const createEmbed = require('../../helpers/embed');
const getBotChannel = require('../../helpers/get-bot-channel');


async function removeCustomEmoji(client, reward) {
    try {
        const guild = await client.guilds.fetch(reward.guild_id);
        
        const emojiName = reward.value;

        const emoji = guild.emojis.cache.find(e => e.name === emojiName);

        if (!emoji) {
            logger.error("Emoji not found to remove with name:", emojiName);
            return;
        }

        // Try to delete the emoji
        try {
            await emoji.delete();
        } catch (error) {
            // Handle any errors that occur during deletion
            logger.error('Failed to delete emoji:', error);
        }


        const title = "Award Reset";
        const description = `Emoji "**:${emojiName}:**" created by <@${reward.user_id}> has been removed. **${reward.time} days** have passed.`;
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
        logger.error(`Error resetting nickname:`, error);
        return; // Exit function if there's an error in the try-catch block
    }
}

module.exports = removeCustomEmoji;