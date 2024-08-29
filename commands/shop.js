const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');

async function handleShopCommand(res, client) {
    const title = "Shop";
    const description = `
Exchange your tokens for the following rewards:
        
- Change your nickname, tip: you can add 1 emoji next to your name
- add custom server emoji
- add custom channel
- change someone's nickname of choice
- choose next game
- add custom role name and color
- add custom soundboard sound
    `;
    const embed = createEmbed(title, description, "");

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
                            style: 1,
                            label: "Exchange",
                            emoji: {
                                name: "🪙",
                            },
                            custom_id: "exchange-shop"
                        }
                    ]
                }
            ]
        },
    };
}

module.exports = handleShopCommand;
