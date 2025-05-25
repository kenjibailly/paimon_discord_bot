const Wallet = require("../models/wallet");
const createEmbed = require("../helpers/embed");
const getWalletConfig = require("../helpers/get-wallet-config");

async function handleAwardUserCommand(interaction, client) {
  const { member, guildId } = interaction;

  await interaction.deferReply({ ephemeral: false });

  const userId = interaction.options.getUser("user")?.id;
  const amount = interaction.options.getInteger("amount");
  const reason = interaction.options.getString("reason");

  if (!userId || !amount) {
    const embed = createEmbed(
      "Invalid Input",
      "User ID or amount is missing.",
      "error"
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
    return;
  }

  try {
    // Fetch wallet config
    const config = await getWalletConfig(guildId);

    // Handle config errors returned as an embed
    if (config.data) {
      await interaction.editReply({ embeds: [config], ephemeral: true });
      return;
    }

    // Destructure main and extra token settings
    const { token_emoji, extra_currency_active, extra_token_emoji } = config;

    // Fetch or create wallet
    let wallet = await Wallet.findOne({ user_id: userId, guild_id: guildId });

    if (!wallet) {
      wallet = new Wallet({
        user_id: userId,
        guild_id: guildId,
        amount: amount,
        extra_amount: extra_currency_active ? amount : 0,
      });
      await wallet.save();

      const description =
        `<@${member.user.id}> awarded **${amount}** ${token_emoji}` +
        (extra_currency_active
          ? ` and **${amount}** ${extra_token_emoji}`
          : "") +
        ` to <@${userId}>.\n` +
        `New balance: **${wallet.amount}** ${token_emoji}` +
        (extra_currency_active
          ? ` and **${wallet.extra_amount}** ${extra_token_emoji}`
          : "") +
        (reason ? `\n\nReason: **${reason}**` : "");

      const embed = createEmbed("Wallet Created", description, "");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Update existing wallet
    wallet.amount += amount;
    if (extra_currency_active) {
      wallet.extra_amount = (wallet.extra_amount || 0) + amount;
    }

    await wallet.save();

    const description =
      `<@${member.user.id}> awarded **${amount}** ${token_emoji}` +
      (extra_currency_active ? ` and **${amount}** ${extra_token_emoji}` : "") +
      ` to <@${userId}>.\n` +
      `New balance: **${wallet.amount}** ${token_emoji}` +
      (extra_currency_active
        ? ` and **${wallet.extra_amount}** ${extra_token_emoji}`
        : "") +
      (reason ? `\n\nReason: **${reason}**` : "");

    const embed = createEmbed("Wallet Updated", description, "");
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error during wallet operation:", error);
    const embed = createEmbed(
      "Error",
      "An error occurred while processing the request.",
      "error"
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleAwardUserCommand;
