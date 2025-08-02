const createEmbed = require("../../helpers/embed");
const Rules = require("../../models/rules");
const userExchangeData = require("../../helpers/userExchangeData");
const cancelThread = require("../cancel-thread");

async function handleAddRuleNameButton(interaction, client) {
  // Store interaction data for the specific user
  userExchangeData.set(interaction.member.user.id, {
    threadId: interaction.channelId,
    name: "add-rule-name",
  });

  const title = `Add Rule`;
  const description = `Please reply with the new name of your rule.`;
  const embed = createEmbed(title, description, "");
  await interaction.editReply({
    embeds: [embed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a rule)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
  });
}

async function handleAddRuleWithoutDescriptionButton(interaction, client) {
  const user_exchange_data = userExchangeData.get(interaction.member.user.id);

  try {
    const newRule = new Rules({
      guild_id: interaction.guildId,
      name: user_exchange_data.new_rule_name,
    });
    await newRule.save();
  } catch (error) {
    logger.error("Error Adding Rule To Database:", error);

    const title = `Add Rule Error`;
    const description = `Couldn't add rule, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely

    await interaction.editReply({ embeds: [embed] });
    cancelThread(interaction, client);
    return;
  }

  const title = `Add Rule`;
  const description =
    `New rule added: \n` + `Name: **${user_exchange_data.new_rule_name}**`;
  const color = ""; // Changed to hex code for red
  const embed = createEmbed(title, description, color);

  userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
  await interaction.editReply({ embeds: [embed], components: [] });
  const rules = await Rules.find({ guild_id: interaction.guildId });
  const mainTitle = "Manage Rules";
  const mainDescription = `Do you want to create, update or remove a rule?`;
  const mainEmbed = createEmbed(mainTitle, mainDescription, "");

  // Add each rule as a field in the mainEmbed
  for (const rule of rules) {
    mainEmbed.addFields({
      name: rule.name || "Unnamed Rule",
      value: rule.description || "No description provided.",
    });
  }

  // Send the message to the thread
  await interaction.followUp({
    embeds: [mainEmbed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 3, // Green style (for adding a game)
            label: "Add",
            emoji: { name: "➕" }, // Emoji for add
            custom_id: "add-rule-name",
          },
          {
            type: 2, // Button
            style: 1, // Primary style (for updating a game)
            label: "Update",
            emoji: { name: "🖊️" }, // Pencil emoji for updating
            custom_id: "update-rule",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "Remove",
            emoji: { name: "🗑️" }, // Trash bin emoji for removing
            custom_id: "remove-rule",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a game)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
  });
}

async function handleManageRulesButton(interaction, client) {
  try {
    const rules = await Rules.find({ guild_id: interaction.guildId });

    if (rules.length > 0) {
      let rules_list = "";

      rules.forEach((rule, index) => {
        rules_list += `${index + 1}. **${rule.name}**\n`;
      });

      // Store interaction data for the specific user
      userExchangeData.set(interaction.member.user.id, {
        threadId: interaction.channelId,
        name: "manage-rules",
        action: interaction.customId,
        rules: rules,
      });

      let action;
      if (interaction.customId == "update-rule") {
        action = "update";
      } else if (interaction.customId == "remove-rule") {
        action = "remove";
      }

      let capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);

      const title = `${capitalizedAction} Rule`;
      const description = `Please reply with the number next to the rule to ${action} that rule.\n\n${rules_list}`;
      const embed = createEmbed(title, description, "");
      await interaction.editReply({
        embeds: [embed],
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a rule)
                label: "Cancel",
                custom_id: "cancel-thread",
              },
            ],
          },
        ],
      });
    } else {
      const title = "No rules found";
      const description = `I couldn't find any rules, please add one first using the \`/manage-rules\` command.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely

      await interaction.editReply({
        embeds: [embed],
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a rule)
                label: "Cancel",
                custom_id: "cancel-thread",
              },
            ],
          },
        ],
      });
      const rules = await Rules.find({ guild_id: interaction.guildId });
      const mainTitle = "Manage Rules";
      const mainDescription = `Do you want to create, update or remove a rule?`;
      const mainEmbed = createEmbed(mainTitle, mainDescription, "");

      // Add each rule as a field in the mainEmbed
      for (const rule of rules) {
        mainEmbed.addFields({
          name: rule.name || "Unnamed Rule",
          value: rule.description || "No description provided.",
        });
      }

      // Send the message to the thread
      await interaction.followUp({
        embeds: [mainEmbed],
        components: [
          {
            type: 1, // Action Row
            components: [
              {
                type: 2, // Button
                style: 3, // Green style (for adding a game)
                label: "Add",
                emoji: { name: "➕" }, // Emoji for add
                custom_id: "add-rule-name",
              },
              {
                type: 2, // Button
                style: 1, // Primary style (for updating a game)
                label: "Update",
                emoji: { name: "🖊️" }, // Pencil emoji for updating
                custom_id: "update-rule",
              },
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a game)
                label: "Remove",
                emoji: { name: "🗑️" }, // Trash bin emoji for removing
                custom_id: "remove-rule",
              },
              {
                type: 2, // Button
                style: 4, // Danger style (for removing a game)
                label: "Cancel",
                custom_id: "cancel-thread",
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    logger.error("Something went wrong while fetching the rules", error);
    const title = "Error";
    const description = `Something went wrong, please try again later or contact your administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
    await interaction.editReply({ embeds: [embed] });
    cancelThread(interaction, client);
  }
}

async function handleUpdateRuleNameButton(interaction, client) {
  const user_exchange_data = userExchangeData.get(interaction.member.user.id);

  user_exchange_data.name = "update-rule-description";
  // Store the updated object back into userExchangeData
  userExchangeData.set(interaction.member.user.id, user_exchange_data);

  const title = `Update Rule`;
  const description =
    `Please reply with the new description of your rule for **${user_exchange_data.rule.name}**, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.rule.description
      ? `\n\nCurrent rule description: **${user_exchange_data.rule.description}**`
      : `\n\nYou currently don't have any description set for this rule.`); // Append current_rule_description only if it's not empty
  const color = ""; // Changed to hex code for red
  const embed = createEmbed(title, description, color);

  await interaction.editReply({
    embeds: [embed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 3, // Green style
            label: "Proceed",
            emoji: { name: "✅" },
            custom_id: "update-rule-description",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a rule)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
  });
}

async function handleUpdateRuleDescriptionButton(interaction, client) {
  const user_exchange_data = userExchangeData.get(interaction.member.user.id);

  try {
    if (user_exchange_data.new_rule_name) {
      const updatedRule = await Rules.findOneAndUpdate(
        { _id: user_exchange_data.rule._id },
        { name: user_exchange_data.new_rule_name },
        { new: true } // Option to return the updated document
      );

      if (updatedRule) {
        const title = `Update Rule`;
        const description = `Rule **${user_exchange_data.rule.name}** has been updated with:\n\nName: **${user_exchange_data.new_rule_name}**.`;
        const color = ""; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        await interaction.editReply({ embeds: [embed], components: [] });

        const rules = await Rules.find({ guild_id: interaction.guildId });
        const mainTitle = "Manage Rules";
        const mainDescription = `Do you want to create, update or remove a rule?`;
        const mainEmbed = createEmbed(mainTitle, mainDescription, "");

        // Add each rule as a field in the mainEmbed
        for (const rule of rules) {
          mainEmbed.addFields({
            name: rule.name || "Unnamed Rule",
            value: rule.description || "No description provided.",
          });
        }

        // Send the message to the thread
        await interaction.followUp({
          embeds: [mainEmbed],
          components: [
            {
              type: 1, // Action Row
              components: [
                {
                  type: 2, // Button
                  style: 3, // Green style (for adding a game)
                  label: "Add",
                  emoji: { name: "➕" }, // Emoji for add
                  custom_id: "add-rule-name",
                },
                {
                  type: 2, // Button
                  style: 1, // Primary style (for updating a game)
                  label: "Update",
                  emoji: { name: "🖊️" }, // Pencil emoji for updating
                  custom_id: "update-rule",
                },
                {
                  type: 2, // Button
                  style: 4, // Danger style (for removing a game)
                  label: "Remove",
                  emoji: { name: "🗑️" }, // Trash bin emoji for removing
                  custom_id: "remove-rule",
                },
                {
                  type: 2, // Button
                  style: 4, // Danger style (for removing a game)
                  label: "Cancel",
                  custom_id: "cancel-thread",
                },
              ],
            },
          ],
        });
      } else {
        throw new Error("Couldn't update rule to database");
      }
    } else {
      const title = `Update Rule Error`;
      const description = `You need to at least change the name or the description to update the rule.`;
      const color = "error"; // Changed to hex code for red
      const embed = createEmbed(title, description, color);

      userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
      await interaction.editReply({ embeds: [embed] });
      cancelThread(interaction, client);
    }
  } catch (error) {
    logger.error("Error Updating Rule To Database:", error);

    const title = `Update Rule Error`;
    const description = `Couldn't update rule, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
    await interaction.editReply({ embeds: [embed] });
    cancelThread(interaction, client);
  }
}

module.exports = {
  handleAddRuleNameButton,
  handleAddRuleWithoutDescriptionButton,
  handleManageRulesButton,
  handleUpdateRuleNameButton,
  handleUpdateRuleDescriptionButton,
};
