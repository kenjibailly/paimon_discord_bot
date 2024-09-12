const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');

async function handleExchangeChangeNicknameButton(interaction, client) {
        
    try {

        const user_exchange_data = userExchangeData.get(interaction.member.user.id);
        userExchangeData.delete(interaction.member.user.id);

        const guild = await client.guilds.fetch(interaction.guild_id);
        const thread = await guild.channels.fetch(interaction.channel_id);
    
        const wallet = await checkRequiredBalance(interaction, client, user_exchange_data.rewardPrice, thread);
        if(!wallet) { // if wallet has return error message
            return {
                type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
            };
        }

        // Check bot permissions
        const permissionCheck = await checkPermissions(interaction, client, 'MANAGE_NICKNAMES', guild);
        if (permissionCheck) {
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [permissionCheck],
                },
            };
        }


        // Fetch member who's nickname should be changed
        let member;
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

        handleCancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

module.exports = handleExchangeChangeNicknameButton;
