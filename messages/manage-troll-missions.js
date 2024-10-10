const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('../helpers/cancel-thread');
const TrollMissions = require('../models/troll-missions');
const validateNumber = require('../helpers/validate-number');

async function handleManageTrollMissions(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    if (user_exchange_data.action !== "update-troll-mission" && user_exchange_data.action !== "remove-troll-mission") {
        return;
    }    

    const messageContent = message.content;
    const validationError = validateNumber(messageContent, user_exchange_data.troll_missions);

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

    if (user_exchange_data.action == "update-troll-mission") {
        const title = "Update Troll Mission";
        const description = `Update Troll Mission Name: **${user_exchange_data.troll_missions[Number(messageContent) - 1].name}**\n\nPlease reply with the new name of your troll mission, if you don't want to change it press the ✅ button. We will then proceed to change the description.`
        const color = "";
        const embed = createEmbed(title, description, color);
        // Send a confirmation message before closing the thread
        await message.channel.send({
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 3, // Green style
                            label: "Proceed",
                            emoji: { name: "✅" },
                            custom_id: "update-troll-mission-name"
                        },
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a troll mission)
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ],
                },
            ],
        });


        user_exchange_data.name = "update-troll-mission-name";
        user_exchange_data.troll_mission = user_exchange_data.troll_missions[Number(messageContent) - 1];
        delete user_exchange_data.action;
        delete user_exchange_data.troll_missions;
        // Store the updated object back into userExchangeData
        userExchangeData.set(message.author.id, user_exchange_data);
        return;
    } else if (user_exchange_data.action == "remove-troll-mission") {
        const trollMissionRemoved = await removeTrollMission(user_exchange_data.troll_missions[Number(messageContent) - 1], client, message);
        if(trollMissionRemoved) {
            userExchangeData.delete(message.author.id); // Remove the user's data entirely
            cancelThread(message.guildId, message.channelId, client);
        }
        return;
    }
}

async function handleAddTrollMissionName (message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    const messageContent = message.content;

    user_exchange_data.name = "add-troll-mission-description";
    user_exchange_data.new_troll_mission_name = messageContent;
    // Store the updated object back into userExchangeData
    userExchangeData.set(message.author.id, user_exchange_data);

    const title = "Add Troll Mission";
    const description = `Please reply with the new description of your troll mission. If you don't want to add a description press the ✅ button`;
    const color = "";
    const embed = createEmbed(title, description, color);
    // Send a confirmation message before closing the thread
    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 3, // Green style
                        label: "Proceed",
                        emoji: { name: "✅" },
                        custom_id: "add-troll-mission-without-description"
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger style (for removing a troll mission)
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ],
            },
        ],
    });
}

async function handleAddTrollMissionDescription (message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);

    const messageContent = message.content;

    try {
        const newTrollMission = new TrollMissions({
            guild_id: message.guildId,
            name: user_exchange_data.new_troll_mission_name,
            description: messageContent,
        });
        await newTrollMission.save();
    } catch (error) {
        logger.error("Error Adding Troll Mission To Database:", error);

        const title = `Add Troll Mission Error`;
        const description = `Couldn't add troll mission, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
    
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
    }


    const title = `Add Troll Mission`;
    const description = `New troll mission added:\n` +
    `Name: **${user_exchange_data.new_troll_mission_name}**\n` +
    `Description: **${messageContent}**.\n\n`;
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
        embeds: [embed],
    });

    userExchangeData.delete(message.author.id); // Remove the user's data entirely
    cancelThread(message.guildId, message.channelId, client);
}

async function removeTrollMission(troll_mission, client, message) {
    try {
        const deletedTrollMission = await TrollMissions.findByIdAndDelete(troll_mission._id);
            // Check if the troll mission was deleted
        if (deletedTrollMission) {
            // Troll mission was successfully deleted
            const title = `Troll Mission Removed`;
            const description = `The troll mission "**${troll_mission.name}**" has been successfully removed.`;
            const color = "";
            const embed = createEmbed(title, description, color);

            await message.channel.send({
                embeds: [embed],
            });
            return true;
        } else {
            throw new Error("Database error, can't delete troll mission.");
        }

    } catch (error) {
        logger.error("Remove Troll Mission Error:", error);
        // Send a confirmation message before closing the thread
        const title = `Remove Troll Mission Error`;
        const description = `I could not remove the troll mission, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
        return false;
    }

}


async function handleUpdateTrollMissionName(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "update-troll-mission-name") {
        return;
    }

    const messageContent = message.content;

    user_exchange_data.name = "update-troll-mission-description";
    user_exchange_data.new_troll_mission_name = messageContent;
    // Store the updated object back into userExchangeData
    userExchangeData.set(message.author.id, user_exchange_data);


    const title = `Update Troll Mission`;
    const description = `New name: **${messageContent}** for **${user_exchange_data.troll_mission.name}**.\n\n` +
    `Please reply with the new description of your troll mission, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.troll_mission.description ? `\n\nCurrent troll mission description: **${user_exchange_data.troll_mission.description}**` : `\n\nYou currently don't have any description set for this troll mission.`); // Append current_troll_mission_description only if it's not empty
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 3, // Green style
                        label: "Proceed",
                        emoji: { name: "✅" },
                        custom_id: "update-troll-mission-description"
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger style (for removing a troll mission)
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ],
            },
        ],
    });
    return;
}


async function handleUpdateTrollMissionDescription(message, client) {
    const user_exchange_data = userExchangeData.get(message.author.id);
    if (user_exchange_data.name !== "update-troll-mission-description") {
        return;
    }

    const new_troll_mission_description = message.content;

    try {

        // Construct the update object conditionally
        const updateFields = { description: new_troll_mission_description }; // Always update description

        // Only include name if it exists in user_exchange_data
        if (user_exchange_data.new_troll_mission_name) {
            updateFields.name = user_exchange_data.new_troll_mission_name;
        }

        const updatedTrollMission = await TrollMissions.findOneAndUpdate(
            { _id: user_exchange_data.troll_mission._id },
            updateFields,
            { new: true } // Option to return the updated document
        );

        if(updatedTrollMission) {
            const title = `Update Troll Mission`;
            // Start with the base description
            let description = `Troll Mission **${user_exchange_data.troll_mission.name}** has been updated with:\n\n`;

            // Conditionally add the name if it exists
            if (user_exchange_data.new_troll_mission_name) {
                description += `Name: **${user_exchange_data.new_troll_mission_name}**\n`;
            }

            // Always include the description
            description += `Description: **${new_troll_mission_description}**.`;
            const color = ""; // Changed to hex code for red
            const embed = createEmbed(title, description, color);
        
            await message.channel.send({
                embeds: [embed],
            });

            userExchangeData.delete(message.author.id); // Remove the user's data entirely
            cancelThread(message.guildId, message.channelId, client);
        } else {
            throw new Error("Couldn't update troll mission to database");
        }

    } catch (error) {
        logger.error("Error Updating Troll Mission To Database:", error);

        const title = `Update Troll Mission Error`;
        const description = `Couldn't update troll mission, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
    
        await message.channel.send({
            embeds: [embed],
        });

        userExchangeData.delete(message.author.id); // Remove the user's data entirely
        cancelThread(message.guildId, message.channelId, client);
    }

    return;
}

module.exports = { handleManageTrollMissions, handleAddTrollMissionName, handleAddTrollMissionDescription, handleUpdateTrollMissionName, handleUpdateTrollMissionDescription };