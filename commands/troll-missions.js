const { InteractionResponseType } = require('discord-interactions');
const TrollMissions = require('../models/troll-missions');
const createEmbed = require('../helpers/embed');


async function handleTrollMissionsCommand(interaction, client) {
    const { guild_id } = interaction;
    try {
        let troll_missions_list = "";
        const troll_missions = await TrollMissions.find({guild_id: guild_id });

        if(troll_missions.length === 0) {
            const title = "Troll Missions";
            const description = `I couldn't find any troll missions.`;
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

        troll_missions.forEach(troll_mission => {
            if (troll_mission.description) {
                troll_missions_list += `- Name: **${troll_mission.name}**\n Description: **${troll_mission.description}**\n\n`;
            } else {
                troll_missions_list += `- Name: **${troll_mission.name}**\n\n`;
            }
            
        });

        const title = "Troll Missions";
        const description = `These are all the troll missions:\n\n ${troll_missions_list}`;
        const embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };

    } catch (error) {
        logger.error('Troll Missions error: ' + error);

        const title = "Troll Missions Error";
        const description = `Something went wrong while trying to get the troll missions list, please contact the administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        }
    }
}

module.exports = handleTrollMissionsCommand;