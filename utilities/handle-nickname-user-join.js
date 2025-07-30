const AwardedUser = require("../models/awarded-reward");
const checkPermissions = require("../helpers/check-permissions");

async function handleNicknameUserJoin(member) {
  try {
    const awarded_user = await AwardedUser.findOne({
      guild_id: member.guild.id,
      awarded_user_id: member.id,
      reward: "change-user-nickname",
    });

    if (awarded_user) {
      // Change nickname if not the owner
      await member.setNickname(awarded_user.value);
      logger.success(`Assigned nickname to ${member.user.tag}`);
    }
  } catch (error) {
    console.error("Error handling nickname user join:", error);
  }
}

module.exports = handleNicknameUserJoin;
