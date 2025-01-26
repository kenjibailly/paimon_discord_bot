const Rewards = require("../models/rewards");
const TokenEmoji = require("../models/token-emoji");
const createEmbed = require("../helpers/embed");

async function handleSetRewardCommand(interaction, client) {
  const { guildId } = interaction;

  // Find each option by name
  const rewardName = interaction.options.getString("reward");
  const price = interaction.options.getInteger("price");
  const time = interaction.options.getInteger("time");
  const enable = interaction.options.getBoolean("enable");

  // Validate that at least one of price, time, or enable is provided
  if (!rewardName || (price === null && time === null && enable === null)) {
    const title = "Invalid Input";
    const description =
      "At least one of price, time, or enable must be provided.";
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
    return;
  }

  try {
    // Prepare the update object dynamically
    const update = {};
    if (price !== null) update.price = price;
    if (time !== null) update.time = time;
    if (enable !== null) update.enable = enable;

    // Update the reward in the database
    const reward = await Rewards.findOneAndUpdate(
      { guild_id: guildId, name: rewardName },
      update,
      { new: true } // Returns the updated document
    );

    if (reward) {
      let description = `The reward **${reward.short_description}** has been updated.`;

      const token_emoji = await TokenEmoji.findOne({ guild_id: guildId });

      // Add only the fields that were updated to the description
      if (price !== null)
        description += `\nNew Price: **${price}** ${token_emoji.token_emoji}`;
      if (time !== null) description += `\nNew Reset Time: **${time} days**`;
      if (enable !== null)
        description += `\nStatus: **${enable ? "Enabled" : "Disabled"}**`;

      const title = "Reward Updated";
      const color = "";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } else {
      // Handle the case where the reward was not found
      const title = "Reward Not Found";
      const description = `The reward **${rewardName}** was not found for this guild.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    logger.error("Error updating reward:", error);

    const title = "Error";
    const description = `An error occurred while updating the reward. Please try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleSetRewardCommand;
