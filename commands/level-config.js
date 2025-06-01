const LevelConfig = require("../models/level-config");
const createEmbed = require("../helpers/embed");

async function handleLevelConfigCommand(interaction) {
  try {
    const message_count = interaction.options.getInteger("message_count");
    const exp_points = interaction.options.getInteger("exp_points");
    const reward = interaction.options.getInteger("reward");
    const reward_extra = interaction.options.getInteger("reward_extra");
    const channel = interaction.options.getChannel("channel");

    // Optionally: Store config per guild
    const guild_id = interaction.guildId;

    // Upsert (update or create) the level config
    await LevelConfig.findOneAndUpdate(
      { guild_id },
      {
        message_count,
        exp_points,
        reward,
        reward_extra,
        channel,
      },
      { upsert: true, new: true }
    );

    const embed = createEmbed(
      "Level Configuration Updated",
      `✅ Level system settings have been saved successfully.`,
      ""
    );

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Error saving level config:", error);

    const embed = createEmbed(
      "Error",
      "❌ There was an error saving the level configuration.",
      "error"
    );

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleLevelConfigCommand;
