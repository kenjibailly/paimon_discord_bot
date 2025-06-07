const Levels = require("../models/levels");
const LevelConfig = require("../models/level-config");
const { handleLevelCommand, calculateExp } = require("../commands/level");

// Keeps track of the last user who sent a message in each channel
const lastMessageByUserInChannel = new Map();

function isEmojiOnly(content) {
  // Regex for custom Discord emojis: <:name:id> or <a:name:id>
  const customEmojiRegex = /<(a)?:\w+:\d+>/g;

  // Remove all standard emojis and custom emojis
  const stripped = content
    .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "")
    .replace(customEmojiRegex, "")
    .trim();

  // If nothing remains, it's emoji-only
  return stripped.length === 0;
}

async function handleExpMessages(message, client) {
  const { author, content, channelId, guildId } = message;
  if (author.bot || !content || isEmojiOnly(content.trim())) return;

  // Fetch level config to check ignored channels
  const config = await LevelConfig.findOne({ guild_id: guildId });
  if (!config) return;

  // Ignore if the current channel is in the ignored list
  if (config.ignored_channels.includes(channelId)) return;

  const lastUserId = lastMessageByUserInChannel.get(channelId);

  // Only count if someone else has spoken since this user last messaged
  if (lastUserId !== author.id) {
    lastMessageByUserInChannel.set(channelId, author.id);

    try {
      await Levels.updateOne(
        { guild_id: guildId, user_id: author.id },
        { $inc: { message_count: 1 } },
        { upsert: true }
      );

      const userLevel = await Levels.findOne({
        guild_id: guildId,
        user_id: message.author.id,
      });

      const { exp_percentage } = calculateExp(userLevel.message_count, config);
      if (exp_percentage === 0) {
        handleLevelCommand("", client, message.author.id, message);
      }
    } catch (error) {
      console.error("Failed to update message_count:", error);
    }
  }
}

module.exports = handleExpMessages;
