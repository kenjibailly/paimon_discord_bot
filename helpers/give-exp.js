const Levels = require("../models/levels");
const LevelConfig = require("../models/level-config");
const Wallet = require("../models/wallet");
const { handleLevelCommand, calculateExp } = require("../commands/level");

async function giveExp(user_id, channelId, guildId, client) {
  const config = await LevelConfig.findOne({ guild_id: guildId });
  if (!config) return;
  if (config.ignored_channels.includes(channelId)) return;

  try {
    // Increment message count
    const update = await Levels.findOneAndUpdate(
      { guild_id: guildId, user_id: user_id },
      { $inc: { message_count: 1 } },
      { new: true, upsert: true }
    );

    const { exp_percentage, level } = calculateExp(
      update.message_count,
      config
    );

    // Handle level up (logic already in place)
    if (exp_percentage === 0) {
      handleLevelCommand("", client, user_id, "", guildId);
    }

    // Reward logic
    const rewardInterval = config.reward;
    const extraInterval = config.reward_extra;

    if (
      (rewardInterval && rewardInterval > 0 && level % rewardInterval === 0) ||
      (extraInterval && extraInterval > 0 && level % extraInterval === 0)
    ) {
      const walletUpdate = {};
      if (
        rewardInterval &&
        rewardInterval > 0 &&
        level % rewardInterval === 0
      ) {
        walletUpdate.amount = 1;
      }
      if (extraInterval && extraInterval > 0 && level % extraInterval === 0) {
        walletUpdate.extra_amount = 1;
      }

      // Apply wallet updates
      if (Object.keys(walletUpdate).length > 0) {
        await Wallet.updateOne(
          { guild_id: guildId, user_id: user_id },
          { $inc: walletUpdate },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error("Failed to process voice EXP:", error);
  }
}

module.exports = giveExp;
