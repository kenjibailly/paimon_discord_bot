const TrollMissions = require('../models/troll-missions');
const createEmbed = require('../helpers/embed');


async function handleTrollMissionsCommand(interaction, client) {
    const { guildId } = interaction;
    try {
        const troll_missions = await TrollMissions.find({guild_id: guildId });

        if(troll_missions.length === 0) {
            const title = "Troll Missions";
            const description = `I couldn't find any troll missions.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }


        const troll_missions_list = [];
        troll_missions.forEach(troll_mission => {
            // Create a field for each troll_mission
            troll_missions_list.push({
                name: troll_mission.name,
                value: troll_mission.description ? troll_mission.description : "No description available",
                inline: false // You can set this to `true` to display fields inline
            });
        });
        
        const title = "Troll Missions";
        const description = "These are all the troll missions:\n\u200B\n";
        const embed = createEmbed(title, description, "");
        embed.addFields(troll_missions_list); // Add the fields to the embed
        
        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        logger.error('Troll Missions error: ', error);

        const title = "Troll Missions Error";
        const description = `Something went wrong while trying to get the troll missions list, please contact the administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = handleTrollMissionsCommand;