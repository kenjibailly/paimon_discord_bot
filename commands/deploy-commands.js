require('dotenv/config');
const { InstallGlobalCommands, DiscordRequest } = require('../utilities/utils.js');

async function fetchCommands() {
  const endpoint = `applications/${process.env.APP_ID}/commands`;
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    return res.json();
  } catch (err) {
    console.error('Error fetching commands:', err);
    return [];
  }
}

async function deleteCommand(commandId) {
  const endpoint = `applications/${process.env.APP_ID}/commands/${commandId}`;
  try {
    await DiscordRequest(endpoint, { method: 'DELETE' });
    console.log(`Deleted command with ID: ${commandId}`);
  } catch (err) {
    console.error('Error deleting command:', err);
  }
}

async function registerCommands() {
  const AWARD_TEAM_COMMAND = {
    name: 'award-team',
    description: 'Award shop coins to a team/role',
    options: [
      {
        type: 8, // 8 corresponds to a ROLE in Discord's API
        name: 'role',
        description: 'Select a role to award coins to',
        required: true,
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'amount',
        description: 'Amount of coins to award',
        required: true,
      },
    ],
  };

  const WALLET_COMMAND = {
    name: 'wallet',
    description: 'Check your wallet balance',
  };

  const NEW_COMMANDS = [AWARD_TEAM_COMMAND, WALLET_COMMAND];

  // Fetch existing commands from Discord
  const existingCommands = await fetchCommands();

  // Find commands that need to be deleted (those that are in Discord but not in NEW_COMMANDS)
  const commandsToDelete = existingCommands.filter(existingCommand => 
    !NEW_COMMANDS.some(newCommand => newCommand.name === existingCommand.name)
  );

  // Delete outdated commands
  for (const command of commandsToDelete) {
    await deleteCommand(command.id);
  }

  // Register or update the existing commands
  try {
    await InstallGlobalCommands(process.env.APP_ID, NEW_COMMANDS);
    console.log('Successfully registered or updated commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

registerCommands();
