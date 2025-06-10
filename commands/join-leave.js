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
  const secondaryChannel = config.channel2
    ? guild.channels.cache.get(config.channel2)
    : null;

  if (!mainChannel) {
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

    const shouldRevoke = hasMainView && hasMainSend;

    // Apply permission changes
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

    const embed = createEmbed(
      "Success",
      shouldRevoke
        ? `Your access to <#${mainChannel.id}>${
            secondaryChannel ? ` and <#${secondaryChannel.id}>` : ""
          } has been removed.`
        : `You now have access to <#${mainChannel.id}>${
            secondaryChannel ? ` and <#${secondaryChannel.id}>` : ""
          }.`,
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
