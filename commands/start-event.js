const { InteractionResponseType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord-interactions');
const Events = require('../models/events');
const createEmbed = require('../helpers/embed'); // Assuming this is a helper function to create embeds
const { EmbedBuilder } = require('discord.js');
const userExchangeData = require('../helpers/userExchangeData');
const consoleColors = require('../helpers/console-colors');

async function handleStartEventCommand(interaction, client) {
    const { data, guild_id, channel_id } = interaction;

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
        const imageOption = data.options.find(opt => opt.name === 'image');
        const colorOption = data.options.find(opt => opt.name === 'color');
        const expirationOption = data.options.find(opt => opt.name === 'expiration');

        const event_name = eventNameOption ? eventNameOption.value : null;
        const event_description = eventDescriptionOption ? eventDescriptionOption.value : null;
        const image = imageOption ? imageOption.value : null;
        const color = colorOption ? colorOption.value : null;
        const expiration = expirationOption ? expirationOption.value : null;

        if (image && !isValidImageUrl(image)) {
            // Handle invalid image URL
            const title = "Invalid Image URL";
            const description = "The provided image URL is not valid. Please ensure it ends with .jpg, .jpeg, .png, .gif, .bmp, or .webp.";
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

        let user_exchange_data = {};
        user_exchange_data.channel_id = channel_id;
        user_exchange_data.event_name = event_name;
        user_exchange_data.event_description = event_description;
        user_exchange_data.image = image;
        user_exchange_data.color = color_embed;
        user_exchange_data.expiration = time_generation;
        // Store the updated object back into userExchangeData
        userExchangeData.set(interaction.member.user.id, user_exchange_data);


        const guild = await client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(channel_id);
    
        // Create a private thread that is only visible to the user who clicked the button
        const thread = await channel.threads.create({
            name: `Start Event - ${interaction.member.user.global_name}`, // Ensure you use the correct user property
            autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
            reason: 'User initiated start event interaction',
            invitable: false, // Don't allow other users to join the thread
            type: 12, // Private Thread (only visible to members who are added)
        });
    
        // Add the user who clicked the button to the thread
        await thread.members.add(interaction.member.user.id);
    
        // Post the message in the thread
        let title = "Start Event";
        let description = `Do you want to add an existing game to your event?`;
        let embed = createEmbed(title, description, "");
    
        // Send the message to the thread
        const message = await thread.send({
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 1, // Primary style (for updating a game)
                            label: "Yes",
                            emoji: { name: "✅" }, // Pencil emoji for updating
                            custom_id: "start-event-add-game"
                        },
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a game)
                            label: "No",
                            emoji: { name: "🫸" }, // Trash bin emoji for removing
                            custom_id: "start-event-no-game"
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
        
    
    
        title = "Start Event";
        description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
        embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };


    } catch (error) {
        console.error(consoleColors("red"), "Error handling start event command:", error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "An error occurred while handling the command.",
                flags: 64, // Ephemeral message
            },
        };
    }
}


function isValidImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
}

module.exports = handleStartEventCommand;