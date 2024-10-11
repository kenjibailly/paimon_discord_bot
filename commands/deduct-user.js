const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');


async function handleDeductUserCommand(interaction, client) {
    const { member,guildId } = interaction;

    const userId = interaction.options.getUser('user').id;
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : "No reason provided";

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
        const wallet = await Wallet.findOne({ user_id: userId, guild_id: guildId });

        if (!wallet) {
            // Handle case where the wallet doesn't exist
            const title = "Wallet Not Found";
            const description = `The specified user does not yet have a wallet.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (wallet.amount < amount) {
            // Handle case where there are insufficient funds
            const title = "Insufficient Funds";
            const description = `<@${userId}> only has **${wallet.amount}** ${tokenEmoji.token_emoji}. \n` +
            `The wallet does not have enough ${tokenEmoji.token_emoji} to deduct **${amount}** ${tokenEmoji.token_emoji}.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Deduct the amount from the wallet
        wallet.amount -= amount;
        await wallet.save();

        // Successful deduction response
        const title = "Wallet Updated";
        const description = `<@${member.user.id}> deducted ${amount} ${tokenEmoji.token_emoji} from <@${userId}>'s wallet.\n` +
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

module.exports = handleDeductUserCommand;