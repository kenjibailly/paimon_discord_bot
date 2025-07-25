const { PermissionsBitField } = require("discord.js");
const JoinLeaveConfig = require("../models/join-leave-config");
const createEmbed = require("../helpers/embed");

async function handleJoinLeaveCommand(interaction) {
  const { guild, member } = interaction;

  // Fetch config from DB
  const config = await JoinLeaveConfig.findOne({ guild_id: guild.id });
  if (!config) {
    const embed = createEmbed("Error", `Join/Leave config not found.`, "error");
    return interaction.editReply({
      embeds: [embed],
      flags: 64,
    });
  }

  const mainChannel = guild.channels.cache.get(config.channel);
  if (!mainChannel) {
    const embed = createEmbed(
      "Error",
      `Configured main channel not found.`,
      "error"
    );
    return interaction.editReply({
      embeds: [embed],
      flags: 64,
    });
  }

  const extraChannelIds = config.other_channels
    ? config.other_channels.split(",").map((id) => id.trim())
    : [];

  const extraChannels = extraChannelIds
    .map((id) => guild.channels.cache.get(id))
    .filter((ch) => ch); // Remove any nulls

  try {
    const hasMainView = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.ViewChannel);
    const hasMainSend = member
      .permissionsIn(mainChannel)
      .has(PermissionsBitField.Flags.SendMessages);

    const shouldRevoke = hasMainView && hasMainSend;

    // Apply permission changes to main channel
    await mainChannel.permissionOverwrites.edit(member, {
      ViewChannel: !shouldRevoke,
      SendMessages: !shouldRevoke,
    });

    // Apply to all additional channels
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
        ? `Your access to ${channelMentions} has been removed.`
        : `You now have access to ${channelMentions}.`,
      ""
    );

    await interaction.editReply({
      embeds: [embed],
      flags: 64,
    });
  } catch (error) {
    console.error("Error handling Join/Leave command:", error);
    const embed = createEmbed(
      "Error",
      "Something went wrong while updating permissions.",
      "error"
    );
    await interaction.editReply({
      embeds: [embed],
      flags: 64,
    });
  }
}

module.exports = handleJoinLeaveCommand;
