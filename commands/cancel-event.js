const { InteractionResponseType } = require('discord-interactions');
const Events = require('../models/events');
const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');
const getBotChannel = require('../helpers/get-bot-channel');

async function handleCancelEventCommand(interaction, client) {
    const { data, guild_id } = interaction;

    try {
        const event = await Events.findOneAndDelete({ guild_id: guild_id });
        await resetTeams(client, guild_id);

        const title = "Event Canceled";

        let description = `The event below has been canceled:`;
        let color = "error";
        let embed = createEmbed(title, description, color);
        const event_fields = {
            name: event.name,
            value: event.description ? event.description : "No description available",
            inline: false // You can set this to `true` to display fields inline
        };
        embed.addFields(event_fields); // Add the fields to the embed

        const bot_channel = await getBotChannel(guild_id);
        const botChannel = await client.channels.fetch(bot_channel.channel);
        if (botChannel) {
            await botChannel.send({
                embeds: [embed],
            });
        }

        color = "";
        description = `Event successfully canceled and teams have been reset.`;
        embed = createEmbed(title, description, color);

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
            } else {
                throw new Error("Could not find event");
                
            }
        } catch (error) {
            logger.error("Error Finding Event:", error);
            const title = "Event Error";
            const description = `Event could not be cancelled because I could not find any event.`;
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
        logger.error("Error Canceling Event:", error);

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
        logger.error("Error Reset Teams:", error);
    }
}

module.exports = handleCancelEventCommand;