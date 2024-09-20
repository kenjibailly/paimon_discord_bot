const { InteractionResponseType } = require('discord-interactions');
const commandHandlers = require('./commands');
const buttonHandlers = require('./buttons');
const messageHandlers = require('./messages');
const createEmbed = require("./helpers/embed");
const userExchangeData = require('./helpers/userExchangeData');


async function handleSlashCommand(res, client) {
    const { data } = res;
    const { name } = data;

    if (commandHandlers[name]) {
        return commandHandlers[name](res, client);
    } else {
        logger.error(`Unknown command: ${name}`);

        const title = "Unknown Command";
        const description = `I do not know this command.`;
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


async function handleButtonClicks(res, client) {
    const interaction = res;
    const name = interaction.data.custom_id.split(':')[0];

    if (buttonHandlers[name]) {
        return buttonHandlers[name](res, client);
    } else {
        logger.error(`Unknown button: ${name}`);

        const title = "Unknown Button";
        const description = `I do not know this button.`;
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

async function handleMessageReplies(message, client) {

    if (userExchangeData.has(message.author.id) && message.channelId === userExchangeData.get(message.author.id).threadId) {
        if (userExchangeData.get(message.author.id).name) {
            return messageHandlers[userExchangeData.get(message.author.id).name](message, client);
        }
    }
}

module.exports = { handleSlashCommand, handleButtonClicks, handleMessageReplies};