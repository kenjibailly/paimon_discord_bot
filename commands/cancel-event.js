const Events = require('../models/events');
const Teams = require('../models/teams');
const TeamAssignments = require('../models/team-assignments');
const createEmbed = require('../helpers/embed');
const getBotChannel = require('../helpers/get-bot-channel');

async function handleCancelEventCommand(interaction, client) {
    const { guildId } = interaction;

    try {
        const event = await Events.findOneAndDelete({ guild_id: guildId });
        const removeTeamAssignments = await TeamAssignments.deleteMany({ guild_id: guildId });
        await resetTeams(client, guildId);

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

        const bot_channel = await getBotChannel(guildId);
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
            const events = await Events.find({ guild_id: guildId });
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
    
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        logger.error("Error Canceling Event:", error);

        const title = "Event Cancel Error";
        const description = `Event couldn't be canceled, please contact the administrator or try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    }
}

async function resetTeams(client, guildId) {
    try {
        const teams = await Teams.findOne({ guild_id: guildId });

        if (teams) {
            const guild = await client.guilds.fetch(guildId);
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