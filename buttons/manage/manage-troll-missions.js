const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../helpers/embed');
const TrollMissions = require('../../models/troll-missions');
const userExchangeData = require('../../helpers/userExchangeData');
const cancelThread = require('../cancel-thread');


async function handleAddTrollMissionNameButton(interaction, client) {
    // Store interaction data for the specific user
    userExchangeData.set(interaction.member.user.id, {
        threadId: interaction.channel_id,
        name: "add-troll-mission-name",
    });

    const title = `Add Troll Mission`;
    const description = `Please reply with the new name of your troll mission.`;
    const embed = createEmbed(title, description, "");
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 4, // Danger style (for removing a troll mission)
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ],
                },
            ],
        },
    };
}

async function handleAddTrollMissionWithoutDescriptionButton (interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    try {
        const newTrollMission = new TrollMissions({
            guild_id: interaction.guild_id,
            name: user_exchange_data.new_troll_mission_name,
        });
        await newTrollMission.save();
    } catch (error) {
        logger.error("Error Adding Troll Mission To Database:", error);

        const title = `Add Troll Mission Error`;
        const description = `Couldn't add troll mission, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);
    
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }


    const title = `Add Troll Mission`;
    const description = `New troll mission added: \n` +
    `Name: **${user_exchange_data.new_troll_mission_name}**`;
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
    cancelThread(interaction, client);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
        },
    };
}

async function handleManageTrollMissionsButton(interaction, client) {
    try {
        const trollMissions = await TrollMissions.find({ guild_id: interaction.guild_id });
        
        if(trollMissions.length > 0) {
            let troll_missions_list = "";

            trollMissions.forEach((troll_mission, index) => {
                troll_missions_list += `${index + 1}. **${troll_mission.name}**\n`;
            });

            // Store interaction data for the specific user
            userExchangeData.set(interaction.member.user.id, {
                threadId: interaction.channel_id,
                name: "manage-troll-missions",
                action: interaction.data.custom_id,
                troll_missions: trollMissions,
            });
            
            let action;
            if (interaction.data.custom_id == "update-troll-mission") {
                action = "update";
            } else if (interaction.data.custom_id == "remove-troll-mission") {
                action = "remove";
            }

            let capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);

            const title = `${capitalizedAction} Troll Mission`;
            const description = `Please reply with the number next to the troll mission to ${action} that troll mission.\n\n${troll_missions_list}`;
            const embed = createEmbed(title, description, "");
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 4, // Danger style (for removing a troll mission)
                                    label: "Cancel",
                                    custom_id: "cancel-thread"
                                }
                            ],
                        },
                    ],
                },
            };
        } else {
            const title = "No troll missions found";
            const description = `I couldn't find any troll missions, please add one first using the \`/manage-troll-missions\` command.`;
            const color = "error";
            const embed = createEmbed(title, description, color);

            userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
            cancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    components: [
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 4, // Danger style (for removing a troll mission)
                                    label: "Cancel",
                                    custom_id: "cancel-thread"
                                }
                            ],
                        },
                    ],
                },
            };
        }

    } catch (error) {
        logger.error("Something went wrong while fetching the troll missions", error);
        const title = "Error";
        const description = `Something went wrong, please try again later or contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

async function handleUpdateTrollMissionNameButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    user_exchange_data.name = "update-troll-mission-description";
    // Store the updated object back into userExchangeData
    userExchangeData.set(interaction.member.user.id, user_exchange_data);


    const title = `Update Troll Mission`;
    const description = `Please reply with the new description of your troll mission for **${user_exchange_data.troll_mission.name}**, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.troll_mission.description ? `\n\nCurrent troll mission description: **${user_exchange_data.troll_mission.description}**` : `\n\nYou currently don't have any description set for this troll mission.`); // Append current_troll_mission_description only if it's not empty
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
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
        }
    };
}

async function handleUpdateTrollMissionDescriptionButton(interaction, client) {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);

    try {
        if (user_exchange_data.new_troll_mission_name) {
            const updatedTrollMission = await TrollMissions.findOneAndUpdate(
                { _id: user_exchange_data.troll_mission._id },
                { name: user_exchange_data.new_troll_mission_name },
                { new: true } // Option to return the updated document
            );
    
            if(updatedTrollMission) {
                const title = `Update Troll Mission`;
                const description = `TrollMission **${user_exchange_data.troll_mission.name}** has been updated with:\n\nName: **${user_exchange_data.new_troll_mission_name}**.`;
                const color = ""; // Changed to hex code for red
                const embed = createEmbed(title, description, color);

                userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
                cancelThread(interaction, client);
            
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        embeds: [embed],
                    }
                };

            } else {
                throw new Error("Couldn't update troll mission to database");
            }
        } else {
            const title = `Update Troll Mission Error`;
            const description = `You need to at least change the name or the description to update the troll mission.`;
            const color = "error"; // Changed to hex code for red
            const embed = createEmbed(title, description, color);
            
            userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
            cancelThread(interaction, client);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                }
            };
        }

        

    } catch (error) {
        logger.error("Error Updating Troll Mission To Database:", error);

        const title = `Update Troll Mission Error`;
        const description = `Couldn't update troll mission, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);
        
        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            }
        };
    }
}

module.exports = { handleAddTrollMissionNameButton, handleAddTrollMissionWithoutDescriptionButton, handleManageTrollMissionsButton, handleUpdateTrollMissionNameButton, handleUpdateTrollMissionDescriptionButton };