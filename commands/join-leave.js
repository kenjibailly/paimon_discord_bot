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

  const channel = guild.channels.cache.get(config.channel);
  if (!channel) {
    const embed = createEmbed(
      "Error",
      `Configured channel not found.`,
      "error"
    );
    return interaction.editReply({
      embeds: [embed],
      flags: 64,
    });
  }

  try {
    // Get current permission overwrite for the user
    const currentPerms = channel.permissionOverwrites.cache.get(member.id);

    const canView = member
      .permissionsIn(channel)
      .has(PermissionsBitField.Flags.ViewChannel);
    const canSend = member
      .permissionsIn(channel)
      .has(PermissionsBitField.Flags.SendMessages);

    if (canView && canSend) {
      // Revoke view/send permissions
      await channel.permissionOverwrites.edit(member, {
        ViewChannel: false,
        SendMessages: false,
      });

      const embed = createEmbed(
        "Success",
        `Your access to <#${channel.id}> has been removed.`,
        ""
      );

      await interaction.editReply({
        embeds: [embed],
        flags: 64,
      });
    } else {
      // Grant view/send permissions
      await channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        SendMessages: true,
      });

      const embed = createEmbed(
        "Success",
        `You now have access to <#${channel.id}>.`,
        ""
      );

      await interaction.editReply({
        embeds: [embed],
        flags: 64,
      });
    }
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
