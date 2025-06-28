const Wallet = require("../models/wallet");
const createEmbed = require("../helpers/embed");
const getWalletConfig = require("../helpers/get-wallet-config");

async function handleWalletCommand(interaction, client) {
  const { guildId } = interaction;
  await interaction.deferReply(); // optional: private response

  try {
    // Get optional user option
    const targetUser = interaction.options.getUser("user") || interaction.user;

    // Retrieve the wallet for the user
    const wallet = await Wallet.findOne({
      user_id: targetUser.id,
      guild_id: guildId,
    });

    // Retrieve wallet config
    const config = await getWalletConfig(guildId);

    // Check if config is an embed (error case)
    if (config.data) {
      await interaction.editReply({ embeds: [config], flags: 64 });
      return;
    }

    const { token_emoji, extra_currency_active, extra_token_emoji } = config;

    if (wallet) {
      let description = `${
        targetUser.id === interaction.user.id
          ? "You have"
          : `<@${targetUser.id}> has`
      } **${wallet.amount}** ${token_emoji}.`;

      if (extra_currency_active) {
        description += `\n${
          targetUser.id === interaction.user.id
            ? "You also have"
            : `<@${targetUser.id}> also has`
        } **${wallet.extra_amount || 0}** ${extra_token_emoji}.`;
      }

      const embed = createEmbed("Wallet Balance", description, "");
      await interaction.editReply({ embeds: [embed], flags: 64 });
    } else {
      const description = `${
        targetUser.id === interaction.user.id
          ? `You have not been awarded any ${token_emoji} yet.`
          : `${targetUser.username} has not been awarded any ${token_emoji} yet.`
      }`;
      const embed = createEmbed("Wallet", description, "error");

      await interaction.editReply({ embeds: [embed], flags: 64 });
    }
  } catch (error) {
    logger.error("Error during finding wallet:", error);

    const embed = createEmbed(
      "Wallet",
      `I could not find the wallet.`,
      "error"
    );
    await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleWalletCommand;
