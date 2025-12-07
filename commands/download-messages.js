const { PermissionsBitField, AttachmentBuilder } = require("discord.js");
const createEmbed = require("../helpers/embed");
const https = require("https");
const http = require("http");
const archiver = require("archiver");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

async function handleDownloadMessagesCommand(interaction, client) {
  // Check if the user has Manage Guild permission (admin-only)
  if (
    !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
  ) {
    const title = "Permission Error";
    const description = `❌ You don't have permission to use this command!`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    return await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const channel = interaction.options.getChannel("channel");

  // Reply immediately to acknowledge the command
  const startEmbed = createEmbed(
    "Processing Started",
    `⏳ Started processing transcript for ${channel}. This may take a while for large channels.\n\nI'll send you a DM when it's ready!`,
    ""
  );
  await interaction.reply({ embeds: [startEmbed], ephemeral: true });

  // Get the user to send DMs
  const user = interaction.user;

  try {
    // Send initial DM
    const dmChannel = await user.createDM();
    const progressEmbed = createEmbed(
      "Transcript Generation Started",
      `📥 Fetching messages from ${channel.name}...`,
      ""
    );
    const progressMessage = await dmChannel.send({ embeds: [progressEmbed] });

    const messages = [];
    let lastMessageId;

    // Fetch all messages in the channel (100 at a time)
    while (true) {
      const options = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      const batch = await channel.messages.fetch(options);
      if (batch.size === 0) break;

      messages.push(...batch.values());
      lastMessageId = batch.last().id;

      // Update progress every 1000 messages
      if (messages.length % 1000 === 0) {
        const updateEmbed = createEmbed(
          "Fetching Messages",
          `📥 Fetched ${messages.length} messages so far...`,
          ""
        );
        await progressMessage.edit({ embeds: [updateEmbed] }).catch(() => {});
      }
    }

    // Sort messages by timestamp (oldest first)
    messages.reverse();

    // Download all media files
    const downloadEmbed = createEmbed(
      "Downloading Media",
      `📦 Downloading media files from ${messages.length} messages...`,
      ""
    );
    await progressMessage.edit({ embeds: [downloadEmbed] }).catch(() => {});

    const mediaFiles = await downloadAllMedia(messages, progressMessage);

    // Generate HTML transcript with local file paths
    const genEmbed = createEmbed(
      "Generating HTML",
      `📝 Generating HTML transcript...`,
      ""
    );
    await progressMessage.edit({ embeds: [genEmbed] }).catch(() => {});

    const html = generateHTML(messages, channel, interaction.guild, mediaFiles);

    // Create ZIP file
    const zipEmbed = createEmbed(
      "Creating Archive",
      `🗜️ Creating ZIP archive...`,
      ""
    );
    await progressMessage.edit({ embeds: [zipEmbed] }).catch(() => {});

    const zipBuffer = await createZipArchive(html, mediaFiles, channel);

    // Check file size (Discord has a 25MB limit for bots, 8MB for free users)
    const fileSizeMB = zipBuffer.length / (1024 * 1024);

    if (fileSizeMB > 24) {
      const errorEmbed = createEmbed(
        "File Too Large",
        `❌ The transcript archive is ${fileSizeMB.toFixed(
          2
        )}MB, which exceeds Discord's 25MB upload limit.\n\nConsider:\n- Downloading a smaller channel\n- Breaking it into date ranges\n- Using a file hosting service`,
        ""
      );
      await progressMessage.edit({ embeds: [errorEmbed] });
      return;
    }

    // Create attachment
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `transcript-${channel.name}-${timestamp}.zip`;
    const attachment = new AttachmentBuilder(zipBuffer, { name: filename });

    const successEmbed = createEmbed(
      "Transcript Complete!",
      `✅ Successfully generated transcript with:\n• ${
        messages.length
      } messages\n• ${
        mediaFiles.size
      } media files\n• Archive size: ${fileSizeMB.toFixed(2)}MB`,
      ""
    );

    await progressMessage.edit({ embeds: [successEmbed] });
    await dmChannel.send({ files: [attachment] });
  } catch (error) {
    console.error("Error generating transcript:", error);

    // Try to send error to user's DM
    try {
      const dmChannel = await user.createDM();
      const errorEmbed = createEmbed(
        "Error",
        `❌ Failed to generate transcript: ${error.message}`,
        ""
      );
      await dmChannel.send({ embeds: [errorEmbed] });
    } catch (dmError) {
      console.error("Could not send error DM:", dmError);
    }
  }
}

async function downloadAllMedia(messages, progressMessage) {
  const mediaFiles = new Map(); // url -> { buffer, filename, ext }
  let fileCounter = 0;
  let downloadedCount = 0;
  let totalMediaCount = 0;

  // First, count total media files
  for (const message of messages) {
    totalMediaCount += message.attachments.size;
    if (message.embeds.length > 0) {
      for (const embed of message.embeds) {
        if (embed.image?.url) totalMediaCount++;
        if (embed.thumbnail?.url) totalMediaCount++;
      }
    }
    if (message.reactions.cache.size > 0) {
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.emoji.id) totalMediaCount++;
      }
    }
    const emojiMatches = message.content.matchAll(/<a?:(\w+):(\d+)>/g);
    for (const match of emojiMatches) {
      totalMediaCount++;
    }
  }

  for (const message of messages) {
    // Download attachments
    if (message.attachments.size > 0) {
      for (const attachment of message.attachments.values()) {
        if (!mediaFiles.has(attachment.url)) {
          try {
            const buffer = await downloadFile(attachment.url);
            const ext = getFileExtension(attachment.name);
            const filename = `media/${fileCounter++}_${sanitizeFilename(
              attachment.name
            )}`;
            mediaFiles.set(attachment.url, { buffer, filename, ext });
            downloadedCount++;

            // Update progress every 50 files
            if (downloadedCount % 50 === 0) {
              const updateEmbed = createEmbed(
                "Downloading Media",
                `📦 Downloaded ${downloadedCount}/${totalMediaCount} media files...`,
                ""
              );
              await progressMessage
                .edit({ embeds: [updateEmbed] })
                .catch(() => {});
            }
          } catch (error) {
            console.error(`Failed to download ${attachment.url}:`, error);
          }
        }
      }
    }

    // Download embed images
    if (message.embeds.length > 0) {
      for (const embed of message.embeds) {
        if (embed.image?.url && !mediaFiles.has(embed.image.url)) {
          try {
            const buffer = await downloadFile(embed.image.url);
            const ext = getFileExtension(embed.image.url);
            const filename = `media/${fileCounter++}_embed${ext}`;
            mediaFiles.set(embed.image.url, { buffer, filename, ext });
            downloadedCount++;

            if (downloadedCount % 50 === 0) {
              const updateEmbed = createEmbed(
                "Downloading Media",
                `📦 Downloaded ${downloadedCount}/${totalMediaCount} media files...`,
                ""
              );
              await progressMessage
                .edit({ embeds: [updateEmbed] })
                .catch(() => {});
            }
          } catch (error) {
            console.error(`Failed to download ${embed.image.url}:`, error);
          }
        }
        if (embed.thumbnail?.url && !mediaFiles.has(embed.thumbnail.url)) {
          try {
            const buffer = await downloadFile(embed.thumbnail.url);
            const ext = getFileExtension(embed.thumbnail.url);
            const filename = `media/${fileCounter++}_thumb${ext}`;
            mediaFiles.set(embed.thumbnail.url, { buffer, filename, ext });
            downloadedCount++;

            if (downloadedCount % 50 === 0) {
              const updateEmbed = createEmbed(
                "Downloading Media",
                `📦 Downloaded ${downloadedCount}/${totalMediaCount} media files...`,
                ""
              );
              await progressMessage
                .edit({ embeds: [updateEmbed] })
                .catch(() => {});
            }
          } catch (error) {
            console.error(`Failed to download ${embed.thumbnail.url}:`, error);
          }
        }
      }
    }

    // Download custom emoji in reactions
    if (message.reactions.cache.size > 0) {
      for (const reaction of message.reactions.cache.values()) {
        if (reaction.emoji.id) {
          const emojiUrl = `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.png`;
          if (!mediaFiles.has(emojiUrl)) {
            try {
              const buffer = await downloadFile(emojiUrl);
              const filename = `media/${fileCounter++}_emoji_${
                reaction.emoji.id
              }.png`;
              mediaFiles.set(emojiUrl, { buffer, filename, ext: ".png" });
              downloadedCount++;
            } catch (error) {
              console.error(`Failed to download ${emojiUrl}:`, error);
            }
          }
        }
      }
    }

    // Download custom emoji in message content
    const emojiMatches = message.content.matchAll(/<a?:(\w+):(\d+)>/g);
    for (const match of emojiMatches) {
      const emojiId = match[2];
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
      if (!mediaFiles.has(emojiUrl)) {
        try {
          const buffer = await downloadFile(emojiUrl);
          const filename = `media/${fileCounter++}_emoji_${emojiId}.png`;
          mediaFiles.set(emojiUrl, { buffer, filename, ext: ".png" });
          downloadedCount++;
        } catch (error) {
          console.error(`Failed to download ${emojiUrl}:`, error);
        }
      }
    }
  }

  return mediaFiles;
}

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirects
          return downloadFile(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download: ${res.statusCode}`));
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function getFileExtension(filename) {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function createZipArchive(html, mediaFiles, channel) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    // Add HTML file
    archive.append(html, { name: "transcript.html" });

    // Add all media files
    for (const [url, fileData] of mediaFiles) {
      archive.append(fileData.buffer, { name: fileData.filename });
    }

    archive.finalize();
  });
}

function generateHTML(messages, channel, guild, mediaFiles) {
  const channelName = escapeHtml(channel.name);
  const guildName = escapeHtml(guild.name);
  const messageCount = messages.length;
  const exportDate = new Date().toLocaleString();

  let messagesHtml = "";
  let previousAuthorId = null;
  let previousTimestamp = null;

  for (const message of messages) {
    const author = message.author;
    const timestamp = message.createdAt;
    const avatarUrl = author.displayAvatarURL({ size: 64 });
    const globalName = escapeHtml(author.globalName || author.username);
    const username = escapeHtml(author.username);
    const content = escapeHtml(message.content);

    // Check if this message should be grouped with the previous one
    // Group if: same author AND within 7 minutes of previous message
    const timeDiff = previousTimestamp
      ? (timestamp - previousTimestamp) / 1000 / 60
      : Infinity;
    const isGrouped = previousAuthorId === author.id && timeDiff < 7;

    previousAuthorId = author.id;
    previousTimestamp = timestamp;

    const formattedTime = timestamp.toLocaleString();
    const formattedTimeShort = timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Process content for mentions, emoji, etc.
    let processedContent = content
      .replace(/&lt;@!?(\d+)&gt;/g, '<span class="mention">@user</span>')
      .replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mention">@role</span>')
      .replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#channel</span>');

    // Replace custom emoji with downloaded images
    processedContent = processedContent.replace(
      /&lt;a?:(\w+):(\d+)&gt;/g,
      (match, name, id) => {
        const emojiUrl = `https://cdn.discordapp.com/emojis/${id}.png`;
        const localPath = mediaFiles.get(emojiUrl)?.filename || emojiUrl;
        return `<img src="${localPath}" class="emoji-inline" alt=":${name}:" title=":${name}:">`;
      }
    );

    // Handle attachments (images, videos, audio, files)
    let attachmentsHtml = "";
    if (message.attachments.size > 0) {
      attachmentsHtml = '<div class="attachments">';
      for (const attachment of message.attachments.values()) {
        const localPath =
          mediaFiles.get(attachment.url)?.filename || attachment.url;
        const name = escapeHtml(attachment.name);

        if (attachment.contentType?.startsWith("image/")) {
          attachmentsHtml += `<img src="${localPath}" alt="${name}" class="attachment-image" loading="lazy">`;
        } else if (attachment.contentType?.startsWith("video/")) {
          attachmentsHtml += `<video controls class="attachment-video"><source src="${localPath}" type="${attachment.contentType}"></video>`;
        } else if (attachment.contentType?.startsWith("audio/")) {
          attachmentsHtml += `<audio controls class="attachment-audio"><source src="${localPath}" type="${attachment.contentType}"></audio>`;
        } else {
          attachmentsHtml += `<a href="${localPath}" class="attachment-file" target="_blank">📎 ${name}</a>`;
        }
      }
      attachmentsHtml += "</div>";
    }

    // Handle embeds
    let embedsHtml = "";
    if (message.embeds.length > 0) {
      embedsHtml = '<div class="embeds">';
      for (const embed of message.embeds) {
        const embedColor = embed.color
          ? `#${embed.color.toString(16).padStart(6, "0")}`
          : "#202225";
        embedsHtml += `<div class="embed" style="border-left-color: ${embedColor};">`;

        if (embed.author) {
          embedsHtml += `<div class="embed-author">${escapeHtml(
            embed.author.name
          )}</div>`;
        }
        if (embed.title) {
          embedsHtml += `<div class="embed-title">${escapeHtml(
            embed.title
          )}</div>`;
        }
        if (embed.description) {
          embedsHtml += `<div class="embed-description">${escapeHtml(
            embed.description
          )}</div>`;
        }
        if (embed.image) {
          const localPath =
            mediaFiles.get(embed.image.url)?.filename || embed.image.url;
          embedsHtml += `<img src="${localPath}" class="embed-image" loading="lazy">`;
        }

        embedsHtml += "</div>";
      }
      embedsHtml += "</div>";
    }

    // Handle reactions
    let reactionsHtml = "";
    if (message.reactions.cache.size > 0) {
      reactionsHtml = '<div class="reactions">';
      for (const reaction of message.reactions.cache.values()) {
        const emoji = reaction.emoji.id
          ? `<img src="${
              mediaFiles.get(
                `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.png`
              )?.filename ||
              `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.png`
            }" class="emoji" alt="${reaction.emoji.name}">`
          : reaction.emoji.name;
        reactionsHtml += `<span class="reaction">${emoji} ${reaction.count}</span>`;
      }
      reactionsHtml += "</div>";
    }

    // Only show message text div if there's actual text content
    const messageTextHtml = content
      ? `<div class="message-text">${processedContent}</div>`
      : "";

    if (isGrouped) {
      // Grouped message - no avatar or header, but show timestamp on hover
      messagesHtml += `
        <div class="message message-grouped" data-timestamp="${formattedTime}">
          <div class="message-timestamp-hover">${formattedTimeShort}</div>
          <div class="message-content-grouped">
            ${messageTextHtml}
            ${attachmentsHtml}
            ${embedsHtml}
            ${reactionsHtml}
          </div>
        </div>
      `;
    } else {
      // Full message with avatar and header
      messagesHtml += `
        <div class="message" id="msg-${message.id}">
          <img src="${avatarUrl}" alt="${globalName}" class="avatar">
          <div class="message-content">
            <div class="message-header">
              <span class="username">${globalName}</span>
              <span class="timestamp">${formattedTime}</span>
            </div>
            ${messageTextHtml}
            ${attachmentsHtml}
            ${embedsHtml}
            ${reactionsHtml}
          </div>
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript - #${channelName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      background-color: #36393f;
      color: #dcddde;
      padding: 20px;
    }

    .header {
      background-color: #2f3136;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .header h1 {
      color: #ffffff;
      margin-bottom: 10px;
    }

    .header-info {
      color: #b9bbbe;
      font-size: 14px;
    }

    .messages {
      background-color: #2f3136;
      border-radius: 8px;
      padding: 20px;
    }

    .message {
      display: flex;
      padding: 10px 0;
      transition: background-color 0.1s;
    }

    .message:hover {
      background-color: #32353b;
    }

    .message-grouped {
      display: flex;
      padding: 2px 0;
      padding-left: 58px;
      position: relative;
    }

    .message-grouped:hover {
      background-color: #32353b;
    }

    .message-grouped:hover .message-timestamp-hover {
      opacity: 1;
    }

    .message-timestamp-hover {
      position: absolute;
      left: 0;
      width: 56px;
      text-align: right;
      font-size: 11px;
      color: #72767d;
      padding-right: 8px;
      opacity: 0;
      transition: opacity 0.1s;
      line-height: 22px;
    }

    .message-content-grouped {
      flex: 1;
      min-width: 0;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .username {
      font-weight: 600;
      color: #ffffff;
      margin-right: 8px;
    }

    .timestamp {
      font-size: 12px;
      color: #72767d;
    }

    .message-text {
      color: #dcddde;
      line-height: 1.375;
      word-wrap: break-word;
    }

    .mention {
      background-color: #5865f24d;
      color: #dee0fc;
      padding: 0 2px;
      border-radius: 3px;
      font-weight: 500;
    }

    .attachments {
      margin-top: 8px;
    }

    .attachment-image {
      max-width: 400px;
      max-height: 300px;
      border-radius: 4px;
      display: block;
      margin: 4px 0;
    }

    .attachment-video {
      max-width: 400px;
      border-radius: 4px;
      display: block;
      margin: 4px 0;
    }

    .attachment-audio {
      max-width: 400px;
      margin: 4px 0;
    }

    .attachment-file {
      display: inline-block;
      background-color: #2f3136;
      padding: 8px 12px;
      border-radius: 4px;
      color: #00b0f4;
      text-decoration: none;
      margin: 4px 0;
    }

    .attachment-file:hover {
      text-decoration: underline;
    }

    .embeds {
      margin-top: 8px;
    }

    .embed {
      background-color: #2f3136;
      border-left: 4px solid #202225;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 4px 0;
      max-width: 520px;
    }

    .embed-author {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .embed-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #00b0f4;
    }

    .embed-description {
      font-size: 14px;
      margin-bottom: 8px;
    }

    .embed-image {
      max-width: 400px;
      border-radius: 4px;
      margin-top: 8px;
    }

    .reactions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }

    .reaction {
      background-color: #2f3136;
      border: 1px solid #202225;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .emoji {
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }

    .emoji-inline {
      width: 22px;
      height: 22px;
      vertical-align: middle;
      margin: 0 1px;
    }

    @media (max-width: 768px) {
      body {
        padding: 10px;
      }

      .attachment-image,
      .attachment-video,
      .embed-image {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>#${channelName}</h1>
    <div class="header-info">
      <strong>${guildName}</strong> • ${messageCount} messages • Exported on ${exportDate}
    </div>
  </div>

  <div class="messages">
    ${messagesHtml}
  </div>
</body>
</html>
  `;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = handleDownloadMessagesCommand;
