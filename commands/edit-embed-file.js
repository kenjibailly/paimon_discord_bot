const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const createEmbed = require("../helpers/embed");

async function handleEditEmbedFileCommand(interaction, client) {
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

  // Extract the message link
  const messageLink = interaction.options.getString("message");
  const file = interaction.options.getAttachment("file");

  // Extract IDs from the link
  const linkRegex = /discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
  const match = messageLink.match(linkRegex);

  if (!match) {
    const errorEmbed = createEmbed(
      "Invalid Link",
      "❌ The provided message link is invalid.",
      "error"
    );
    return await interaction.editReply({
      embeds: [errorEmbed],
      flags: 64, // ephemeral
    });
  }

  const [, guildId, channelId, messageId] = match;

  // Validate the uploaded file
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

    // Fetch the channel and the message
    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);

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

    // Edit the message with the new embeds
    await message.edit({
      embeds, // New embeds to replace the existing ones
    });

    // Confirm action
    const title = "Success";
    const description = `✅ Embed successfully updated in ${channel}!`;
    const color = "";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Error processing JSON file:", error);
    const title = "JSON Error";
    const description = `❌ Failed to process JSON! Ensure the file is correctly formatted or the message exists.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleEditEmbedFileCommand;
