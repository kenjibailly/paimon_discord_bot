const Wallet = require("../models/wallet");
const createEmbed = require("../helpers/embed");
const getWalletConfig = require("../helpers/get-wallet-config");

async function handleAwardTeamCommand(interaction, client) {
  const { member, guildId } = interaction;

  await interaction.deferReply();

  const role = interaction.options.getRole("role").id;
  const amount = interaction.options.getInteger("amount");
  const reason =
    interaction.options.getString("reason") || "No reason provided";

  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();
  const roleMembers = members.filter((member) => member.roles.cache.has(role));

  try {
    // Fetch the token emoji config
    const tokenEmojiConfig = await getWalletConfig(interaction.guildId);

    if (tokenEmojiConfig.data) {
      await interaction.editReply({
        embeds: [tokenEmojiConfig],
        flags: 64, // ephemeral
      });
      return;
    }

    const { token_emoji, extra_currency_active, extra_token_emoji } =
      tokenEmojiConfig;

    // Prepare bulk write operations
    const newWalletEntries = roleMembers.map((member) => {
      const update = {
        $inc: {
          amount: amount,
        },
      };

      if (extra_currency_active) {
        update.$inc.extra_amount = amount;
      }

      return {
        updateOne: {
          filter: { user_id: member.user.id, guild_id: guildId },
          update,
          upsert: true,
        },
      };
    });

    const result = await Wallet.bulkWrite(newWalletEntries);

    const title = "Tokens";
    const description =
      `<@${member.user.id}> awarded **${amount}** ${token_emoji}` +
      (extra_currency_active ? ` and **${amount}** ${extra_token_emoji}` : "") +
      ` to <@&${role}>!\n\n` +
      `Reason: **${reason}**`;
    const embed = createEmbed(title, description, "");

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error during bulkWrite:", error);

    const title = "Tokens";
    const description = `Failed to add tokens to the database, please try again.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = handleAwardTeamCommand;
