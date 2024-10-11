const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');


async function handleAwardUserCommand(interaction, client) {
    const { member, guildId, data } = interaction;

    const userId = interaction.options.getUser('user').id;
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason');
    
    if (!userId || !amount) {
        const title = "Invalid Input";
        const description = `User ID or amount is missing.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {

        // Fetch the token emoji using getTokenEmoji function
        const tokenEmoji = await getTokenEmoji(guildId);

        // Check if tokenEmoji is an embed (error case)
        if (tokenEmoji.data) {
            await interaction.editReply({ embeds: [tokenEmoji], ephemeral: true });
            return;
        }

        // Find the wallet for the specified user and guild
        let wallet = await Wallet.findOne({ user_id: userId, guild_id: guildId });

        if (!wallet) {
            // Create a new wallet if it doesn't exist
            wallet = new Wallet({
                user_id: userId,
                guild_id: guildId,
                amount: amount,
            });
            await wallet.save();

            const title = "Wallet Created";
            const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@${userId}>.\n` +
            `New balance: **${wallet.amount}** ${tokenEmoji.token_emoji}.\n` +
            `\nReason: **${reason}**`;
            const color = "";
            const embed = createEmbed(title, description, color);

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Award the amount to the existing wallet
        wallet.amount += amount;
        await wallet.save();

        // Successful award response
        const title = "Wallet Updated";
        const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@${userId}>.\n` +
        `New balance: **${wallet.amount}** ${tokenEmoji.token_emoji}.\n` +
        `\nReason: **${reason}**`;
        const color = "";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        // Handle errors during database operations
        logger.error('Error during wallet operation:', error);

        const title = "Error";
        const description = `An error occurred while processing the request.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });

    }
}

module.exports = handleAwardUserCommand;