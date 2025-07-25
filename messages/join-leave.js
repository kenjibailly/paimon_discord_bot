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
  if (!mainChannel) {
    const embed = createEmbed(
      "Error",
      `Configured main channel not found.`,
      "error"
    );
    return message.reply({ embeds: [embed] });
  }

  const extraChannelIds = config.other_channels
    ? config.other_channels.split(",").map((id) => id.trim())
    : [];

  const extraChannels = extraChannelIds
    .map((id) => guild.channels.cache.get(id))
    .filter((ch) => ch); // Filter out nulls

  try {
    const hasMainView = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.ViewChannel);
    const hasMainSend = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.SendMessages);

    const shouldRevoke = hasMainView && hasMainSend;

    // Main channel overwrite
    await mainChannel.permissionOverwrites.edit(member, {
      ViewChannel: !shouldRevoke,
      SendMessages: !shouldRevoke,
    });

    // Extra channels overwrite
    for (const channel of extraChannels) {
      await channel.permissionOverwrites.edit(member, {
        ViewChannel: !shouldRevoke,
        SendMessages: !shouldRevoke,
      });
    }

    const channelMentions = [
      `<#${mainChannel.id}>`,
      ...extraChannels.map((ch) => `<#${ch.id}>`),
    ].join(", ");

    const embed = createEmbed(
      "Success",
      shouldRevoke
        ? `Noooo <@${member.id}> has left.\nAccess to ${channelMentions} has been **revoked** for <@${member.id}>.`
        : `Yaaay <@${member.id}> is back!\n<@${member.id}> now has access to ${channelMentions}.`,
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
