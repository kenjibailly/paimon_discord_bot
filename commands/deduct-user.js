const Wallet = require("../models/wallet");
const createEmbed = require("../helpers/embed");
const getWalletConfig = require("../helpers/get-wallet-config");

async function handleDeductUserCommand(interaction, client) {
  const { member, guildId } = interaction;

  await interaction.deferReply();

  const userId = interaction.options.getUser("user").id;
  const amount = interaction.options.getInteger("amount"); // Normal currency
  const extraAmount = interaction.options.getInteger("extra_amount"); // Extra currency
  const reason =
    interaction.options.getString("reason") || "No reason provided";

  // 🚫 Validate: At least one amount must be provided
  if (!userId || (amount == null && extraAmount == null)) {
    const embed = createEmbed(
      "Invalid Input",
      `You must specify at least one amount to deduct.`,
      "error"
    );
    await interaction.editReply({ embeds: [embed], flags: 64 });
    return;
  }

  try {
    const config = await getWalletConfig(guildId);

    if (config.data) {
      await interaction.editReply({ embeds: [config], flags: 64 });
      return;
    }

    const { token_emoji, extra_currency_active, extra_token_emoji } = config;

    const wallet = await Wallet.findOne({ user_id: userId, guild_id: guildId });

    if (!wallet) {
      const embed = createEmbed(
        "Wallet Not Found",
        `The specified user does not yet have a wallet.`,
        "error"
      );
      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    // 🚫 Check sufficient balance
    if (
      (amount != null && wallet.amount < amount) ||
      (extraAmount != null &&
        extra_currency_active &&
        wallet.extra_amount < extraAmount)
    ) {
      const embed = createEmbed(
        "Insufficient Funds",
        `<@${userId}> has **${wallet.amount}** ${token_emoji}` +
          (extra_currency_active
            ? ` and **${wallet.extra_amount || 0}** ${extra_token_emoji}`
            : "") +
          `.\nNot enough funds to complete the deduction.`,
        "error"
      );
      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    // ✅ Deduct the values
    if (amount != null) wallet.amount -= amount;
    if (extraAmount != null && extra_currency_active) {
      wallet.extra_amount -= extraAmount;
    }

    await wallet.save();

    // 🧾 Response
    let description =
      `<@${member.user.id}> deducted ` +
      (amount != null ? `**${amount}** ${token_emoji}` : "") +
      (extraAmount != null && extra_currency_active
        ? `${
            amount != null ? " and " : ""
          }**${extraAmount}** ${extra_token_emoji}`
        : "") +
      ` from <@${userId}>'s wallet.\n\nNew balance: **${wallet.amount}** ${token_emoji}` +
      (extra_currency_active
        ? ` and **${wallet.extra_amount || 0}** ${extra_token_emoji}`
        : "") +
      `\n\nReason: **${reason}**`;

    const embed = createEmbed("Wallet Updated", description, "");
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error during wallet operation:", error);
    const embed = createEmbed(
      "Error",
      `An error occurred while processing the request.`,
      "error"
    );
    await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleDeductUserCommand;
