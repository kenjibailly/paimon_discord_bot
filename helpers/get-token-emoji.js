const TokenEmoji = require('../models/token-emoji');
const createEmbed = require('../helpers/embed');

async function getTokenEmoji(guild_id) {
    try {
        const token_emoji = await TokenEmoji.findOne({ guild_id: guild_id });
        if (!token_emoji) {
            const title = "Error";
            const description = "There was an error retrieving the token emoji. Please try again later.";
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);
            return embed;
        }
        return token_emoji;
    } catch (error) {
        console.error(`Error fetching token emoji:`, error);
        // Return an error embed for response
        const title = "Error";
        const description = "There was an error retrieving the token emoji. Please try again later.";
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);
        return embed;
    }
}

module.exports = getTokenEmoji;