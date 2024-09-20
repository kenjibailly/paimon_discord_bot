const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');


async function handleAwardUserCommand(interaction, client) {
    const { member, guild_id, data } = interaction;

    const userOption = data.options.find(opt => opt.name === 'user');
    const amountOption = data.options.find(opt => opt.name === 'amount');
    const reasonOption = data.options.find(opt => opt.name === 'reason');
    
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

        // Fetch the token emoji using getTokenEmoji function
        const tokenEmoji = await getTokenEmoji(interaction.guild_id);

        // Check if tokenEmoji is an embed (error case)
        if (tokenEmoji.data) {
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [tokenEmoji],
                    flags: 64,
                },
            };
        }

        // Find the wallet for the specified user and guild
        let wallet = await Wallet.findOne({ user_id: userId, guild_id: guild_id });

        if (!wallet) {
            // Create a new wallet if it doesn't exist
            wallet = new Wallet({
                user_id: userId,
                guild_id: guild_id,
                amount: amount,
            });
            await wallet.save();

            const title = "Wallet Created";
            const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@${userId}>. 
            New balance: **${wallet.amount}** ${tokenEmoji.token_emoji}.
            \nReason: **${reason}**`;
            const color = "";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        // Award the amount to the existing wallet
        wallet.amount += amount;
        await wallet.save();

        // Successful award response
        const title = "Wallet Updated";
        const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@${userId}>. 
        New balance: **${wallet.amount}** ${tokenEmoji.token_emoji}.
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
        logger.error('Error during wallet operation:', error);

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

module.exports = handleAwardUserCommand;