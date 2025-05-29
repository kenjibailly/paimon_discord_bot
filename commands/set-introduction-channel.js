const IntroductionConfig = require("../models/introduction-config");
const createEmbed = require("../helpers/embed");

async function handleSetIntroductionChannelCommand(interaction, client) {
  const { guildId } = interaction;

  // Find each option by name
  const channel = interaction.options.getChannel("channel");

  try {
    const result = await IntroductionConfig.findOneAndUpdate(
      { guild_id: guildId },
      { channel: channel },
      { upsert: true, new: true } // Create if not exists, return the updated document
    );

    const title = "Introduction Channel";
    const description = `You successfully set the introduction channel to ${channel}`;
    const color = "";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error("Introduction Channel Error:", error);
    const title = "Introduction Channel Error";
    const description = `Something went wrong while setting the introduction channel, please try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleSetIntroductionChannelCommand;
