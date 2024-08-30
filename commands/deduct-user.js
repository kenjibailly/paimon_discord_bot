const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');

async function handleDeductUserCommand(interaction, client) {
    const { member, data, guild_id } = interaction;
    const [userOption, amountOption, reasonOption] = data.options;

    const userId = userOption ? userOption.value : null;
    const amount = amountOption ? amountOption.value : null;
    const reason = reasonOption ? reasonOption.value : "No reason provided"; // Default value if no reason is provided

    if (!userId || !amount) {
        const title = "Invalid Input";
        const description = `User ID or amount is missing.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }

    try {
        // Find the wallet for the specified user and guild
        const wallet = await Wallet.findOne({ user_id: userId, guild_id: guild_id });

        if (!wallet) {
            // Handle case where the wallet doesn't exist
            const title = "Wallet Not Found";
            const description = `The specified user does not yet have a wallet.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }

        if (wallet.amount < amount) {
            // Handle case where there are insufficient funds
            const title = "Insufficient Funds";
            const description = `<@${userId}> only has **${wallet.amount}** 🪙. 
            The wallet does not have enough 🪙 to deduct **${amount}** 🪙.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }

        // Deduct the amount from the wallet
        wallet.amount -= amount;
        await wallet.save();

        // Successful deduction response
        const title = "Wallet Updated";
        const description = `<@${member.user.id}> deducted ${amount} 🪙 from <@${userId}>'s wallet. 
        New balance: **${wallet.amount}** 🪙.
        \nReason: **${reason}**`;
        const color = "";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };

    } catch (error) {
        // Handle errors during database operations
        console.error('Error during wallet operation:', error);

        const title = "Error";
        const description = `An error occurred while processing the request.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }
}

module.exports = handleDeductUserCommand;