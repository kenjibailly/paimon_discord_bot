const BotChannel = require('../models/bot-channel');
const createEmbed = require('../helpers/embed');


async function getBotChannel(guild_id) {
    try {
        const bot_channel = await BotChannel.findOne({ guild_id: guild_id });
        if (!bot_channel) {
            const title = "Error";
            const description = "There was an error retrieving the bot channel. Please try again later.";
            const color = "error";
            const embed = createEmbed(title, description, color);
            return embed;
        }
        return bot_channel;
    } catch (error) {
        logger.error(`Error fetching token emoji:`, error);
        // Return an error embed for response
        const title = "Error";
        const description = "There was an error retrieving the token emoji. Please try again later.";
        const color = "error";
        const embed = createEmbed(title, description, color);
        return embed;
    }
}

module.exports = getBotChannel;