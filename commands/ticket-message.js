const createEmbed = require("../helpers/embed");

async function handleSendTicketMessageCommand(interaction, client) {
  const title = "Ticket";
  const description = `Do you have a request, an idea, suggestion or do you have to report something?\nPlease create a ticket and one of the staff members will help you.`;
  const embed = createEmbed(title, description, "");
  const buttonComponent = {
    type: 2, // Button type
    style: 1, // Primary style
    label: "Create",
    emoji: {
      name: "🎫", // wrap the emoji in an object
    },
    custom_id: `create-ticket`,
  };

  await interaction.reply({
    embeds: [embed],
    components: [
      {
        type: 1, // Action row type
        components: [buttonComponent], // Add the button component
      },
    ],
  });
}

module.exports = handleSendTicketMessageCommand;
