const { InteractionResponseType } = require('discord-interactions');
const commandHandlers = require('./commands');

async function handleSlashCommand(res, client) {
    const { data } = res;
    const { name } = data;

    if (commandHandlers[name]) {
        return commandHandlers[name](res, client);
    } else {
        console.error(`Unknown command: ${name}`);

        const title = "Unknown Command";
        const description = `I do not know this command.`;
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

module.exports = handleSlashCommand;