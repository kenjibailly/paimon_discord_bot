const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const { EmbedBuilder } = require('discord.js');
const Teams = require('../models/teams');
const Events = require('../models/events');
const TeamAssignments = require('../models/team-assignments');

async function handleJoinTeamButton(interaction, client) {
    const customIdParts = interaction.data.custom_id.split(':');
    const customId = customIdParts[0];
    const eventId = customIdParts[1];
    try {
        const user = interaction.member.user;

        // Fetch the event by its ID
        const event = await Events.findOne({ _id: eventId });

        if (!event) {
            throw new Error('Event not found.');
        }

        const dateNow = new Date();

        // Calculate the expiration time by adding the event.expiration (in hours) to the event.date
        const eventCreationDate = event.date; // Ensure it's a Date object
        const eventDurationInMilliseconds = event.expiration * 60 * 60 * 1000; // Convert hours to milliseconds
        const eventExpirationTime = new Date(eventCreationDate.getTime() + eventDurationInMilliseconds);

        // Check if the current time is past the event expiration time
        if (dateNow > eventExpirationTime) {
            // Event application period is over
            const title = "Join Event Error";
            const description = `The application period for this event is over, please contact the game master if you still want to join.`;
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

        

        const teams = await Teams.find({ guild_id: interaction.guild_id });

        // Validate that both teams are provided
        if (teams.team_1 === null || teams.team_2 === null) {
            const title = "No teams found";
            const description = "Please contact your staff to set the teams with the `/set-teams` command.";
            const color = "#ff0000";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }

        // First, check if the user has already applied
        const existingApplication = await TeamAssignments.findOne({
            guild_id: interaction.guild_id,
            event_id: eventId,
            user: user.id,
        });

        if (existingApplication) {
            // If the application already exists, return a message indicating the user has already applied
            const title = "Join Event Error";
            const description = `You have already applied for this event.`;
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

        // If no existing application, proceed with saving a new one
        const newUserApplication = new TeamAssignments({
            guild_id: interaction.guild_id,
            event_id: eventId,
            user: user.id,
        });

        const savedUserApplication = await newUserApplication.save();

        if (!savedUserApplication) {
            // If the result is falsy, throw an error
            throw new Error('User application could not be saved.');
        }

        await updateEmbedWithNewMember(interaction, client, user);
        

        const title = "Event Application Success";
        const description = `You have successfully applied to join a team for this event, please wait for the team generation to happen.`;
        const color = "";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };

    } catch (error) {
        console.log("Join Event Error: " + error);
        const title = "Join Event Error";
        const description = `You could not join the event at this time, please try again later or contact the administrator.`;
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

}


async function updateEmbedWithNewMember(interaction, client, user) {
    try {
        const channel = await client.channels.fetch(interaction.channel.id); // Fetch the channel
        const message = await channel.messages.fetch(interaction.message.id); // Fetch the message

        // Check if the message has embeds
        if (!message.embeds || message.embeds.length === 0) {
            throw new Error('No embeds found in the message.');
        }

        // Clone the existing embed if available
        const embed = new EmbedBuilder(message.embeds[0].toJSON());

        // Find the "Applied Members" field if it exists
        let appliedMembersField = embed.data.fields.find(field => field.name === 'Applied Members');

        if (appliedMembersField) {
            // Append new member to the existing list
            appliedMembersField.value += `\n- **${user.global_name}**`;
        } else {
            // Create new field for Applied Members
            embed.addFields({ name: 'Applied Members', value: `- **${user.global_name}**` });
        }

        // Edit the message with the updated embed
        await message.edit({ embeds: [embed] });

        return;
    } catch (error) {
        console.error('Error updating embed:', error);
    }
}

module.exports = handleJoinTeamButton;