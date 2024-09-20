const { InteractionResponseType } = require('discord-interactions');
const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function handleResetTeamsCommand(interaction, client) {
    const { member, guild_id } = interaction;

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

            const title = "Reset Teams";
            const description = `You have reset the teams succesfully.`;
            const color = "";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
        };
            
        } else {
            const title = "Error Teams";
            const description = `I could not find any teams, please set your teams using the \`/set-teams\` command.`;
            const color = "#FF0000";
            const embed = createEmbed(title, description, color);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }
    } catch (error) {
        console.error(consoleColors("red"), "Error Reset Teams: " + error);
    }
}

module.exports = handleResetTeamsCommand;