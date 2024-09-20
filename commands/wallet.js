const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');
const consoleColors = require('../helpers/console-colors');

async function handleWalletCommand(interaction, client) {
    const { member, guild_id } = interaction;

    try {
        // Retrieve the wallet for the user
        const wallet = await Wallet.findOne({ user_id: member.user.id, guild_id: guild_id });

        // Retrieve the token emoji using the getTokenEmoji helper
        const tokenEmoji = await getTokenEmoji(guild_id);

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

        if (wallet) {
            const title = "Wallet Balance";
            const description = `You have **${wallet.amount}** ${tokenEmoji.token_emoji} in your wallet.`;
            const embed = createEmbed(title, description, "");

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        } else {
            const title = "Wallet";
            const description = `You have not been awarded any tokens yet.`;
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
    } catch (error) {
        console.error(consoleColors("red"), 'Error during finding wallet:', error);

        const title = "Wallet";
        const description = `I could not find your wallet.`;
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

module.exports = handleWalletCommand;