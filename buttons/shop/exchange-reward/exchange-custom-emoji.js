const createEmbed = require('../../../helpers/embed');
const AwardedReward = require('../../../models/awarded-reward');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const checkPermissions = require('../../../helpers/check-permissions');


async function handleExchangeCustomEmojiButton(interaction, client) {
    try {

        const user_exchange_data = userExchangeData.get(interaction.member.user.id);
        userExchangeData.delete(interaction.member.user.id);

        const guild = await client.guilds.fetch(interaction.guildId);
        const thread = await guild.channels.fetch(interaction.channelId);
    
        const wallet = await checkRequiredBalance(interaction, client, user_exchange_data.rewardPrice, thread);
        if(!wallet) { // if wallet has return error message
            return;
        }

        
        // Check bot permissions
        const permissionCheck = await checkPermissions(interaction, client, 'MANAGE_EMOJIS_AND_STICKERS', guild);
        if (permissionCheck) {
            await interaction.editReply({ embeds: [permissionCheck] });
            handleCancelThread(interaction, client);
            return;
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
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
            return;
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

            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });
            
            return;
        }

        try {
            const reward = "custom-emoji"; // Example reward value
            const awardedReward = new AwardedReward({
                guild_id: interaction.guildId,
                awarded_user_id: interaction.member.user.id,
                user_id: interaction.member.user.id,
                value: emojiName,
                reward: reward,
                date: new Date(),
            });

            await awardedReward.save();

        } catch (error) {
            logger.error('Error adding reward to DB:', error);

            let title = "Reward Database Error";
            let description = `I could not add the reward to the database. Please contact the administrator.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
            return;
        }

        try {
            // Deduct from the wallet
            wallet.amount -= Number(user_exchange_data.rewardPrice);
            await wallet.save();
        } catch (error) {
            logger.error("Failed to save wallet:", error);
            
            const title = "Transaction Error";
            const description = "There was an error while processing your wallet transaction. Please try again later.";
            const color = "error"; // Assuming you have a color constant for errors
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
            return;
        }

        try {
            // Upload the custom emoji
            const newEmoji = await guild.emojis.create({
                attachment: user_exchange_data.processedImage,
                name: emojiName,
            });

            if (newEmoji) {
                // Send a success message once the emoji is added
                const title = "Emoji Added";
                const description = `The emoji **:${newEmoji.name}:** has been successfully added to the server!\n` +
                `You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.`;
                const color = "";
                const embed = createEmbed(title, description, color);

                // Send success message before canceling the thread message
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });

                handleCancelThread(interaction, client);

                // Send message to the parent channel if available
                const parentChannel = thread.parent;
                if (parentChannel) {
                    const parentTitle = "Shop";
                    const parentDescription = `<@${interaction.member.user.id}> has added emoji: **:${newEmoji.name}:** to the server.`;
                    const parentEmbed = createEmbed(parentTitle, parentDescription, "");
                    
                    await parentChannel.send({
                        embeds: [parentEmbed],
                    });
                }
            
            } else {
                throw new Error("Error wile uploading emoji to Discord");
            }

        } catch (error) {
            logger.error("Emoji Upload Error: ", error);
            
            const title = "Emoji Upload Failed";
            const description = `There was an issue adding the emoji to the server. Please try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({
                embeds: [embed],
                components: []  // Ensure this is an empty array
            });            
            handleCancelThread(interaction, client);
        }

    } catch (error) {
        logger.error('Error adding custom server emoji:', error);

        let title = "Add Custom Server Emoji Error";
        let description = `I could not add a custom server emoji. Your wallet has not been affected.`;

        if (error.code === 50013) {
            title = "Permission Error";
            description = `I don't have permission to add a custom server emoji.\n` +
            `Your wallet has not been affected.`;
        }

        const color = "error";
        const embed = createEmbed(title, description, color);
        await interaction.editReply({
            embeds: [embed],
            components: []  // Ensure this is an empty array
        });        
        handleCancelThread(interaction, client);
    }

}

module.exports = handleExchangeCustomEmojiButton;