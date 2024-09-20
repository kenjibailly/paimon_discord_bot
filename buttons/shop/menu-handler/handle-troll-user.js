const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../../helpers/embed');
const userExchangeData = require('../../../helpers/userExchangeData');
const consoleColors = require('../../../helpers/console-colors');

async function handleTrollUser(name, interaction) {
    console.log(consoleColors("red"), 'This text is green');
    const title = "Shop";
    const description = `Reply with the tagged user who's nickname you want to change. 
    \`\`\`@user_name\`\`\``;
    const embed = createEmbed(title, description, "");

    // Store interaction data for the specific user
    userExchangeData.set(interaction.member.user.id, {
        threadId: interaction.channel_id,
        name: name,
    });

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 4,
                            label: "Cancel",
                            custom_id: "cancel-thread"
                        }
                    ]
                }
            ],
            flags: 64,
        },
    };

}

module.exports = handleTrollUser;