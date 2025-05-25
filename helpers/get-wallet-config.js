const WalletConfig = require("../models/wallet-config");
const createEmbed = require("./embed");

async function getWalletConfig(guild_id) {
  try {
    const token_emoji = await WalletConfig.findOne({ guild_id: guild_id });
    if (!token_emoji) {
      const title = "Error";
      const description =
        "There was an error retrieving the token emoji. Please try again later.";
      const color = "error";
      const embed = createEmbed(title, description, color);
      return embed;
    }
    return token_emoji;
  } catch (error) {
    logger.error(`Error fetching token emoji:`, error);
    // Return an error embed for response
    const title = "Error";
    const description =
      "There was an error retrieving the token emoji. Please try again later.";
    const color = "error";
    const embed = createEmbed(title, description, color);
    return embed;
  }
}

module.exports = getWalletConfig;
