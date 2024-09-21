const { InteractionResponseType } = require('discord-interactions');
const commandHandlers = require('../commands');
const buttonHandlers = require('../buttons');
const messageHandlers = require('../messages');
const createEmbed = require("../helpers/embed");
const userExchangeData = require('../helpers/userExchangeData');
const trolledUserCache = require('../helpers/trolled-user-cache');
const TrolledUser = require('../models/trolled-users');
const handleTrollUserChooseMission = require('../messages/troll-user-choose-mission');

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
    const userId = message.author.id;

    if (userExchangeData.has(userId) && message.channelId === userExchangeData.get(userId).threadId) {
        if (userExchangeData.get(userId).name) {
            return messageHandlers[userExchangeData.get(userId).name](message, client);
        }
    }

    // Check cache for trolled users without mission_id
    const trolledUser = trolledUserCache.get(userId);
    if (trolledUser && message.channelId === trolledUser.channel_id) {
        return handleTrollUserChooseMission(message, client, trolledUser);
    }
}

module.exports = { handleSlashCommand, handleButtonClicks, handleMessageReplies};