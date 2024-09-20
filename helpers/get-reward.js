const Rewards = require('../models/rewards');
const createEmbed = require('./embed');


async function getReward(guild_id, name) {
    try {
        const reward = await Rewards.findOne({ guild_id: guild_id, name: name });
        if (!reward) {
            const title = "Error";
            const description = "There was an error retrieving the reward. Please try again later.";
            const color = "error";
            const embed = createEmbed(title, description, color);
            return embed;
        }
        return reward;
    } catch (error) {
        logger.error(`Error fetching token emoji:`, error);
        // Return an error embed for response
        const title = "Error";
        const description = "There was an error retrieving the reward. Please try again later.";
        const color = "error";
        const embed = createEmbed(title, description, color);
        return embed;
    }
}

module.exports = getReward;