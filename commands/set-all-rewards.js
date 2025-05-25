const Rewards = require("../models/rewards");
const TokenEmoji = require("../models/wallet-config");
const createEmbed = require("../helpers/embed");

async function handleSetAllRewardsCommand(interaction, client) {
  const { guildId } = interaction;

  // Find each option by name
  const price = interaction.options.getInteger("price");
  const time = interaction.options.getInteger("time");

  // Validate that at least one of price or time is provided
  if (price === null && time === null) {
    const title = "Invalid Input";
    const description = "Either price or time must be provided.";
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

    // Update all rewards in the guild
    const result = await Rewards.updateMany({ guild_id: guildId }, update);

    const title = "Rewards Updated";
    const descriptionParts = [];

    const token_emoji = await TokenEmoji.findOne({ guild_id: guildId });

    if (price !== null)
      descriptionParts.push(
        `Price updated to **${price}** ${token_emoji.token_emoji}`
      );
    if (time !== null)
      descriptionParts.push(`Reset time updated to **${time} days**`);

    const description =
      descriptionParts.length > 0
        ? `All rewards on the server have been updated:\n${descriptionParts.join(
            "\n"
          )}`
        : `No updates were made.`;

    const color = "";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error("Error updating rewards:", error);

    const title = "Error";
    const description = `An error occurred while updating the rewards. Please try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleSetAllRewardsCommand;
