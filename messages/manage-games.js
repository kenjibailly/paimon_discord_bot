const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('../helpers/cancel-thread');
const Games = require('../models/games');
const validateNumber = require('../helpers/validate-number');
const consoleColors = require('../helpers/console-colors');

async function handleManageGames(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.action !== "update-game" && user_exchange_data.action !== "remove-game") {
        return;
    }    

    const messageContent = message.content;
    const validationError = validateNumber(messageContent, user_exchange_data.games);

    if (validationError) {
        console.error(consoleColors("red"), "Validation Error:", validationError);
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
        let color = "";
        const embed = createEmbed(title, description, "");
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

async function removeGame(game, client, message) {
    try {
        const deletedGame = await Games.findByIdAndDelete(game._id);
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
        console.error(consoleColors("red"), "Remove Game Error: " + error);
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


    const title = `Game Update`;
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
            const title = `Game Update`;
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
        console.error(consoleColors("red"), "Error Updating Game To Database: " + error);

        const title = `Game Update Error`;
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

module.exports = { handleManageGames, handleUpdateGameName, handleUpdateGameDescription };