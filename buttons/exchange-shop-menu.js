const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');

async function handleExchangeShopMenu(interaction, client) {
    const {data} = interaction;
    const name = data.values[0];

    if (name == "change-own-nickname") {
        const title = "Shop";
        const description = `Reply with your entire new nickname or just reply with an emoji to place it next to your name.`;
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

}

module.exports = handleExchangeShopMenu;
