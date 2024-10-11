const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('../helpers/cancel-thread');
const Games = require('../models/games');
const NextGames = require('../models/next-games');
const validateNumber = require('../helpers/validate-number');
const Rewards = require('../models/rewards');
const Wallet = require('../models/wallet');
const getBotChannel = require('../helpers/get-bot-channel');
const getTokenEmoji = require('../helpers/get-token-emoji');

async function handleManageGames(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    if (user_exchange_data.action !== "update-game" && user_exchange_data.action !== "remove-game") {
        return;
    }    

    const messageContent = message.content;
    const validationError = validateNumber(messageContent, user_exchange_data.games);

    if (validationError) {
        logger.error("Validation Error:", validationError);
        // Send a confirmation message before closing the thread
        const title = `Input Error`;
        const description = `${validationError}\nPlease try again.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }

    if (user_exchange_data.action == "update-game") {
        const title = "Update Game";
        const description = `Update Game Name: **${user_exchange_data.games[Number(messageContent) - 1].name}**\n\nPlease reply with the new name of your game, if you don't want to change it press the ✅ button. We will then proceed to change the description.`
        const color = "";
        const embed = createEmbed(title, description, color);
        // Send a confirmation message before closing the thread
        await message.channel.send({
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 3, // Green style
                            label: "Proceed",
                            emoji: { name: "✅" },
                            custom_id: "update-game-name"
                        },
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a game)
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ],
                },
            ],
        });


        user_exchange_data.name = "update-game-name";
        user_exchange_data.game = user_exchange_data.games[Number(messageContent) - 1];
        delete user_exchange_data.action;
        delete user_exchange_data.games;
        // Store the updated object back into userExchangeData
        userExchangeData.set(message.author.id, user_exchange_data);
        return;
    } else if (user_exchange_data.action == "remove-game") {
        const gameRemoved = await removeGame(user_exchange_data.games[Number(messageContent) - 1], client, message);
        if(gameRemoved) {
            userExchangeData.delete(message.author.id); // Remove the user's data entirely
            cancelThread(message.guildId, message.channelId, client);
        }
        return;
    }
}

async function handleAddGameName (message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    const messageContent = message.content;

    user_exchange_data.name = "add-game-description";
    user_exchange_data.new_game_name = messageContent;
    // Store the updated object back into userExchangeData
    userExchangeData.set(message.author.id, user_exchange_data);

    const title = "Add Game";
    const description = `Please reply with the new description of your game. If you don't want to add a description press the ✅ button`;
    const color = "";
    const embed = createEmbed(title, description, color);
    // Send a confirmation message before closing the thread
    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 3, // Green style
                        label: "Proceed",
                        emoji: { name: "✅" },
                        custom_id: "add-game-without-description"
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger style (for removing a game)
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ],
            },
        ],
    });
}

async function handleAddGameDescription (message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    const messageContent = message.content;

    try {
        const newGame = new Games({
            guild_id: message.guildId,
            name: user_exchange_data.new_game_name,
            description: messageContent,
        });
        await newGame.save();
    } catch (error) {
        logger.error("Error Adding Game To Database:", error);

        const title = `Add Game Error`;
        const description = `Couldn't add game, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
    
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
    }


    const title = `Add Game`;
    const description = `New game added:\n` +
    `Name: **${user_exchange_data.new_game_name}**\n` +
    `Description: **${messageContent}**.\n\n`;
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
        embeds: [embed],
    });

    userExchangeData.delete(message.author.id); // Remove the user's data entirely
    cancelThread(message.guildId, message.channelId, client);
}

async function removeGame(game, client, message) {
    try {
        const deletedGame = await Games.findByIdAndDelete(game._id);

        // Find and delete associated NextGames
        const associatedNextGames = await NextGames.find({ game_id: game._id });
        await NextGames.deleteMany({ game_id: game._id });
        
        if (associatedNextGames.length > 0) {
            const reward = await Rewards.findOne({ guild_id: message.guildId, name: 'choose-game' });
        
            // Create a mapping of user_id to the total amount to reimburse them
            const userReimbursements = {};
        
            // Loop through associated next games to aggregate reimbursements
            associatedNextGames.forEach(nextGame => {
                if (userReimbursements[nextGame.user_id]) {
                    userReimbursements[nextGame.user_id] += reward.price;
                } else {
                    userReimbursements[nextGame.user_id] = reward.price;
                }
            });
        
            // Find wallets for the users involved
            const wallets = await Wallet.find({ 
                guild_id: message.guildId, 
                user_id: { $in: Object.keys(userReimbursements) } 
            });
        
            // Update each wallet with the aggregated reimbursement amount
            wallets.forEach(wallet => {
                if (userReimbursements[wallet.user_id]) {
                    wallet.amount += userReimbursements[wallet.user_id];
                }
            });
        
            // Save the updated wallets
            await Promise.all(wallets.map(wallet => wallet.save()));
        
            // Fetch the token emoji using getTokenEmoji function (moved up)
            const tokenEmoji = await getTokenEmoji(message.guildId);
        
            // Check if tokenEmoji is an embed (error case)
            if (tokenEmoji.data) {
                await interaction.editReply({ embeds: [tokenEmoji], ephemeral: true });
                return;
            }
        
            // Build the description string with user reimbursements
            let description = `The staff removed a game from the list which has been chosen as an upcoming game.\n\n` +
            `This game has been removed:\n` +
            `- Name: **${game.name}**\n` +
            `  Description: **${game.description}**\n\n` +
            `These members have been reimbursed:\n`;
            
            Object.keys(userReimbursements).forEach(user_id => {
                description += `- <@${user_id}> has been reimbursed: **${userReimbursements[user_id]} ${tokenEmoji.token_emoji}**\n`;
            });
        
            const title = `Game Removed`;
            const color = "";
            const embed = createEmbed(title, description, color);
        
            // Fetch bot channel and send the message
            const bot_channel = await getBotChannel(reward.guild_id);
        
            // Send embed to bot channel or fallback to the current message channel
            if (bot_channel && bot_channel.channel) {
                try {
                    const channel = await client.channels.fetch(bot_channel.channel);
                    await channel.send({ embeds: [embed] });
                    
                    logger.success('Message sent to the bot channel successfully.');
                } catch (error) {
                    logger.error('Error sending message to the bot channel:', error);
                }
            } else {
                logger.error('Bot channel not found or not set.');
                await message.channel.send({
                    embeds: [embed],
                });
            }
        }
        


            // Check if the game was deleted
        if (deletedGame) {
            // Game was successfully deleted
            const title = `Game Removed`;
            const description = `The game "**${game.name}**" has been successfully removed.`;
            const color = "";
            const embed = createEmbed(title, description, color);

            await message.channel.send({
                embeds: [embed],
            });
            return true;
        } else {
            throw new Error("Database error, can't delete game.");
        }

    } catch (error) {
        logger.error("Remove Game Error:", error);
        // Send a confirmation message before closing the thread
        const title = `Remove Game Error`;
        const description = `I could not remove the game, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
        return false;
    }

}


async function handleUpdateGameName(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "update-game-name") {
        return;
    }

    const messageContent = message.content;

    user_exchange_data.name = "update-game-description";
    user_exchange_data.new_game_name = messageContent;
    // Store the updated object back into userExchangeData
    userExchangeData.set(message.author.id, user_exchange_data);


    const title = `Update Game`;
    const description = `New name: **${messageContent}** for **${user_exchange_data.game.name}**.\n\n` +
    `Please reply with the new description of your game, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.game.description ? `\n\nCurrent game description: **${user_exchange_data.game.description}**` : `\n\nYou currently don't have any description set for this game.`); // Append current_game_description only if it's not empty
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 3, // Green style
                        label: "Proceed",
                        emoji: { name: "✅" },
                        custom_id: "update-game-description"
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger style (for removing a game)
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ],
            },
        ],
    });
    return;
}


async function handleUpdateGameDescription(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "update-game-description") {
        return;
    }

    const new_game_description = message.content;

    try {

        // Construct the update object conditionally
        const updateFields = { description: new_game_description }; // Always update description

        // Only include name if it exists in user_exchange_data
        if (user_exchange_data.new_game_name) {
            updateFields.name = user_exchange_data.new_game_name;
        }

        const updatedGame = await Games.findOneAndUpdate(
            { _id: user_exchange_data.game._id },
            updateFields,
            { new: true } // Option to return the updated document
        );

        if(updatedGame) {
            const title = `Update Game`;
            // Start with the base description
            let description = `Game **${user_exchange_data.game.name}** has been updated with:\n\n`;

            // Conditionally add the name if it exists
            if (user_exchange_data.new_game_name) {
                description += `Name: **${user_exchange_data.new_game_name}**\n`;
            }

            // Always include the description
            description += `Description: **${new_game_description}**.`;
            const color = ""; // Changed to hex code for red
            const embed = createEmbed(title, description, color);
        
            await message.channel.send({
                embeds: [embed],
            });

            userExchangeData.delete(message.author.id); // Remove the user's data entirely
            cancelThread(message.guildId, message.channelId, client);
        } else {
            throw new Error("Couldn't update game to database");
        }

    } catch (error) {
        logger.error("Error Updating Game To Database:", error);

        const title = `Update Game Error`;
        const description = `Couldn't update game, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
    
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
    }

    return;
}

module.exports = { handleManageGames, handleAddGameName, handleAddGameDescription, handleUpdateGameName, handleUpdateGameDescription };