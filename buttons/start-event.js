const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const { EmbedBuilder } = require('discord.js'); 
const Games = require('../models/games');
const Events = require('../models/events');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('./cancel-thread');

async function handleStartEventAddGameButton(interaction, client) {
    try {
        const games = await Games.find({ guild_id: interaction.guild_id });
        
        if(games.length > 0) {
            let games_list = "";

            games.forEach((game, index) => {
                games_list += `${index + 1}. **${game.name}**\n`;
            });

            // Retrieve the existing data
            let existingData = userExchangeData.get(interaction.member.user.id) || {};

            // Update or add new values to the existing data
            userExchangeData.set(interaction.member.user.id, {
                ...existingData, // Spread the existing data to keep it intact
                threadId: interaction.channel_id,
                name: "start-event-choose-game",
                games: existingData.games || games 
            });


            const title = `Start Event`;
            const description = `Please reply with the number next to the game to add that game to your event.\n\n${games_list}`;
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
                    flags: 64,
                },
        };
        } else {
            const title = "No games found";
            const description = `I couldn't find any games, please add one first using the \`/add-game\` command.`;
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
                flags: 64,
            },
        };
    }
}

async function handleStartEventNoGameButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);
    let newEvent;
        try {
            newEvent = new Events({
                guild_id: interaction.guild_id,
                channel_id: user_exchange_data.channel_id,
                name: user_exchange_data.event_name,
                description: user_exchange_data.event_description,
                expiration: user_exchange_data.expiration,
                color: user_exchange_data.color,
            });
            const savedEvent = await newEvent.save();

            if (!savedEvent) {
                // If the result is falsy, throw an error
                throw new Error('New event could not be saved.');
            }

        } catch (error) {
            console.log("Add Event Error: " + error);
            const title = "Add Event Error";
            const description = `I could not add the event to the database. Please contact your administrator, or try again later.`;
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

        const embedEvent = new EmbedBuilder()
        .setTitle(user_exchange_data.event_name || 'Event Started!')
        .setDescription(user_exchange_data.event_description || 'No description provided')
        .setImage(user_exchange_data.image || undefined)
        .setColor(user_exchange_data.color); // Customize the color

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        const channel = await client.channels.fetch(user_exchange_data.channel_id);
        await channel.send(
            { 
                embeds: [embedEvent],
                components: [
                    {
                        type: 1, // Action row type
                        components: [
                            {
                                type: 2, // Button type
                                style: 1, // Primary style
                                label: "Join Team",
                                emoji: {
                                    name: "⚔️", // Use the name
                                },
                                custom_id: `join-team:${newEvent._id}`
                            },
                        ]
                    }
                ]
            }
        );

        const title = "Event Posted";
        const description = `Your event has been posted where you started the \`/start-event\` command.`;
        const color = "";
        const embed = createEmbed(title, description, color);

        // Send the embed with the button to the specified channel
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            }
        };

}

module.exports = { handleStartEventAddGameButton, handleStartEventNoGameButton }