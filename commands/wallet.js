const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');

async function handleWalletCommand(res, client) {
    const { member } = res;
    try {
        const wallet = await Wallet.findOne({ user_id: member.user.id });

        if (wallet) {
            const title = "Wallet Balance";
            const description = `You have **${wallet.amount}** tokens in your wallet.`;
            const embed = createEmbed(title, description, "");

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        } else {
            const title = "Wallet";
            const description = `You have not been awarded any tokens yet.`;
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }
    } catch (error) {
        console.error('Error during finding wallet:', error);

        const title = "Wallet";
        const description = `I could not find your wallet.`;
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

module.exports = handleWalletCommand;
