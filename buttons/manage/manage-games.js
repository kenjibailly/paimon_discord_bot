const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../helpers/embed');
const Games = require('../../models/games');
const userExchangeData = require('../../helpers/userExchangeData');
const cancelThread = require('../cancel-thread');


async function handleAddGameNameButton(interaction, client) {
    // Store interaction data for the specific user
    userExchangeData.set(interaction.member.user.id, {
        threadId: interaction.channel_id,
        name: "add-game-name",
    });

    const title = `Add Game`;
    const description = `Please reply with the new name of your game.`;
    const embed = createEmbed(title, description, "");
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a game)
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ],
                },
            ],
        },
    };
}

async function handleAddGameWithoutDescriptionButton (interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    try {
        const newGame = new Games({
            guild_id: interaction.guild_id,
            name: user_exchange_data.new_game_name,
        });
        await newGame.save();
    } catch (error) {
        logger.error("Error Adding Game To Database:", error);

        const title = `Add Game Error`;
        const description = `Couldn't add game, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);
    
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }


    const title = `Add Game`;
    const description = `New game added: \n` +
    `Name: **${user_exchange_data.new_game_name}**`;
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
    cancelThread(interaction, client);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
        },
    };
}

async function handleManageGamesButton(interaction, client) {
    try {
        const games = await Games.find({ guild_id: interaction.guild_id });
        
        if(games.length > 0) {
            let games_list = "";

            games.forEach((game, index) => {
                games_list += `${index + 1}. **${game.name}**\n`;
            });

            // Store interaction data for the specific user
            userExchangeData.set(interaction.member.user.id, {
                threadId: interaction.channel_id,
                name: "manage-games",
                action: interaction.data.custom_id,
                games: games,
            });
            
            let action;
            if (interaction.data.custom_id == "update-game") {
                action = "update";
            } else if (interaction.data.custom_id == "remove-game") {
                action = "remove";
            }

            let capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);

            const title = `${capitalizedAction} Game`;
            const description = `Please reply with the number next to the game to ${action} that game.\n\n${games_list}`;
            const embed = createEmbed(title, description, "");
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 4, // Danger style (for removing a game)
                                    label: "Cancel",
                                    custom_id: "cancel-thread"
                                }
                            ],
                        },
                    ],
                },
            };
        } else {
            const title = "No games found";
            const description = `I couldn't find any games, please add one first using the \`/manage-games\` command.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
            cancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 4, // Danger style (for removing a game)
                                    label: "Cancel",
                                    custom_id: "cancel-thread"
                                }
                            ],
                        },
                    ],
                },
            };
        }

    } catch (error) {
        logger.error("Something went wrong while fetching the games", error);
        const title = "Error";
        const description = `Something went wrong, please try again later or contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

async function handleUpdateGameNameButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    user_exchange_data.name = "update-game-description";
    // Store the updated object back into userExchangeData
    userExchangeData.set(interaction.member.user.id, user_exchange_data);


    const title = `Update Game`;
    const description = `Please reply with the new description of your game for **${user_exchange_data.game.name}**, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.game.description ? `\n\nCurrent game description: **${user_exchange_data.game.description}**` : `\n\nYou currently don't have any description set for this game.`); // Append current_game_description only if it's not empty
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
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
        }
    };
}

async function handleUpdateGameDescriptionButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    try {
        if (user_exchange_data.new_game_name) {
            const updatedGame = await Games.findOneAndUpdate(
                { _id: user_exchange_data.game._id },
                { name: user_exchange_data.new_game_name },
                { new: true } // Option to return the updated document
            );
    
            if(updatedGame) {
                const title = `Update Game`;
                const description = `Game **${user_exchange_data.game.name}** has been updated with:\n\nName: **${user_exchange_data.new_game_name}**.`;
                const color = ""; // Changed to hex code for red
                const embed = createEmbed(title, description, color);

                userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
                cancelThread(interaction, client);
            
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        embeds: [embed],
                    }
                };

            } else {
                throw new Error("Couldn't update game to database");
            }
        } else {
            const title = `Update Game Error`;
            const description = `You need to at least change the name or the description to update the game.`;
            const color = "error"; // Changed to hex code for red
            const embed = createEmbed(title, description, color);
            
            userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
            cancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                }
            };
        }

        

    } catch (error) {
        logger.error("Error Updating Game To Database:", error);

        const title = `Update Game Error`;
        const description = `Couldn't update game, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
        
        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            }
        };
    }
}

module.exports = { handleAddGameNameButton, handleAddGameWithoutDescriptionButton, handleManageGamesButton, handleUpdateGameNameButton, handleUpdateGameDescriptionButton };