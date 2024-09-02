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

async function registerCommands(client, guild_id, games, deleteRemoveCommand) {
  // Define commands
  const AWARD_TEAM_COMMAND = {
    name: 'award-team',
    description: 'Award shop coins to a team/role',
    options: [
      {
        type: 8, // ROLE
        name: 'role',
        description: 'Select a role to award coins to',
        required: true,
      },
      {
        type: 4, // INTEGER
        name: 'amount',
        description: 'Amount of coins to award',
        required: true,
      },
      {
        type: 3, // STRING
        name: 'reason',
        description: 'Reason for the awarding',
        required: false,
      },
    ],
  };

  const WALLET_COMMAND = {
    name: 'wallet',
    description: 'Check your wallet balance',
  };

  const DEDUCT_USER_COMMAND = {
    name: 'deduct-user',
    description: 'Deduct shop coins from wallet of user by amount',
    options: [
      {
        type: 6, // USER
        name: 'user',
        description: 'Select a user to deduct wallet',
        required: true,
      },
      {
        type: 4, // INTEGER
        name: 'amount',
        description: 'Amount of coins to deduct',
        required: true,
      },
      {
        type: 3, // STRING
        name: 'reason',
        description: 'Reason for the deduction',
        required: false,
      },
    ],
  };

  const AWARD_USER_COMMAND = {
    name: 'award-user',
    description: 'Award shop coins to a user',
    options: [
      {
        type: 6, // USER
        name: 'user',
        description: 'Select a user to award wallet',
        required: true,
      },
      {
        type: 4, // INTEGER
        name: 'amount',
        description: 'Amount of coins to award',
        required: true,
      },
      {
        type: 3, // STRING
        name: 'reason',
        description: 'Reason for the awarding',
        required: false,
      },
    ],
  };

  const SHOP_COMMAND = {
    name: 'shop',
    description: 'Open the shop',
  };

  const SET_REWARD_COMMAND = {
    name: 'set-reward',
    description: 'Set reward price, reset time, enable/disable reward',
    options: [
      {
        type: 3, // STRING
        name: 'reward',
        description: 'Select the reward type',
        required: true,
        choices: [
          { name: 'Change your nickname', value: 'change-own-nickname' },
          { name: "Change someone's nickname", value: 'change-user-nickname' },
          { name: 'Add a custom server emoji', value: 'custom-emoji' },
          { name: 'Add a custom channel', value: 'custom-channel' },
          { name: 'Add a custom role name and color', value: 'custom-role' },
          { name: 'Add a custom soundboard sound', value: 'custom-soundboard' },
          { name: 'Choose next game', value: 'choose-game' },
        ],
      },
      {
        type: 4, // INTEGER
        name: 'price',
        description: 'Price of the reward',
        required: false,
      },
      {
        type: 4, // INTEGER
        name: 'time',
        description: 'Time in days before reward is removed',
        required: false,
      },
      {
        type: 3, // STRING
        name: 'enable',
        description: 'Enable or disable the reward',
        required: false,
        choices: [
          { name: 'Enable', value: 'true' },
          { name: 'Disable', value: 'false' },
        ],
      },
    ],
  };

  const SET_ALL_REWARDS_COMMAND = {
    name: 'set-all-rewards',
    description: 'Set reward price and time for all rewards',
    options: [
      {
        type: 4, // INTEGER
        name: 'price',
        description: 'Price of the rewards',
        required: false,
      },
      {
        type: 4, // INTEGER
        name: 'time',
        description: 'Time in days before rewards are removed',
        required: false,
      },
    ],
  };

  const SET_TEAMS_COMMAND = {
    name: 'set-teams',
    description: 'Choose 2 roles as teams for team generation',
    options: [
      {
        type: 8, // ROLE
        name: 'team_1',
        description: 'First team role',
        required: true,
      },
      {
        type: 8, // ROLE
        name: 'team_2',
        description: 'Second team role',
        required: true,
      },
    ],
  };

  const SET_TOKEN_EMOJI_COMMAND = {
    name: 'set-token-emoji',
    description: 'Set the token emoji',
    options: [
      {
        type: 3, // STRING
        name: 'token_emoji',
        description: 'Token Emoji (e.g., 😃)',
        required: true,
      },
    ],
  };

  const SET_BOT_CHANNEL_COMMAND = {
    name: 'set-bot-channel',
    description: 'Set the bot channel for updates',
    options: [
      {
        type: 7, // CHANNEL
        name: 'channel',
        description: 'Choose a channel',
        required: true,
      },
    ],
  };

  const ADD_GAME_COMMAND = {
    name: 'add-game',
    description: 'Add a game to the list',
    options: [
      {
        type: 3, // STRING
        name: 'name',
        description: 'Name of the game',
        required: true,
      },
      {
        type: 3, // STRING
        name: 'description',
        description: 'Description of the game',
        required: false,
      },
    ],
  };

  const GAMES_COMMAND = {
    name: 'games',
    description: 'Show a list of all the games',
  };

  const RESET_TEAMS_COMMAND = {
    name: 'reset-teams',
    description: 'Remove all users from the set teams',
  };

  const SET_STATUS_COMMAND = {
    name: 'set-status',
    description: 'Set a custom status for Paimon',
    options: [
      {
        type: 3, // STRING
        name: 'status',
        description: 'Choose a status',
        required: true,
      },
    ],
  };

  // Conditionally create the REMOVE_GAME_COMMAND if there are games
  let REMOVE_GAME_COMMAND;
  let UPDATE_GAME_COMMAND;
  if (games && games.length > 0) {
    REMOVE_GAME_COMMAND = {
      name: 'remove-game',
      description: 'Remove a game from the list',
      options: [
        {
          type: 3, // STRING
          name: 'game',
          description: 'Select a game to remove',
          required: true,
          choices: games,
        },
      ],
    };

    UPDATE_GAME_COMMAND = {
      name: 'update-game',
      description: 'Updates a game from the list',
      options: [
        {
          type: 3, // STRING
          name: 'game',
          description: 'Select a game to update',
          required: true,
          choices: games,
        },
        {
          type: 3, // STRING
          name: 'name',
          description: 'Change name of the game',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'description',
          description: 'Change description of the game',
          required: false,
        },
      ],
    };
  }

  // Define new commands based on the presence of REMOVE_GAME_COMMAND
  const NEW_COMMANDS = [
    AWARD_TEAM_COMMAND,
    WALLET_COMMAND,
    DEDUCT_USER_COMMAND,
    AWARD_USER_COMMAND,
    SHOP_COMMAND,
    SET_REWARD_COMMAND,
    SET_ALL_REWARDS_COMMAND,
    SET_TEAMS_COMMAND,
    SET_TOKEN_EMOJI_COMMAND,
    SET_BOT_CHANNEL_COMMAND,
    ADD_GAME_COMMAND,
    GAMES_COMMAND,
    RESET_TEAMS_COMMAND,
    SET_STATUS_COMMAND,
    ...(REMOVE_GAME_COMMAND ? [REMOVE_GAME_COMMAND] : []), // Add REMOVE_GAME_COMMAND only if it exists
    ...(UPDATE_GAME_COMMAND ? [UPDATE_GAME_COMMAND] : []), // Add UPDATE_GAME_COMMAND if it exists
  ];

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

  if (deleteRemoveCommand) {
    // Define the names of the commands you want to delete
    const commandsToDeleteNames = ['REMOVE_GAME_COMMAND', 'UPDATE_GAME_COMMAND'];
  
    // Loop through each command name and delete if it exists
    for (const commandName of commandsToDeleteNames) {
      // Find the command to delete
      const commandToDelete = existingCommands.find(
        existingCommand => existingCommand.name === commandName.toLowerCase() // Convert to lowercase as the command names are in lowercase
      );
  
      // Delete the specific command if it exists
      if (commandToDelete) {
        await deleteCommand(commandToDelete.id);
        console.log(`Deleted command: ${commandName}`);
      } else {
        console.log(`Command ${commandName} not found.`);
      }
    }
  }

  // Register or update the existing commands
  try {
    // Pass guild_id to register commands for a specific guild
    await InstallGlobalCommands(process.env.APP_ID, NEW_COMMANDS, guild_id);
    console.log('Successfully registered or updated commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

module.exports = registerCommands;