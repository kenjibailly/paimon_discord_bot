const createEmbed = require('../../../helpers/embed');
const userExchangeData = require('../../../helpers/userExchangeData');

async function handleCustomEmoji(name, interaction) {
    const title = "Shop";
    const description = "Reply with an upload of a picture or gif and the name of your emoji to create your custom emoji.";
    const embed = createEmbed(title, description, "");

    // Store interaction data for the specific user
    userExchangeData.set(interaction.member.user.id, {
        threadId: interaction.channelId,
        name: name,
    });

    await interaction.editReply({
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
    });

}

module.exports = handleCustomEmoji;