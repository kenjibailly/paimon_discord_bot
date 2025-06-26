const createEmbed = require("../../../helpers/embed");
const AwardedReward = require("../../../models/awarded-reward");
const checkRequiredBalance = require("../../../helpers/check-required-balance");
const handleCancelThread = require("../../cancel-thread");
const userExchangeData = require("../../../helpers/userExchangeData");
const checkPermissions = require("../../../helpers/check-permissions");

async function handleExchangeChangeNicknameButton(interaction, client) {
  try {
    const user_exchange_data = userExchangeData.get(interaction.member.user.id);
    userExchangeData.delete(interaction.member.user.id);

    const guild = await client.guilds.fetch(interaction.guildId);
    const thread = await guild.channels.fetch(interaction.channelId);

    const wallet = await checkRequiredBalance(
      interaction,
      client,
      user_exchange_data.rewardPrice,
      thread
    );
    if (!wallet) {
      return;
    }

    // Check bot permissions
    const permissionCheck = await checkPermissions(
      interaction,
      client,
      "MANAGE_NICKNAMES",
      guild
    );
    if (permissionCheck) {
      await interaction.editReply({ embeds: [permissionCheck] });
      handleCancelThread(interaction, client);
      return;
    }

    // Fetch member who's nickname should be changed
    let member;
    if (user_exchange_data.taggedUser) {
      member = await guild.members.fetch(user_exchange_data.taggedUser);
    } else {
      member = await guild.members.fetch(interaction.member.user.id);
    }

    // Check if the member is the server owner
    if (member.id === guild.ownerId) {
      // Can't change owner's nickname, send DM to owner instead
      const owner = await guild.fetchOwner();
      try {
        let title = "Change Nickname";
        let description = `A nickname change was requested for you: \`\`\`${user_exchange_data.nickname}\`\`\`However, bots can't change the server owner's nickname. Please update it manually.`;
        const color = "";
        let embed = createEmbed(title, description, color);
        await owner.send({
          embeds: [embed],
        });

        title = "Shop";
        description =
          "The user is the server owner. I've sent them a DM requesting the nickname change.";
        embed = createEmbed(title, description, color);
        await interaction.editReply({
          embeds: [embed],
          components: [], // Ensure this is an empty array
        });
      } catch (error) {
        const title = "Error";
        const description =
          "The user is the server owner, and I couldn't send them a DM.";
        const color = "";
        const embed = createEmbed(title, description, color);

        console.error("Failed to send DM to the server owner:", error);
        await interaction.editReply({
          embeds: [embed],
          components: [], // Ensure this is an empty array
        });
      }
    } else {
      // Change nickname if not the owner
      await member.setNickname(user_exchange_data.nickname);
    }

    try {
      // Deduct from the wallet
      wallet.amount -= Number(user_exchange_data.rewardPrice);
      await wallet.save();
    } catch (error) {
      logger.error("Failed to save wallet:", error);

      const title = "Transaction Error";
      const description =
        "There was an error while processing your wallet transaction. Please try again later.";
      const color = "error"; // Assuming you have a color constant for errors
      const embed = createEmbed(title, description, color);
      await interaction.editReply({
        embeds: [embed],
        components: [], // Ensure this is an empty array
      });
      handleCancelThread(interaction, client);
      return;
    }

    try {
      let reward;
      if (user_exchange_data.taggedUser) {
        const reward = "change-user-nickname"; // Example reward value
        const awardedReward = await AwardedReward.findOneAndUpdate(
          {
            guild_id: interaction.guildId,
            awarded_user_id: user_exchange_data.taggedUser,
            reward: { $in: ["change-own-nickname", "change-user-nickname"] }, // Match if reward is in the specified array
          },
          {
            awarded_user_id: user_exchange_data.taggedUser,
            user_id: interaction.member.user.id,
            value: user_exchange_data.nickname,
            reward: reward,
            date: new Date(),
          },
          {
            upsert: true, // Create a new document if one doesn't exist
            new: true, // Return the updated document
            setDefaultsOnInsert: true, // Apply default values on insert if defined
          }
        );

        if (!awardedReward) {
          let title = "Reward Database Error";
          let description = `I could not not find the reward to be awarded. Please contact the administrator.`;
          const color = "error";
          const embed = createEmbed(title, description, color);
          await interaction.editReply({
            embeds: [embed],
            components: [], // Ensure this is an empty array
          });
          handleCancelThread(interaction, client);
          return;
        }
      } else {
        const reward = "change-own-nickname"; // Example reward value

        const awardedReward = await AwardedReward.findOneAndUpdate(
          {
            guild_id: interaction.guildId,
            awarded_user_id: interaction.member.user.id,
            reward: { $in: ["change-own-nickname", "change-user-nickname"] }, // Match if reward is in the specified array
          },
          {
            user_id: interaction.member.user.id,
            value: user_exchange_data.nickname,
            reward: reward,
            date: new Date(),
          },
          {
            upsert: true, // Create a new document if one doesn't exist
            new: true, // Return the updated document
            setDefaultsOnInsert: true, // Apply default values on insert if defined
          }
        );

        if (!awardedReward) {
          throw new Error("Could not find add awarded reward to database");
        }
      }
    } catch (error) {
      logger.error("Error adding reward to DB:", error);

      let title = "Reward Database Error";
      let description = `I could not add the reward to the database. Please contact the administrator.`;
      const color = "error";
      const embed = createEmbed(title, description, color);
      f;
      await interaction.editReply({
        embeds: [embed],
        components: [], // Ensure this is an empty array
      });
      handleCancelThread(interaction, client);
      return;
    }

    if (member.id !== guild.ownerId) {
      const title = "Shop";
      const description =
        `**${member.user.globalName}**'s nickname has been changed to **${user_exchange_data.nickname}**.\n` +
        `You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.`;
      const embed = createEmbed(title, description, "");

      // Send success message before canceling the thread message
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    }

    await handleCancelThread(interaction, client);

    // Send message to the parent channel if available
    const parentChannel = thread.parent;
    if (parentChannel) {
      const parentTitle = "Shop";
      let parentDescription;
      // Check if the member is the server owner
      if (member.id === guild.ownerId) {
        parentDescription = `<@${interaction.member.user.id}> has requested **${member.user.globalName}**'s nickname to **${user_exchange_data.nickname}**.`;
      } else {
        parentDescription = user_exchange_data.taggedUser
          ? `<@${interaction.member.user.id}> has changed **${member.user.globalName}**'s nickname to <@${member.user.id}>.`
          : `**${interaction.member.user.globalName}** has changed their nickname to <@${member.user.id}>.`;
      }

      const parentEmbed = createEmbed(parentTitle, parentDescription, "");

      await parentChannel.send({
        embeds: [parentEmbed],
      });
    }
  } catch (nicknameError) {
    logger.error("Error changing nickname:", nicknameError);

    let title = "Nickname Change Error";
    let description = `I could not change the nickname. Your wallet has not been affected.`;

    if (nicknameError.code === 50013) {
      title = "Permission Error";
      description =
        `I don't have permission to change the nickname.\n` +
        `This could be due to role hierarchy issues or you are trying to change the nickname of the server owner.\n` +
        `To change the nickname of the server owner, please contact the server owner.\n` +
        `Your wallet has not been affected.`;
    }

    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({
      embeds: [embed],
      components: [], // Ensure this is an empty array
    });
    handleCancelThread(interaction, client);
  }
}

module.exports = handleExchangeChangeNicknameButton;
