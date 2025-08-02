const createEmbed = require("../helpers/embed");
const userExchangeData = require("../helpers/userExchangeData");
const cancelThreadFromMessage = require("../helpers/cancel-thread");
const Rules = require("../models/rules");
const validateNumber = require("../helpers/validate-number");

async function handleManageRules(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);

  if (
    user_exchange_data.action !== "update-rule" &&
    user_exchange_data.action !== "remove-rule"
  ) {
    return;
  }

  const messageContent = message.content;
  const validationError = validateNumber(
    messageContent,
    user_exchange_data.rules
  );

  if (validationError) {
    logger.error("Validation Error:", validationError);
    // Send a confirmation message before closing the thread
    const title = `Input Error`;
    const description = `${validationError}\nPlease try again.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });
    return;
  }

  if (user_exchange_data.action == "update-rule") {
    const title = "Update Rule";
    const description = `Update Rule Name: **${
      user_exchange_data.rules[Number(messageContent) - 1].name
    }**\n\nPlease reply with the new name of your rule, if you don't want to change it press the ✅ button. We will then proceed to change the description.`;
    const color = "";
    const embed = createEmbed(title, description, color);
    // Send a confirmation message before closing the thread
    await message.channel.send({
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
              custom_id: "update-rule-name",
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

    user_exchange_data.name = "update-rule-name";
    user_exchange_data.rule =
      user_exchange_data.rules[Number(messageContent) - 1];
    delete user_exchange_data.action;
    delete user_exchange_data.rules;
    // Store the updated object back into userExchangeData
    userExchangeData.set(message.author.id, user_exchange_data);
    return;
  } else if (user_exchange_data.action == "remove-rule") {
    const ruleRemoved = await removeRule(
      user_exchange_data.rules[Number(messageContent) - 1],
      client,
      message
    );
    if (ruleRemoved) {
      userExchangeData.delete(message.author.id); // Remove the user's data entirely
      const rules = await Rules.find({ guild_id: message.guildId });
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
      await message.channel.send({
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
    return;
  }
}

async function handleAddRuleName(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);
  const messageContent = message.content;

  user_exchange_data.name = "add-rule-description";
  user_exchange_data.new_rule_name = messageContent;
  // Store the updated object back into userExchangeData
  userExchangeData.set(message.author.id, user_exchange_data);

  const title = "Add Rule";
  const description = `Please reply with the new description of your rule. If you don't want to add a description press the ✅ button`;
  const color = "";
  const embed = createEmbed(title, description, color);
  // Send a confirmation message before closing the thread
  await message.channel.send({
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
            custom_id: "add-rule-without-description",
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

async function handleAddRuleDescription(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);

  const messageContent = message.content;

  try {
    const newRule = new Rules({
      guild_id: message.guildId,
      name: user_exchange_data.new_rule_name,
      description: messageContent,
    });
    await newRule.save();
  } catch (error) {
    logger.error("Error Adding Rule To Database:", error);

    const title = `Add Rule Error`;
    const description = `Couldn't add rule, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });

    userExchangeData.delete(message.author.id); // Remove the user's data entirely
    cancelThreadFromMessage(message.guildId, message.channelId, client);
  }

  const title = `Add Rule`;
  const description =
    `New rule added:\n` +
    `Name: **${user_exchange_data.new_rule_name}**\n` +
    `Description: **${messageContent}**.\n\n`;
  const color = ""; // Changed to hex code for red
  const embed = createEmbed(title, description, color);

  await message.channel.send({
    embeds: [embed],
  });

  userExchangeData.delete(message.author.id); // Remove the user's data entirely
  const rules = await Rules.find({ guild_id: message.guildId });

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
  await message.channel.send({
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

async function removeRule(rule, client, message) {
  try {
    const deletedRule = await Rules.findByIdAndDelete(rule._id);

    // Check if the rule was deleted
    if (deletedRule) {
      // Rule was successfully deleted
      const title = `Rule Removed`;
      const description = `The rule "**${rule.name}**" has been successfully removed.`;
      const color = "";
      const embed = createEmbed(title, description, color);

      await message.channel.send({
        embeds: [embed],
      });
      return true;
    } else {
      throw new Error("Database error, can't delete rule.");
    }
  } catch (error) {
    logger.error("Remove Rule Error:", error);
    // Send a confirmation message before closing the thread
    const title = `Remove Rule Error`;
    const description = `I could not remove the rule, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });

    userExchangeData.delete(message.author.id); // Remove the user's data entirely
    cancelThreadFromMessage(message.guildId, message.channelId, client);
    return false;
  }
}

async function handleUpdateRuleName(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);
  if (user_exchange_data.name !== "update-rule-name") {
    return;
  }

  const messageContent = message.content;

  user_exchange_data.name = "update-rule-description";
  user_exchange_data.new_rule_name = messageContent;
  // Store the updated object back into userExchangeData
  userExchangeData.set(message.author.id, user_exchange_data);

  const title = `Update Rule`;
  const description =
    `New name: **${messageContent}** for **${user_exchange_data.rule.name}**.\n\n` +
    `Please reply with the new description of your rule, if you don't want to change it press the ✅ button to confirm the update.` +
    (user_exchange_data.rule.description
      ? `\n\nCurrent rule description: **${user_exchange_data.rule.description}**`
      : `\n\nYou currently don't have any description set for this rule.`); // Append current_rule_description only if it's not empty
  const color = ""; // Changed to hex code for red
  const embed = createEmbed(title, description, color);

  await message.channel.send({
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
  return;
}

async function handleUpdateRuleDescription(message, client) {
  const user_exchange_data = userExchangeData.get(message.author.id);
  if (user_exchange_data.name !== "update-rule-description") {
    return;
  }

  const new_rule_description = message.content;

  try {
    // Construct the update object conditionally
    const updateFields = { description: new_rule_description }; // Always update description

    // Only include name if it exists in user_exchange_data
    if (user_exchange_data.new_rule_name) {
      updateFields.name = user_exchange_data.new_rule_name;
    }

    const updatedRule = await Rules.findOneAndUpdate(
      { _id: user_exchange_data.rule._id },
      updateFields,
      { new: true } // Option to return the updated document
    );

    if (updatedRule) {
      const title = `Update Rule`;
      // Start with the base description
      let description = `Rule **${user_exchange_data.rule.name}** has been updated with:\n\n`;

      // Conditionally add the name if it exists
      if (user_exchange_data.new_rule_name) {
        description += `Name: **${user_exchange_data.new_rule_name}**\n`;
      }

      // Always include the description
      description += `Description: **${new_rule_description}**.`;
      const color = ""; // Changed to hex code for red
      const embed = createEmbed(title, description, color);

      await message.channel.send({
        embeds: [embed],
      });

      userExchangeData.delete(message.author.id); // Remove the user's data entirely
      const rules = await Rules.find({ guild_id: message.guildId });
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
      await message.channel.send({
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
  } catch (error) {
    logger.error("Error Updating Rule To Database:", error);

    const title = `Update Rule Error`;
    const description = `Couldn't update rule, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    await message.channel.send({
      embeds: [embed],
    });

    userExchangeData.delete(message.author.id); // Remove the user's data entirely
    cancelThreadFromMessage(message.guildId, message.channelId, client);
  }

  return;
}

module.exports = {
  handleManageRules,
  handleAddRuleName,
  handleAddRuleDescription,
  handleUpdateRuleName,
  handleUpdateRuleDescription,
};
