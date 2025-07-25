const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
} = require("discord.js");
const createEmbed = require("../../helpers/embed");
const Tickets = require("../../models/tickets");
const StaffRole = require("../../models/staff-role");

async function handleCreateTicketButton(interaction, client) {
  // Step 1: Show modal with input field
  const modal = new ModalBuilder()
    .setCustomId("ticket-modal")
    .setTitle("Create a Ticket");

  const ticketInput = new TextInputBuilder()
    .setCustomId("ticket-reason")
    .setLabel("What is your issue?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(ticketInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);

  // Step 2: Wait for modal submission
  const submitted = await interaction
    .awaitModalSubmit({
      time: 60_000, // 1 minute to respond
      filter: (i) =>
        i.customId === "ticket-modal" && i.user.id === interaction.user.id,
    })
    .catch(() => null);

  if (!submitted) return;

  // Step 3: Get input from modal
  const reason = submitted.fields.getTextInputValue("ticket-reason");

  let staffRole;
  try {
    staffRole = await StaffRole.findOne({
      guild_id: interaction.guildId,
    });
  } catch (error) {
    logger.error(error);
  }

  // Step 4: Create thread from the current channel
  const thread = await interaction.channel.threads.create({
    name: `ticket-${interaction.user.username}`,
    autoArchiveDuration: 1440, // 24 hours
    reason: `Ticket created by ${interaction.user.tag}`,
    type: ChannelType.PrivateThread, // or PublicThread if preferred
  });

  // Add staff members to the thread if staffRole exists
  if (staffRole?.id) {
    try {
      const allMembers = await interaction.guild.members.fetch();
      const staffMembers = allMembers.filter((member) =>
        member.roles.cache.has(staffRole.id)
      );

      for (const [id, member] of staffMembers) {
        try {
          await thread.members.add(member.id);
        } catch (err) {
          console.warn(
            `Failed to add staff member ${member.user.tag}: ${err.message}`
          );
        }
      }
    } catch (error) {
      console.warn(`Failed to add staff to thread: ${error.message}`);
    }
  }

  // ✅ Add guild owner (admin) to the thread
  try {
    const owner = await interaction.guild.fetchOwner();
    await thread.members.add(owner.id);
  } catch (error) {
    console.warn(`Failed to add guild owner: ${error.message}`);
  }

  let ticket;
  try {
    ticket = new Tickets({
      guild_id: interaction.guildId,
      user_id: interaction.user.id,
      reason: reason,
    });
    ticket.save();
  } catch (error) {
    logger.error(error);
    const title = "Ticket";
    const description = `Something went wrong while creating your ticket, please try again later.`;
    const embed = createEmbed(title, description, "error");
    await submitted.reply({ embeds: [embed], flags: 64 });
    return;
  }

  // Step 5: Send embed + buttons to the thread
  const title = "Ticket";
  const description = `You have created a ticket, please wait patiently for a staff member to respond.\n\n**Your ticket:**\n${reason}`;
  const embed = createEmbed(title, description, "");

  const components = [
    {
      type: 2,
      style: 1,
      label: "Complete",
      emoji: "🎫",
      custom_id: `complete-ticket:${ticket.id}`,
    },
    {
      type: 2,
      style: 4,
      label: "Cancel",
      custom_id: `cancel-ticket:${ticket.id}`,
    },
  ];

  const message = await thread.send({
    content: `<@${interaction.user.id}>`, // Mention user in thread
    embeds: [embed],
    components: [
      {
        type: 1,
        components,
      },
    ],
  });
  // Step 6: Acknowledge modal submission privately
  const replyTitle = "Ticket";
  const replyDescription = `You have created a ticket [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`;
  const replyEmbed = createEmbed(replyTitle, replyDescription, "");
  await submitted.reply({ embeds: [replyEmbed], flags: 64 });
}

module.exports = handleCreateTicketButton;
