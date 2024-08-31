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
      {
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'reason',
        description: 'Reason for the awarding',
        required: false, // Make it optional or true if you need it to be required
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
        type: 6, // 6 corresponds to a USER in Discord's API
        name: 'user',
        description: 'Select a user to deduct wallet',
        required: true,
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'amount',
        description: 'Amount of coins to deduct',
        required: true,
      },
      {
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'reason',
        description: 'Reason for the deduction',
        required: false, // Make it optional or true if you need it to be required
      },
    ],
  };

  const AWARD_USER_COMMAND = {
    name: 'award-user',
    description: 'Award shop coins to a user',
    options: [
      {
        type: 6, // 6 corresponds to a USER in Discord's API
        name: 'user',
        description: 'Select a user to deduct wallet',
        required: true,
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'amount',
        description: 'Amount of coins to award',
        required: true,
      },
      {
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'reason',
        description: 'Reason for the awarding',
        required: false, // Make it optional or true if you need it to be required
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
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'reward',
        description: 'Select whether to award a user or a role',
        required: true,
        choices: [
          {
            name: 'Change your nickname',
            value: 'change-own-nickname',
          },
          {
            name: "Change someone's nickname",
            value: 'role',
          },
          {
            name: 'Add a custom server emoji',
            value: 'custom-emoji',
          },
          {
            name: 'Add a custom channel',
            value: 'custom-channel',
          },
          {
            name: 'Add a custom role name and color',
            value: 'custom-role',
          },
          {
            name: 'Add a custom soundboard sound',
            value: 'custom-soundboard',
          },
          {
            name: 'Choose next game',
            value: 'choose-game',
          },
        ],
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'price',
        description: 'Price of the reward',
        required: false,
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'time',
        description: 'Time in days, reward gets removed after',
        required: false,
      },
      {
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'enable',
        description: 'Enable or disable a reward.',
        required: false,
        choices: [
          {
            name: 'Enable',
            value: 'true',
          },
          {
            name: "Disable",
            value: 'false',
          },
        ],
      },
    ],
  };

  const SET_ALL_REWARDS_COMMAND = {
    name: 'set-all-rewards',
    description: 'Set reward price, reset time, for all rewards',
    options: [
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'price',
        description: 'Price of the rewards',
        required: false,
      },
      {
        type: 4, // 4 corresponds to an INTEGER in Discord's API
        name: 'time',
        description: 'Time in days, rewards get removed after',
        required: false,
      },
    ],
  };


  const SET_TEAMS_COMMAND = {
    name: 'set-teams',
    description: 'Choose 2 roles to be assigned as teams for the team generation',
    options: [
      {
        type: 8, // 8 corresponds to a ROLE in Discord's API
        name: 'team_1',
        description: 'First team',
        required: true,
      },
      {
        type: 8, // 8 corresponds to a ROLE in Discord's API
        name: 'team_2',
        description: 'Second team',
        required: true,
      },
    ],
  };


  const SET_TOKEN_EMOJI_COMMAND = {
    name: 'set-token-emoji',
    description: 'Sets the token emoji to your preferred emoji',
    options: [
      {
        type: 3, // 3 corresponds to a STRING in Discord's API
        name: 'token_emoji',
        description: 'Token Emoji (e.g., 😃)',
        required: true,
      }
    ],
  };
  

  const NEW_COMMANDS = [
    AWARD_TEAM_COMMAND, 
    WALLET_COMMAND, 
    DEDUCT_USER_COMMAND, 
    AWARD_USER_COMMAND, 
    SHOP_COMMAND, 
    SET_REWARD_COMMAND,
    SET_ALL_REWARDS_COMMAND,
    SET_TEAMS_COMMAND,
    SET_TOKEN_EMOJI_COMMAND
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

  // Register or update the existing commands
  try {
    await InstallGlobalCommands(process.env.APP_ID, NEW_COMMANDS);
    console.log('Successfully registered or updated commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

registerCommands();
