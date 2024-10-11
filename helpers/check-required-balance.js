const getTokenEmoji = require('../helpers/get-token-emoji');
const Wallet = require('../models/wallet');
const handleCancelThread = require('../buttons/cancel-thread');
const createEmbed = require('./embed');


async function checkRequiredBalance(interaction, client, price, thread) {
    const tokenEmoji = await getTokenEmoji(interaction.guildId);
    // Check if tokenEmoji is an embed (error case)
    if (tokenEmoji.data) {
        await interaction.editReply({ embeds: [tokenEmoji], ephemeral: true });
        return;
    }

    try {
        // Fetch the wallet
        const wallet = await Wallet.findOne({ user_id: interaction.member.user.id, guild_id: interaction.guildId });
        if (!wallet) {
            const title = "Wallet";
            const description = `I could not find your wallet.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await thread.send({ embeds: [embed] });

            handleCancelThread(interaction, client);
            return null;
        }

        // Check wallet balance
        if (wallet.amount < Number(price)) {
            const title = "Wallet";
            const description = `You don't have enough ${tokenEmoji.token_emoji} to make this exchange.\n` +
            `You currently have **${wallet.amount}** ${tokenEmoji.token_emoji} and you need **${price}** ${tokenEmoji.token_emoji}`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await thread.send({ embeds: [embed] });

            handleCancelThread(interaction, client);
            return null;
        } else {
            return wallet;
        }
        
    } catch (error) {
        logger.error("Check Required Balance Error:", error);
        const title = "Wallet";
        const description = `There was a problem getting your wallet balance, please try again later or contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await thread.send({ embeds: [embed] });

        handleCancelThread(interaction, client);
        return null;
    }
}

module.exports = checkRequiredBalance;