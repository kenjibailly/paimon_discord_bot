const TokenEmoji = require('../models/token-emoji');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function getTokenEmoji(guild_id) {
    try {
        const token_emoji = await TokenEmoji.findOne({ guild_id: guild_id });
        if (!token_emoji) {
            const title = "Error";
            const description = "There was an error retrieving the token emoji. Please try again later.";
            const color = "error";
            const embed = createEmbed(title, description, color);
            return embed;
        }
        return token_emoji;
    } catch (error) {
        console.error(consoleColors("red"), `Error fetching token emoji:`, error);
        // Return an error embed for response
        const title = "Error";
        const description = "There was an error retrieving the token emoji. Please try again later.";
        const color = "error";
        const embed = createEmbed(title, description, color);
        return embed;
    }
}

module.exports = getTokenEmoji;