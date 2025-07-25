const { findOne } = require("../../models/join-leave-config");
const Tickets = require("../../models/tickets");
const createEmbed = require("../../helpers/embed");
const cancelThread = require("../../helpers/cancel-thread");
const StaffRole = require("../../models/staff-role");

async function handleCompleteTicketButton(interaction, client) {
  const ticketId = interaction.customId.split(":")[1];
  try {
    const staffRole = await StaffRole.findOne({
      guild_id: interaction.guildId,
    });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has("Administrator");
    const isStaff = staffRole?.id && member.roles.cache.has(staffRole.id);

    if (!isAdmin && !isStaff) {
      const title = "Ticket";
      const description = "❌ Only a staff member can complete this ticket.";
      const embed = createEmbed(title, description, "error");
      await interaction.followUp({ embeds: [embed], flags: 64 });
      return;
    }

    // ✅ Continue with ticket completion logic here...
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: "❌ An error occurred while verifying your permissions.",
      ephemeral: true,
    });
  }

  try {
    const ticket = await Tickets.findOne({ _id: ticketId });
    if (!ticket) {
      const title = "Ticket";
      const description = `Ticket could not be found, please try again later.`;
      const embed = createEmbed(title, description, "error");
      await interaction.followUp({ embeds: [embed], flags: 64 });
    }

    const user = await interaction.client.users
      .fetch(ticket.user_id)
      .catch(() => null);

    if (user) {
      try {
        const title = "Ticket";
        const description = `🎫 Your ticket has been completed by **${interaction.user.globalName}**.\n\n**Ticket:**\n${ticket.reason}`;
        const embed = createEmbed(title, description, "");

        // ✅ Send embed to the ticket creator
        await interaction.followUp({ embeds: [embed], flags: 64 });
        await user.send({ embeds: [embed] });

        // ✅ Notify server administrator
        try {
          const user = await interaction.client.users.fetch(ticket.user_id);
          const guildOwner = await interaction.guild.fetchOwner();

          const title = "Ticket";
          const description = `🎫 A ticket from **${user.globalName}** has been completed by **${interaction.user.globalName}**.\n\n**Ticket:**\n${ticket.reason}`;
          const embed = createEmbed(title, description, "");

          await guildOwner.send({ embeds: [embed] });
        } catch (error) {
          console.warn(`Failed to notify server admin: ${error.message}`);
        }
      } catch (err) {
        logger.error(`Failed to DM user ${ticket.user_id}: ${err.message}`);
      }
    } else {
      logger.error(`User ${ticket.user_id} could not be fetched.`);
    }

    // Delete the ticket from the database
    await Tickets.deleteOne({ _id: ticketId });
    await cancelThread(interaction, client);
  } catch (error) {
    logger.error(error);
    const title = "Ticket";
    const description = `Something went wrong while completing the ticket, please try again later.`;
    const embed = createEmbed(title, description, "error");
    await interaction.followUp({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleCompleteTicketButton;
