const { PermissionsBitField } = require("discord.js");
const JoinLeaveConfig = require("../models/join-leave-config");
const createEmbed = require("../helpers/embed");

async function handleJoinLeaveMessage(client, message, userId) {
  const { guild } = message;

  const member = await guild.members.fetch(userId).catch(() => null);
  await message.delete().catch(() => {});
  if (!member) {
    return message.reply({
      embeds: [createEmbed("Error", "User not found in this server.", "error")],
    });
  }

  const config = await JoinLeaveConfig.findOne({ guild_id: guild.id });
  if (!config) {
    const embed = createEmbed("Error", `Join/Leave config not found.`, "error");
    return message.reply({ embeds: [embed] });
  }

  const mainChannel = guild.channels.cache.get(config.channel);
  const secondaryChannel = config.channel2
    ? guild.channels.cache.get(config.channel2)
    : null;
  const thirdChannel = config.channel3
    ? guild.channels.cache.get(config.channel3)
    : null;

  if (!mainChannel) {
    const embed = createEmbed(
      "Error",
      `Configured channel not found.`,
      "error"
    );
    return message.reply({ embeds: [embed] });
  }

  try {
    const hasMainView = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.ViewChannel);
    const hasMainSend = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.SendMessages);

    const hasSecondaryView = secondaryChannel
      ? member
          .permissionsIn(secondaryChannel)
          .has(PermissionsBitField.Flags.ViewChannel)
      : false;
    const hasSecondarySend = secondaryChannel
      ? member
          .permissionsIn(secondaryChannel)
          .has(PermissionsBitField.Flags.SendMessages)
      : false;

    const hasThirdView = thirdChannel
      ? member
          .permissionsIn(thirdChannel)
          .has(PermissionsBitField.Flags.ViewChannel)
      : false;
    const hasThirdSend = thirdChannel
      ? member
          .permissionsIn(thirdChannel)
          .has(PermissionsBitField.Flags.SendMessages)
      : false;

    const shouldRevoke = hasMainView && hasMainSend;

    await mainChannel.permissionOverwrites.edit(member, {
      ViewChannel: !shouldRevoke,
      SendMessages: !shouldRevoke,
    });

    if (secondaryChannel) {
      await secondaryChannel.permissionOverwrites.edit(member, {
        ViewChannel: !shouldRevoke,
        SendMessages: !shouldRevoke,
      });
    }

    if (thirdChannel) {
      await thirdChannel.permissionOverwrites.edit(member, {
        ViewChannel: !shouldRevoke,
        SendMessages: !shouldRevoke,
      });
    }

    const embed = createEmbed(
      "Success",
      shouldRevoke
        ? `Noooo <@${member.id}> has left.\nAccess to <#${mainChannel.id}>${
            secondaryChannel ? `, <#${secondaryChannel.id}>` : ""
          }${
            thirdChannel ? `, and <#${thirdChannel.id}>` : ""
          } has been **revoked** for <@${member.id}>.`
        : `Yaaay <@${member.id}> is back!\n<@${
            member.id
          }> now has access to <#${mainChannel.id}>${
            secondaryChannel ? `, <#${secondaryChannel.id}>` : ""
          }${thirdChannel ? `, and <#${thirdChannel.id}>` : ""}.`,
      ""
    );

    await mainChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error handling Join/Leave via message:", error);
    const embed = createEmbed(
      "Error",
      "Something went wrong while updating permissions.",
      "error"
    );
    await message.reply({ embeds: [embed] });
  }
}

module.exports = handleJoinLeaveMessage;
