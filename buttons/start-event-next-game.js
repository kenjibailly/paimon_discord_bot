const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const Events = require('../models/events');
const NextGames = require('../models/next-games');
const Games = require('../models/games');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('./cancel-thread');

async function handleStartEventNextGameButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    const next_game = await NextGames.findOne({ guild_id: interaction.guild_id }).sort({ date: 1 });
    const game = await Games.findById(next_game.game_id);

    let newEvent;
    try {
        newEvent = new Events({
            guild_id: interaction.guild_id,
            channel_id: user_exchange_data.channel_id,
            name: user_exchange_data.event_name,
            description: user_exchange_data.event_description,
            game: game._id,
            expiration: user_exchange_data.expiration,
            color: user_exchange_data.color,
        });
        const savedEvent = await newEvent.save();

        if (!savedEvent) {
            // If the result is falsy, throw an error
            throw new Error('New event could not be saved.');
        }

    } catch (error) {
        logger.error("Add Event Error:", error);
        const title = "Add Event Error";
        const description = `I could not add the event to the database. Please contact your administrator, or try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        // Send a confirmation message before closing the thread
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };

    }

    const eventTitle = user_exchange_data.event_name || 'Event Started!';
    const eventDescription = user_exchange_data.event_description || 'No description provided';
    const eventColor = user_exchange_data.color;
    const embedEvent = createEmbed(eventTitle, eventDescription, eventColor);
    embedEvent.setImage(user_exchange_data.image || undefined);
    embedEvent.addFields([
        { name: "Game", value: game.name, inline: true },
        { name: 'Game Description', value: game.description ? game.description : 'No description', inline: true }
    ]);

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

module.exports = handleStartEventNextGameButton;