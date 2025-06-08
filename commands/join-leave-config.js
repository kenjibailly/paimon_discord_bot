const JoinLeaveConfig = require("../models/join-leave-config");
const createEmbed = require("../helpers/embed");

async function handleJoinLeaveConfigCommand(interaction) {
  try {
    const channel = interaction.options.getChannel("channel");

    // Optionally: Store config per guild
    const guild_id = interaction.guildId;

    // Upsert (update or create) the level config
    await JoinLeaveConfig.findOneAndUpdate(
      { guild_id },
      {
        channel,
      },
      { upsert: true, new: true }
    );

    const embed = createEmbed(
      "Join Leave Configuration Updated",
      `✅ Join Leave system settings have been saved successfully.`,
      ""
    );

    await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Error saving join leave config:", error);

    const embed = createEmbed(
      "Error",
      "❌ There was an error saving the join leave configuration.",
      "error"
    );

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleJoinLeaveConfigCommand;
