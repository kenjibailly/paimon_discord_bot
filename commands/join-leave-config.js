const JoinLeaveConfig = require("../models/join-leave-config");
const createEmbed = require("../helpers/embed");

async function handleJoinLeaveConfigCommand(interaction) {
  try {
    const channel = interaction.options.getChannel("channel");
    const other_channels = interaction.options.getString("other_channels");
    const userId = interaction.options.getUser("user")?.id;

    const guild_id = interaction.guildId;

    // Build the update object dynamically
    const update = { channel };

    if (other_channels) {
      update.other_channels = other_channels;
    }
    if (userId) {
      update.user = userId;
    }

    await JoinLeaveConfig.findOneAndUpdate({ guild_id }, update, {
      upsert: true,
      new: true,
    });

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
