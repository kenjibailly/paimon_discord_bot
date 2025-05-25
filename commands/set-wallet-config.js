const WalletConfig = require("../models/wallet-config");
const createEmbed = require("../helpers/embed");

async function handleSetWalletConfigCommand(interaction, client) {
  const { guildId } = interaction;

  // Required input
  const tokenEmoji = interaction.options.getString("token_emoji");

  // Optional inputs
  const extraCurrencyActive = interaction.options.getBoolean(
    "extra_currency_active"
  );
  const extraTokenEmoji = interaction.options.getString("extra_token_emoji");

  if (!tokenEmoji) {
    const embed = createEmbed(
      "Invalid Input",
      "A token emoji must be provided.",
      "error"
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
    return;
  }

  try {
    // Utility to parse emoji input
    function parseEmoji(emoji) {
      const customEmojiRegex = /^<:(\w+):(\d+)>$/;
      const match = emoji.match(customEmojiRegex);
      if (match) {
        return {
          name: match[1],
          id: match[2],
          full: `<:${match[1]}:${match[2]}>`,
        };
      } else {
        return {
          name: emoji,
          id: null,
          full: emoji,
        };
      }
    }

    // Parse required token emoji
    const parsedMain = parseEmoji(tokenEmoji);

    // Parse optional extra token emoji
    let parsedExtra = { name: "", id: null, full: "" };
    if (extraTokenEmoji) {
      parsedExtra = parseEmoji(extraTokenEmoji);
    }

    // Build update object
    const update = {
      token_emoji_name: parsedMain.name,
      token_emoji_id: parsedMain.id,
      token_emoji: parsedMain.full,
    };

    if (extraCurrencyActive !== null) {
      update.extra_currency_active = extraCurrencyActive;
    }

    if (extraTokenEmoji) {
      update.extra_token_emoji_name = parsedExtra.name;
      update.extra_token_emoji_id = parsedExtra.id;
      update.extra_token_emoji = parsedExtra.full;
    }

    // Upsert to DB
    const result = await WalletConfig.findOneAndUpdate(
      { guild_id: guildId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Build response message
    let desc = `• Token emoji has been set to ${result.token_emoji}`;
    if (extraCurrencyActive !== null) {
      desc += `\n• Extra currency is **${
        extraCurrencyActive ? "enabled" : "disabled"
      }**`;
    }
    if (extraTokenEmoji) {
      desc += `\n• Extra token emoji has been set to ${parsedExtra.full}`;
    }

    const embed = createEmbed("Wallet Configuration Updated", desc, "");
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error("Error updating wallet config:", error);

    const embed = createEmbed(
      "Error",
      "An error occurred while updating the wallet configuration. Please try again later.",
      "error"
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleSetWalletConfigCommand;
