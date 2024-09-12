const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../../helpers/embed');
const Wallet = require('../../../models/wallet');
const AwardedReward = require('../../../models/awarded-reward');
const getTokenEmoji = require('../../../helpers/get-token-emoji');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');

async function handleExchangeCustomEmojiButton(interaction, client) {
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
        if (!botMember.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
            const title = "Permissions Error";
            const description = `I don't have permission to manage custom emojis in this server. Please contact a server admin.`;
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

        // Get the current number of emojis and the max allowed based on the server's Nitro level
        const currentEmojis = guild.emojis.cache.size;
        // Determine maximum emojis based on the server's premium tier
        let maxEmojis;
        switch (guild.premiumTier) {
            case 0:
                maxEmojis = 50;
                break;
            case 1:
                maxEmojis = 100;
                break;
            case 2:
                maxEmojis = 150;
                break;
            case 3:
                maxEmojis = 250;
                break;
            default:
                maxEmojis = 50; // Default to the lowest tier if something is wrong
        }

        // Check if there is space to add a custom emoji
        if (currentEmojis >= maxEmojis) {
            const title = "Emoji Limit Reached";
            const description = `This server has reached its custom emoji limit (${maxEmojis}). Please remove some emojis or upgrade the server to add more.`;
            const color = "error"; // Assuming you have color constants, adjust accordingly
            const embed = createEmbed(title, description, color);

            handleCancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        const emojiName = user_exchange_data.emojiName;

        const existingEmojis = guild.emojis.cache;

        // Check if an emoji with the given name already exists
        const emojiExists = existingEmojis.some(emoji => emoji.name === emojiName);

        if (emojiExists) {
            const title = "Emoji Name Taken";
            const description = `An emoji with the name "${emojiName}" already exists. Please choose a different name.`;
            const color = "error"; // Assuming you have a color constant for errors
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

        try {
            const reward = "custom-emoji"; // Example reward value
            const awardedReward = await AwardedReward.findOneAndUpdate(
                {
                    guild_id: interaction.guild_id,
                    awarded_user_id: interaction.member.user.id,
                    reward: { $in: reward } // Match if reward is in the specified array
                },
                {
                    awarded_user_id: interaction.member.user.id,
                    user_id: interaction.member.user.id,
                    value: emojiName,
                    reward: reward,
                    date: new Date(),
                },
                {
                    upsert: true, // Create a new document if one doesn't exist
                    new: true, // Return the updated document
                    setDefaultsOnInsert: true // Apply default values on insert if defined
                }
            );
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

        try {            
            // Upload the custom emoji
            const newEmoji = await guild.emojis.create({
                attachment: user_exchange_data.processedImage,
                name: emojiName,
            });

            // Send a success message once the emoji is added
            const title = "Emoji Added";
            const description = `The emoji **:${newEmoji.name}:** has been successfully added to the server!`;
            const color = "";
            const embed = createEmbed(title, description, color);

            handleCancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };

        } catch (error) {
            console.log("Emoji Upload Error: ", error);
            
            const title = "Emoji Upload Failed";
            const description = `There was an issue adding the emoji to the server. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }

    } catch (error) {
        console.error('Error adding custom server emoji:', error);

        let title = "Add Custom Server Emoji Error";
        let description = `I could not add a custom server emoji. Your wallet has not been affected.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom server emoji.
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

module.exports = handleExchangeCustomEmojiButton;