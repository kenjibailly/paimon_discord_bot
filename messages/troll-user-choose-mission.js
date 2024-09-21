const { InteractionResponseType } = require('discord-interactions');
const validateNumber = require('../helpers/validate-number');
const TrollMissions = require('../models/troll-missions');
const TrolledUser = require('../models/trolled-users');
const createEmbed = require("../helpers/embed");

async function handleTrollUserChooseMission (message, client, trolledUser) {
    const messageContent = message.content;

    let troll_missions;
    try {
        troll_missions = await TrollMissions.find({guild_id: trolledUser.guild_id});
    } catch (error) {
        const title = "Troll Mission Error";
        const description = `Something went wrong, please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        // Send a confirmation message before closing the thread
        await message.channel.send({
            embeds: [embed],
        });
        return;
    }

    const validationError = validateNumber(messageContent, troll_missions);

    if (validationError) {
        logger.error("Validation Error:", validationError);
        // Send a confirmation message before closing the thread
        const title = `Input Error`;
        const description = `${validationError}\nPlease try again.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }


    try {
        await TrolledUser.findOneAndUpdate(
            { user_id: trolledUser.user_id },
            { mission_id: troll_missions[Number(messageContent) - 1]._id }
        );
    } catch (error) {
        const title = "Troll Mission Error";
        const description = `Something went wrong, please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        // Send a confirmation message before closing the thread
        await message.channel.send({
            embeds: [embed],
        });
        return;
    }

    const title = "Troll Mission";
    const description = `You have chosen mission:\n\n` + 
    `Name: **${troll_missions[Number(messageContent) - 1].name}**\n` + 
    `Description: **${troll_missions[Number(messageContent) - 1].description}**\n\n` +
    `Please reply with the completion of your mission, whether it is a message, picture or attachment.\n` + 
    `The staff will then decide whether or not to accept your completion and give you back access to the server.`;
    const color = "";
    const embed = createEmbed(title, description, color);
    // Send a confirmation message before closing the thread
    await message.channel.send({
        embeds: [embed],
    });
}

module.exports = handleTrollUserChooseMission;