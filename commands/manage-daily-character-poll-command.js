const DailyCharacterPoll = require("../models/daily-character-poll");
const createEmbed = require("../helpers/embed");

async function handleManageDailyCharacterPollCommand(interaction, client) {
  const guildId = interaction.guildId;

  const active = interaction.options.getBoolean("active");
  const channel = interaction.options.getChannel("channel");

  if (!channel || channel.type !== 0) {
    const title = "Daily Character Poll";
    const description = `Please select a valid text channel.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
  }

  try {
    // Find or create a document for this guild
    const existing = await DailyCharacterPoll.findOneAndUpdate(
      { guild_id: guildId },
      {
        guild_id: guildId,
        active,
        channel_id: channel.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const title = "Daily Character Poll";
    const description = `✅ Daily character poll configuration saved:\n• Active: **${active}**\n• Channel: <#${channel.id}>`;
    const color = "";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (err) {
    const title = "Daily Character Poll";
    const description = `❌ Something went wrong while updating the configuration.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
    logger.error("Error updating poll config:", err);
  }
}

module.exports = handleManageDailyCharacterPollCommand;
