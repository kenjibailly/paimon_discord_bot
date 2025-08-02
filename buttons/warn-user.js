const Rules = require("../models/rules");
const { EmbedBuilder } = require("discord.js");
const StaffRole = require("../models/staff-role");
const userExchangeData = require("../helpers/userExchangeData");

async function handleWarnUserButton(interaction, client) {
  const [_, targetUserId] = interaction.customId.split(":");
  const user_exchange_data = userExchangeData.get(targetUserId);
  userExchangeData.delete(targetUserId);
  const violationMessage = user_exchange_data;
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

  // Fetch rules
  const selectedRules = await Rules.find({ _id: { $in: selectedRuleIds } });
  const ruleList = selectedRules
    .map((r) => `• **${r.name}**: ${r.description}`)
    .join("\n");

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
      .setTitle("You have been warned")
      .setDescription(
        `You are warned in **${interaction.guild.name}**. Next time you violate the rules, you will be timed out.\n\n**Violation of rule(s):**\n${ruleList}` +
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

  // Send confirmation in interaction
  const embed = new EmbedBuilder()
    .setTitle("User Warned")
    .setDescription(
      `You are warned in **${interaction.guild.name}**.\n\n**Reason(s):**\n${ruleList}`
    )
    .setColor("Red");

  await interaction.editReply({
    content: `User <@${targetUserId}> has been warned.`,
    embeds: [embed],
    components: [],
  });
}

module.exports = handleWarnUserButton;
