const Rules = require("../models/rules");
const Timeouts = require("../models/timeouts");
const { EmbedBuilder } = require("discord.js");
const StaffRole = require("../models/staff-role");
const userExchangeData = require("../helpers/userExchangeData");

async function handleTimeoutUserButton(interaction, client) {
  const [_, targetUserId] = interaction.customId.split(":");
  const user_exchange_data = userExchangeData.get(targetUserId);
  userExchangeData.delete(targetUserId);
  const violationMessage = user_exchange_data.violationMessage;
  const timeoutAmount = user_exchange_data.timeoutAmount;
  let messageContent = null;
  if (violationMessage) {
    // Parse the link to extract channel ID and message ID
    const match = violationMessage.match(
      /https:\/\/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/
    );

    if (match) {
      const [, channelId, messageId] = match;
      try {
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        messageContent = message.content;
      } catch (err) {
        console.error("Failed to fetch original message:", err);
      }
    }
  }
  const selectedRuleIds = interaction.values;

  // Fetch existing timeout count
  let timeoutData = await Timeouts.findOne({
    guild_id: interaction.guildId,
    user_id: targetUserId,
  });

  if (!timeoutData) {
    timeoutData = new Timeouts({
      guild_id: interaction.guildId,
      user_id: targetUserId,
      amount: 0,
    });
  }

  // Determine timeout duration
  let timeoutMs;
  const nextTimeoutCount = timeoutData.amount + 1;

  switch (nextTimeoutCount) {
    case 1:
      timeoutMs = 10 * 60 * 1000; // 10 minutes
      break;
    case 2:
      timeoutMs = 60 * 60 * 1000; // 1 hour
      break;
    default:
      timeoutMs = 24 * 60 * 60 * 1000; // 24 hours
      break;
  }

  // Fetch rules
  const selectedRules = await Rules.find({ _id: { $in: selectedRuleIds } });
  const ruleList = selectedRules
    .map((r) => `• **${r.name}**: ${r.description}`)
    .join("\n");
  let durationStr;

  if (user_exchange_data.timeoutAmount) {
    durationStr = timeoutAmount + " hours";
  } else {
    durationStr = formatDuration(timeoutMs);
  }

  let staffRoleName = "";
  try {
    const staffRoleEntry = await StaffRole.findOne({
      guild_id: interaction.guildId,
    });
    if (staffRoleEntry && staffRoleEntry.id) {
      const role = await interaction.guild.roles.fetch(staffRoleEntry.id);
      if (role) {
        staffRoleName = role.name;
      }
    }
  } catch (error) {
    console.error("Failed to fetch staff role:", error.message);
  }

  // DM the user
  try {
    const user = await client.users.fetch(targetUserId);
    const dmEmbed = new EmbedBuilder()
      .setTitle("You have been timed out")
      .setDescription(
        `You were timed out in **${interaction.guild.name}** for **${durationStr}**.\n\n**Violation of rule(s):**\n${ruleList}` +
          (messageContent
            ? `\n\n**Violated Message**\n${messageContent}`
            : "") +
          (staffRoleName
            ? `\n\nIf you believe this was a mistake, please contact a member of the **${staffRoleName}** role.`
            : "")
      )
      .setColor("Red");

    await user.send({ embeds: [dmEmbed] });
  } catch (dmErr) {
    logger.warn(`Failed to DM user ${targetUserId}:`, dmErr.message);
  }

  // Timeout the user
  try {
    const member = await interaction.guild.members.fetch(targetUserId);
    if (user_exchange_data.timeoutAmount) {
      const ms = user_exchange_data.timeoutAmount * 60 * 60 * 1000;
      await member.timeout(ms);
    } else {
      await member.timeout(timeoutMs);
    }
  } catch (err) {
    logger.error("Failed to timeout user:", err.message);
  }

  // Update DB
  timeoutData.amount = nextTimeoutCount;
  await timeoutData.save();

  // Send confirmation in interaction
  const embed = new EmbedBuilder()
    .setTitle("User Timed Out")
    .setDescription(
      `You were timed out in **${interaction.guild.name}** for **${durationStr}**.\n\n**Reason(s):**\n${ruleList}`
    )
    .addFields({ name: "Duration", value: durationStr, inline: true })
    .setColor("Red");

  await interaction.editReply({
    content: `User <@${targetUserId}> has been timed out.`,
    embeds: [embed],
    components: [],
  });
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 3600) return `${Math.floor(s / 60)} minutes`;
  if (s < 86400) return `${Math.floor(s / 3600)} hour`;
  return `${Math.floor(s / 86400)} day`;
}

module.exports = handleTimeoutUserButton;
