const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const Rules = require("../models/rules"); // Adjust path based on where Rules is defined
const userExchangeData = require("../helpers/userExchangeData");

async function handleTimeoutUserCommand(interaction, client) {
  const targetUser = interaction.options.getUser("user");
  const violationMessage = interaction.options.getString("message");
  const timeoutAmount = interaction.options.getInteger("timeout_hours");
  const guildId = interaction.guildId;

  let existingData = {};

  // If violationMessage exists, add it
  if (violationMessage) {
    existingData.violationMessage = violationMessage;
  }

  // If timeoutAmount exists, add it
  if (timeoutAmount) {
    existingData.timeoutAmount = timeoutAmount;
  }

  // Save everything back
  userExchangeData.set(targetUser.id, existingData);

  const rules = await Rules.find({ guild_id: guildId });

  if (!rules.length) {
    return interaction.editReply({
      content: "No rules found in the database for this server.",
    });
  }

  const options = rules.map((rule) => ({
    label: rule.name,
    description: rule.description?.slice(0, 100) || "No description.",
    value: rule._id.toString(),
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`rule_violation_select:${targetUser.id}`)
    .setPlaceholder("Select the rule(s) violated")
    .setMinValues(1)
    .setMaxValues(Math.min(options.length, 25))
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.editReply({
    content: `Select the rule(s) that **${targetUser.tag}** has violated:`,
    components: [row],
  });
}

module.exports = handleTimeoutUserCommand;
