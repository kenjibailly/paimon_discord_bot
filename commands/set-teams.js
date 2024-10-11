const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');


async function handleSetTeamsCommand(interaction, client) {
    const { guildId } = interaction;

    // Find each option by name
    const team_1 = interaction.options.getRole('team_1');
    const team_2 = interaction.options.getRole('team_2');

    // Validate that both teams are provided
    if (team_1 === null || team_2 === null) {
        const title = "Invalid Input";
        const description = "Both team roles must be provided.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {
        // Prepare the update object
        const update = {
            team_1: team_1,
            team_2: team_2,
        };

        // Upsert operation: find one by guild_id and update it, or create if not exists
        const result = await Teams.findOneAndUpdate(
            { guild_id: guildId },
            update,
            { upsert: true, new: true } // Create if not exists, return the updated document
        );

        const description = `Teams have been set or updated successfully:\n` +
                            `**Team 1:** <@&${result.team_1}>\n` +
                            `**Team 2:** <@&${result.team_2}>`;

        const title = "Teams Updated";
        const color = "";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });


    } catch (error) {
        logger.error('Error updating teams:', error);

        const title = "Error";
        const description = `An error occurred while updating the teams. Please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });

    }
}

module.exports = handleSetTeamsCommand;