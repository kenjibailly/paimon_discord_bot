const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');


async function handleWalletCommand(interaction, client) {
    const { member, guildId } = interaction;

    try {
        // Retrieve the wallet for the user
        const wallet = await Wallet.findOne({ user_id: member.user.id, guild_id: guildId });

        // Retrieve the token emoji using the getTokenEmoji helper
        const tokenEmoji = await getTokenEmoji(guildId);

        // Check if tokenEmoji is an embed (error case)
        if (tokenEmoji.data) {
            await interaction.reply({ embeds: [tokenEmoji], ephemeral: true });
            return;
        }

        if (wallet) {
            const title = "Wallet Balance";
            const description = `You have **${wallet.amount}** ${tokenEmoji.token_emoji} in your wallet.`;
            const embed = createEmbed(title, description, "");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const title = "Wallet";
            const description = `You have not been awarded any ${tokenEmoji.token_emoji} yet.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        logger.error('Error during finding wallet:', error);

        const title = "Wallet";
        const description = `I could not find your wallet.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    }
}

module.exports = handleWalletCommand;