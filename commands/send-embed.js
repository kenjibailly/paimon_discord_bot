const createEmbed = require("../helpers/embed");

async function handleSendEmbedCommand(interaction, client) {
  try {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const tagEveryone = interaction.options.getBoolean("everyone") || false;
    const color = interaction.options.getString("color") || "#9800FF";

    const embed = createEmbed(title, message, color);
    await interaction.deferReply();
    const content = "@everyone";
    if (tagEveryone) {
      await interaction.editReply({
        content: content,
        embeds: [embed],
      });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error handling /send-embed:", error);

    const title = "Send Embed Error";
    const description = "Something went wrong, please try again later.";
    const color = "error";

    const embed = createEmbed(title, description, color);

    // Just edit the original reply if already deferred
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }
}

module.exports = handleSendEmbedCommand;
