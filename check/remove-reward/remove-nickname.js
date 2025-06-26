const createEmbed = require("../../helpers/embed");
const getBotChannel = require("../../helpers/get-bot-channel");
const AwardedReward = require("../../models/awarded-reward");

async function removeNickname(client, reward) {
  try {
    // Check if there's a newer nickname reward still active for this user
    const newerActiveReward = await AwardedReward.findOne({
      guild_id: reward.guild_id,
      awarded_user_id: reward.awarded_user_id,
      reward: { $in: ["change-user-nickname", "change-own-nickname"] },
      _id: { $ne: reward._id }, // exclude this current reward
      date: { $gt: new Date(reward.date) }, // created after this one
    });

    if (newerActiveReward) {
      logger.info(
        `Skipping nickname reset for user ${reward.awarded_user_id} in guild ${reward.guild_id} — newer active reward exists.`
      );
      await AwardedReward.deleteOne({ _id: reward._id }); // remove this expired one
      return;
    }

    // Proceed with nickname reset
    const guild = await client.guilds.fetch(reward.guild_id);
    const member = await guild.members.fetch(reward.awarded_user_id);

    if (!member) {
      //   logger.error(
      //     `Member with ID ${reward.awarded_user_id} not found in guild ${reward.guild_id}.`
      //   );
      return;
    }

    await member.setNickname(null);

    const title = "Award Reset";
    const description = `<@${reward.awarded_user_id}>'s nickname has been reset. **${reward.time} days** have passed.`;
    const color = ""; // set a color if needed
    const embed = createEmbed(title, description, color);

    const bot_channel = await getBotChannel(reward.guild_id);

    if (bot_channel && bot_channel.channel) {
      try {
        const channel = await client.channels.fetch(bot_channel.channel);
        await channel.send({ embeds: [embed] });

        logger.success("Message sent to the bot channel successfully.");
      } catch (error) {
        logger.error("Error sending message to the bot channel:", error);
      }
    } else {
      logger.error("Bot channel not found or not set.");
    }

    // Remove the expired reward from the database
    await AwardedReward.deleteOne({ _id: reward._id });
  } catch (error) {
    logger.error(
      `Error during nickname reset for user ${reward.awarded_user_id}:`,
      error
    );
  }
}

module.exports = removeNickname;
