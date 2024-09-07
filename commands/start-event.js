const { InteractionResponseType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord-interactions');
const Games = require('../models/games');
const Events = require('../models/events');
const createEmbed = require('../helpers/embed'); // Assuming this is a helper function to create embeds
const { EmbedBuilder } = require('discord.js');
const deployCommands = require('../commands/deploy-commands');

async function handleStartEventCommand(interaction, client) {
    const { data, guild_id } = interaction;

    try {
        const event = await Events.findOne({ guild_id: guild_id });
        if (event) {
            const title = "Error Start Event";
            const description = `You already have an ongoing event, please let it finish or cancel it using the \`/cancel-event\` command.`;
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

        // Find each option by name
        const eventNameOption = data.options.find(opt => opt.name === 'name');
        const eventDescriptionOption = data.options.find(opt => opt.name === 'description');
        const gameOption = data.options.find(opt => opt.name === 'game');
        const imageOption = data.options.find(opt => opt.name === 'image');
        const colorOption = data.options.find(opt => opt.name === 'color');
        const expirationOption = data.options.find(opt => opt.name === 'expiration');

        const event_name = eventNameOption ? eventNameOption.value : null;
        const event_description = eventDescriptionOption ? eventDescriptionOption.value : null;
        const game = gameOption ? gameOption.value : null;
        const image = imageOption ? imageOption.value : null;
        const color = colorOption ? colorOption.value : null;
        const expiration = expirationOption ? expirationOption.value : null;

        // Fetch game details from the database
        let gameDetails;
        if (game) {
            gameDetails = await Games.findOne({ _id: game });
        }

        let color_embed = "#7f2aff";
        if(color) {
            switch (color) {
                case "purple":
                    color_embed = "#7f2aff";
                    break;
                case "red":
                    color_embed = "#ff0000";
                    break;
                case "yellow":
                    color_embed = "#ffb800";
                    break;
                case "green":
                    color_embed = "#47ff00";
                    break;
                case "cyan":
                    color_embed = "#00ffe0";
                    break;
                case "blue":
                    color_embed = "#00b8ff";
                    break;
                case "pink":
                    color_embed = "#ff008f";
                    break;
                default:
                    break;
            }
        }

        let time_generation = 24;
        if(expiration) {
            time_generation = expiration;
        }
        let newEvent;
        try {
            newEvent = new Events({
                guild_id: guild_id,
                channel_id: interaction.channel.id,
                name: event_name,
                description: event_description,
                game: game,
                expiration: time_generation,
                color: color_embed,
            });
            const savedEvent = await newEvent.save();

            const events = await Events.find({ guild_id: guild_id });

            try {
                const list_type = "events";
                if(events){
                    let events_list = [];
                    events.forEach(event => {
                        const event_info = {
                            name: event.name,
                            value: event._id,
                        }
                        events_list.push(event_info);
                    });
                    await deployCommands(client, guild_id, events_list, false, list_type);
                } else {
                    await deployCommands(client, guild_id, events_list, true, list_type);
                }
            } catch (error) {
                console.log("Error Events Registering Commands: " + error);
                const title = "Events Cancel Error";
                const description = `Event couldn't be canceled because of the command register, please contact the administrator or try again later.`;
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

        const gameName = gameDetails ? gameDetails.name : 'Unknown Game';
        const gameDescription = (gameDetails && gameDetails.description) ? gameDetails.description : 'No description available';

        const embed = new EmbedBuilder()
        .setTitle(event_name || 'Event Started!')
        .setDescription(event_description || 'No description provided')
        .setImage(image || undefined)
        .setColor(color_embed); // Customize the color
    
        // Initialize an array to store the fields
        const fields = [];
        
        // Conditionally add the fields
        if (gameName !== "Unknown Game") {
            fields.push({ name: 'Game', value: gameName, inline: true }, { name: 'Game Description', value: gameDescription, inline: true });
        }
        
        // Only add fields if the array is not empty
        if (fields.length > 0) {
            console.log("fields: "+fields);
            embed.addFields(fields);
        }

        const buttonComponent = {
            type: 2, // Button type
            style: 1, // Primary style
            label: "Join Team",
            emoji: {
                name: "⚔️", // Use the name
            },
            custom_id: `join-team:${newEvent._id}`
        };

        // Send the embed with the button to the specified channel
        const response = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                components: [
                    {
                        type: 1, // Action row type
                        components: [buttonComponent] // Add the button component
                    }
                ]
            }
        };

        return response;

    } catch (error) {
        console.error("Error handling start event command:", error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "An error occurred while handling the command.",
                flags: 64, // Ephemeral message
            },
        };
    }
}

module.exports = handleStartEventCommand;