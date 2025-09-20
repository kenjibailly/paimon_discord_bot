const createEmbed = require("../../../helpers/embed");
const userExchangeData = require("../../../helpers/userExchangeData");
const cancelThread = require("../../../helpers/cancel-thread");
const AwardedReward = require("../../../models/awarded-reward");

async function handleChangeNickname(name, interaction, client) {
  const title = "Shop";
  let description;
  if (name == "change-user-nickname") {
    description =
      `Reply with the tagged user who's nickname you want to change.\n` +
      `\`\`\`@user_name\`\`\``;
  } else {
    const existingAwardedReward = await AwardedReward.findOne({
      guild_id: interaction.guildId,
      awarded_user_id: interaction.user.id,
      $or: [
        { reward: "change-user-nickname" },
        { reward: "change-own-nickname" },
      ],
    });

    if (existingAwardedReward) {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (existingAwardedReward.date > twentyFourHoursAgo) {
        // Send message
        const title = "Shop";
        const description = `It hasn't been 24h yet since your nickname has been changed, please try again later.`;
        const embed = createEmbed(title, description, "");
        await interaction.editReply({
          content: "",
          embeds: [embed],
          components: [],
        });

        await cancelThread(interaction, client);
        return;
      }
    }
    description = `Reply with desired new nickname.`;
  }
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
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
    flags: 64,
  });
}

module.exports = handleChangeNickname;
