const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const createEmbed = require("../helpers/embed");

async function handleSendEmbedFileCommand(interaction, client) {
  // Check if the user has Manage Guild permission (admin-only)
  if (
    !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
  ) {
    const title = "Permission Error";
    const description = `❌ You don't have permission to use this command!`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  }

  const channel = interaction.options.getChannel("channel");
  const file = interaction.options.getAttachment("file");

  if (!channel || !channel.isTextBased()) {
    const title = "Channel Error";
    const description = `❌ Please select a valid text channel!`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  }

  if (!file || !file.name.endsWith(".json")) {
    const title = "JSON Error";
    const description = `❌ Please upload a valid JSON file!`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  }

  try {
    // Fetch and parse the JSON file
    const response = await axios.get(file.url);
    const jsonData = response.data;

    // Validate the structure (must contain 'embeds' array)
    if (!jsonData.embeds || !Array.isArray(jsonData.embeds)) {
      const title = "JSON Error";
      const description = `❌ Invalid JSON format! Ensure it includes an 'embeds' array.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      return await interaction.editReply({ embeds: [embed], flags: 64 });
    }

    // Convert JSON data to Embed objects
    const embeds = jsonData.embeds.map((embedData) => {
      const embed = new EmbedBuilder();

      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.color) embed.setColor(embedData.color);
      if (embedData.fields) embed.setFields(embedData.fields);
      if (embedData.image) embed.setImage(embedData.image.url);
      if (embedData.footer) embed.setFooter(embedData.footer);

      return embed;
    });

    // Prepare the content to be sent (if any)
    const content = jsonData.content || null;

    // Send the content and embeds to the selected channel
    await channel.send({
      content, // If there's content in the JSON, it will be sent
      embeds, // Send the array of embeds
    });

    // Confirm action
    const title = "Success";
    const description = `✅ Embed successfully sent to ${channel}!`;
    const color = "";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    logger.error("Error processing JSON file:", error);
    const title = "JSON Error";
    const description = `❌ Failed to parse JSON! Ensure the file is correctly formatted.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleSendEmbedFileCommand;
