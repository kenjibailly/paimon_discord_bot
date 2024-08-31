const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const Wallet = require('../models/wallet');
const getTokenEmoji = require('../helpers/get-token-emoji');
const handleCancelThread = require('./cancel-thread');
const userExchangeData = require('../helpers/userExchangeData');

async function handleExchangeChangeNickname(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);
    
    userExchangeData.delete(interaction.member.user.id);
    // Extract the encoded content from the custom_id
    const customIdParts = interaction.data.custom_id.split(':');
    const customId = customIdParts[0];
    const encodedContent = customIdParts[1]; // The second part is the encoded message content

    // Decode the content
    const messageContent = decodeURIComponent(encodedContent);

    let wallet;
    let member;
    let guild;
    let thread;
    
    try {
        // Fetch the wallet
        wallet = await Wallet.findOne({ user_id: interaction.member.user.id, guild_id: interaction.guild_id });
        if (!wallet) {
            throw new Error('Wallet not found');
        }

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

        // Check wallet balance
        if (wallet.amount < 1) {
            const title = "Wallet";
            const description = `You don't have enough ${tokenEmoji.token_emoji} to make this exchange.
            You currently have **${wallet.amount}** ${tokenEmoji.token_emoji} and you need **1** ${tokenEmoji.token_emoji}`;
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

        // Fetch the guild
        guild = await client.guilds.fetch(interaction.guild_id);
        const botMember = await guild.members.fetch(client.user.id);

        // Check bot permissions
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
        if (user_exchange_data.taggedUser) {
            member = await guild.members.fetch(user_exchange_data.taggedUser);
        } else {
            member = await guild.members.fetch(interaction.member.user.id);
        }
        
        await member.setNickname(messageContent);

        // Deduct from the wallet
        wallet.amount -= 1;
        await wallet.save();
        const title = "Shop";
        const description = `**${member.user.globalName}**'s nickname has been changed to **${messageContent}**.
        You now have **${wallet.amount}** ${tokenEmoji.token_emoji} in your wallet.`;
        const embed = createEmbed(title, description, "");

        thread = await guild.channels.fetch(interaction.channel_id);
        await thread.send({ embeds: [embed] });

        await handleCancelThread(interaction, client);
        
        // Send message to the parent channel if available
        const parentChannel = thread.parent;
        if (parentChannel) {
            const parentTitle = "Shop";
            const parentDescription = user_exchange_data.taggedUser 
                ? `<@${interaction.member.user.id}> has changed **${member.user.globalName}**'s nickname to <@${member.user.id}>.` 
                : `**${interaction.member.user.global_name}** has changed their nickname to <@${member.user.id}>.`;
            const parentEmbed = createEmbed(parentTitle, parentDescription, "");
            
            await parentChannel.send({
                embeds: [parentEmbed],
            });
        }

        return {
            type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
        };

    } catch (nicknameError) {
        console.error('Error changing nickname:', nicknameError);

        let title = "Nickname Change Error";
        let description = `I could not change the nickname. Your wallet has not been affected.`;

        if (nicknameError.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to change the nickname. 
            This could be due to role hierarchy issues or you are trying to change the nickname of the server owner. 
            To change the nickname of the server owner, please contact the server owner.
            Your wallet has not been affected.`;
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
}

module.exports = handleExchangeChangeNickname;
