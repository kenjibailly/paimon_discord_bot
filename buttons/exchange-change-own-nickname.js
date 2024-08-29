const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const Wallet = require('../models/wallet');
const handleCancelThread = require('./cancel-thread');

async function handleExchangeChangeOwnNickname(interaction, client) {
    // Extract the encoded content from the custom_id
    const customIdParts = interaction.data.custom_id.split(':');
    const encodedContent = customIdParts[1]; // The second part is the encoded message content

    // Decode the content
    const messageContent = decodeURIComponent(encodedContent);

    // Variables to store results
    let wallet;
    let member;
    let guild;
    let thread;

    try {
        // Fetch the wallet
        wallet = await Wallet.findOne({ user_id: interaction.member.user.id });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.amount < 1) {
            const title = "Wallet";
            const description = `You don't have enough 🪙 to make this exchange.
            You currently have **${wallet.amount}** 🪙 and you need **1** 🪙`;
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);
            guild = await client.guilds.fetch(interaction.guild_id);
            thread = await guild.channels.fetch(interaction.channel_id);
            await thread.send({ embeds: [embed] });

            handleCancelThread(interaction, client);
            return {
                type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
            };
        }

        // Fetch the guild and member
        guild = await client.guilds.fetch(interaction.guild_id);

        // Ensure the bot is in the guild
        if (!guild) {
            throw new Error('Guild not found');
        }

        // Fetch the bot's member object
        const botMember = await guild.members.fetch(client.user.id);

        // Check if the bot has permission to manage nicknames
        if (!botMember.permissions.has('MANAGE_NICKNAMES')) {
            const title = "Permissions Error";
            const description = `I don't have permission to change nicknames in this server. Please contact a server admin.`;
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        // Fetch the member and attempt to change the nickname
        member = await guild.members.fetch(interaction.member.user.id);

        try {
            await member.setNickname(messageContent);

            // If successful, deduct from the wallet
            wallet.amount -= 1;
            await wallet.save();

            const title = "Shop";
            const description = `Your name has been changed to **${messageContent}**.
            You now have **${wallet.amount}** 🪙 in your wallet.`;
            const embed = createEmbed(title, description, "");

            thread = await guild.channels.fetch(interaction.channel_id);
            await thread.send({ embeds: [embed] });

            handleCancelThread(interaction, client);

        } catch (nicknameError) {
            console.error('Error changing nickname:', nicknameError);

            let title = "Nickname Change Error";
            let description = `I could not change your nickname. Your wallet has not been affected.`;

            // Check for specific error codes and permissions
            if (nicknameError.code === 50013) {
                // Missing permissions, possibly due to role hierarchy issues
                title = "Permission Error";
                description = `I don't have permission to change your nickname. This could be due to role hierarchy issues or you are a server owner. Your wallet has not been affected.`;
            }

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
        console.error('Error during wallet or interaction handling:', error);

        const title = "Error";
        const description = `There was an issue with processing your request. Please try again later.`;
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

module.exports = handleExchangeChangeOwnNickname;
