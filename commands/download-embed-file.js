const {
  AttachmentBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const createEmbed = require("../helpers/embed");

async function handleDownloadEmbedFileCommand(interaction, client) {
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

  try {
    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);

    // Prepare JSON data
    const jsonData = {
      content: message.content || "",
      embeds: message.embeds.map((embed) => embed.toJSON()),
      attachments: message.attachments.map((attachment) => ({
        url: attachment.url,
        name: attachment.name,
      })),
    };

    // Convert the embed data for Discohook compatibility
    const convertedData = convertEmbedForDiscohook(jsonData);

    // Convert JSON data to string
    const jsonString = JSON.stringify(convertedData, null, 2);

    // Create a buffer and send the file
    const buffer = Buffer.from(jsonString, "utf8");
    // const attachment = new AttachmentBuilder(buffer, { name: "embed.json" });
    const attachment = new AttachmentBuilder(buffer, { name: "embed.json" });

    const successEmbed = createEmbed(
      "Success",
      "✅ Embed data has been exported successfully!",
      ""
    );

    await interaction.editReply({
      embeds: [successEmbed],
      files: [attachment],
      flags: 64, // ephemeral
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    const errorEmbed = createEmbed(
      "Error",
      "❌ Unable to fetch the message. Please ensure the bot has access to the channel and the message exists.",
      "error"
    );
    await interaction.editReply({ embeds: [errorEmbed], flags: 64 });
  }
}

function convertEmbedForDiscohook(embedData) {
  const updatedEmbeds = embedData.embeds.map((embed) => {
    const { type, image, ...rest } = embed;

    // Clean up the image structure
    const updatedImage = image ? { url: image.url } : undefined;

    // Replace :gem: with <:gem:1340985466928762950>
    const replaceGem = (text) =>
      text.replace(/:gem:/g, "<:gem:1340985466928762950>");

    return {
      ...rest,
      description: replaceGem(rest.description || ""),
      fields: embed.fields?.map((field) => ({
        ...field,
        value: replaceGem(field.value),
      })),
      image: updatedImage,
    };
  });

  return {
    ...embedData,
    embeds: updatedEmbeds,
  };
}

module.exports = handleDownloadEmbedFileCommand;
