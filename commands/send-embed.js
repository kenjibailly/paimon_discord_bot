const createEmbed = require("../helpers/embed");

async function handleSendEmbedCommand(interaction, client) {
  try {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color") || "#9800FF";

    const embed = createEmbed(title, message, color);
    await interaction.deferReply({ ephemeral: false });
    await interaction.editReply({ embeds: [embed], ephemeral: false });
  } catch (error) {
    console.error("Error handling /send-embed:", error);

    const title = "Send Embed Error";
    const description = "Something went wrong, please try again later.";
    const color = "error";

    const embed = createEmbed(title, description, color);

    // Just edit the original reply if already deferred
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = handleSendEmbedCommand;
