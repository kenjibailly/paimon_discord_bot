const { InteractionResponseType } = require('discord-interactions');
const Events = require('../models/events');
const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');
const deployCommands = require('../commands/deploy-commands');

async function handleCancelEventCommand(interaction, client) {
    const { data, guild_id } = interaction;

    try {
        const event = await Events.findOneAndDelete({ guild_id: guild_id });
        await resetTeams(client, guild_id);

        const title = "Event Canceled";
        const description = `Event successfully canceled and teams have been reset.`;
        const color = "";
        const embed = createEmbed(title, description, color);

        try {
            const events = await Events.find({ guild_id: guild_id });
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
            const title = "Event Remove Error";
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

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    } catch (error) {
        console.log("Error Canceling Event: " + error);

        const title = "Event Cancel Error";
        const description = `Event couldn't be canceled, please contact the administrator or try again later.`;
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

async function resetTeams(client, guild_id) {
    try {
        const teams = await Teams.findOne({ guild_id: guild_id });

        if (teams) {
            const guild = await client.guilds.fetch(guild_id);
            const members = await guild.members.fetch(); // Fetch all members in the guild

            for (const member of members.values()) {
                if (member.roles.cache.has(teams.team_1)) {
                    await member.roles.remove(teams.team_1); // Remove team_1 role from member
                }
                if (member.roles.cache.has(teams.team_2)) {
                    await member.roles.remove(teams.team_2); // Remove team_2 role from member
                }
            }
        }
        return;
    } catch (error) {
        console.log("Error Reset Teams: " + error);
    }
}

module.exports = handleCancelEventCommand;