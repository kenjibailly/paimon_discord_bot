const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../../helpers/embed');
const Wallet = require('../../../models/wallet');
const AwardedReward = require('../../../models/awarded-reward');
const getTokenEmoji = require('../../../helpers/get-token-emoji');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');

async function handleExchangeChangeNicknameButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);
    
    userExchangeData.delete(interaction.member.user.id);

    let wallet;
    let member;
    let guild;
    let thread;
    
    try {
        // Fetch the wallet
        wallet = await Wallet.findOne({ user_id: interaction.member.user.id, guild_id: interaction.guild_id });
        if (!wallet) {
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

        // Check wallet balance
        if (wallet.amount < Number(user_exchange_data.rewardPrice)) {
            const title = "Wallet";
            const description = `You don't have enough ${user_exchange_data.tokenEmoji.token_emoji} to make this exchange.
            You currently have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} and you need **1** ${user_exchange_data.tokenEmoji.token_emoji}`;
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
            const color = "error";
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

        try {
            let reward;
            if (user_exchange_data.taggedUser) {
                const reward = "change-user-nickname"; // Example reward value
                const awardedReward = await AwardedReward.findOneAndUpdate(
                    {
                        guild_id: interaction.guild_id,
                        awarded_user_id: user_exchange_data.taggedUser,
                        reward: { $in: ['change-own-nickname', 'change-user-nickname'] } // Match if reward is in the specified array
                    },
                    {
                        awarded_user_id: user_exchange_data.taggedUser,
                        user_id: interaction.member.user.id,
                        value: user_exchange_data.nickname,
                        reward: reward,
                        date: new Date(),
                    },
                    {
                        upsert: true, // Create a new document if one doesn't exist
                        new: true, // Return the updated document
                        setDefaultsOnInsert: true // Apply default values on insert if defined
                    }
                );

            } else {
                const reward = "change-own-nickname"; // Example reward value

                const awardedReward = await AwardedReward.findOneAndUpdate(
                    {
                        guild_id: interaction.guild_id,
                        awarded_user_id: interaction.member.user.id,
                        reward: { $in: ['change-own-nickname', 'change-user-nickname'] } // Match if reward is in the specified array
                    },
                    {
                        user_id: interaction.member.user.id,
                        value: user_exchange_data.nickname,
                        reward: reward,
                        date: new Date(),
                    },
                    {
                        upsert: true, // Create a new document if one doesn't exist
                        new: true, // Return the updated document
                        setDefaultsOnInsert: true // Apply default values on insert if defined
                    }
                );

            }
        } catch (error) {
            console.error('Error adding reward to DB:', error);

            let title = "Reward Database Error";
            let description = `I could not add the reward to the database. Please contact the administrator.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        
        await member.setNickname(user_exchange_data.nickname);

        // Deduct from the wallet
        wallet.amount -= Number(user_exchange_data.rewardPrice);
        await wallet.save();
        const title = "Shop";
        const description = `**${member.user.globalName}**'s nickname has been changed to **${user_exchange_data.nickname}**.
        You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.`;
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

        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

module.exports = handleExchangeChangeNicknameButton;
