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

async function registerCommands(client, guild_id, list, shouldDeleteCommand, list_type) {
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
          { name: 'Choose your nickname', value: 'change-own-nickname' },
          { name: "Choose someone's nickname", value: 'change-user-nickname' },
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
  if (list && list.length > 0 && list_type == "games") {
    REMOVE_GAME_COMMAND = {
      name: 'remove-game',
      description: 'Remove a game from the list',
      options: [
        {
          type: 3, // STRING
          name: 'game',
          description: 'Select a game to remove',
          required: true,
          choices: list,
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
          choices: list,
        },
        {
          type: 3, // STRING
          name: 'name',
          description: 'Choose a name for the game',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'description',
          description: 'Choose a description for the game',
          required: false,
        },
      ],
    };
  }

  let START_EVENT_COMMAND;
  if (list && list.length > 0 && list_type == "games") {
    START_EVENT_COMMAND = {
      name: 'start-event',
      description: 'Start an event with team generation',
      options: [
        {
          type: 3, // STRING
          name: 'name',
          description: 'Choose the name / title of your event',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'description',
          description: 'Choose the description of your event',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'game',
          description: 'Select a game',
          required: false,
          choices: list,
        },
        {
          type: 4, // NUMBER
          name: 'expiration',
          description: 'Select the number of hours for team generation and signup deadline (default: 24 hours)',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'image',
          description: 'Add an image link to add to your event post',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'color',
          description: 'Select the color of the embed',
          required: false,
          choices: [
            { name: 'purple', value: 'purple' },
            { name: 'red', value: 'red' },
            { name: 'yellow', value: 'yellow' },
            { name: 'green', value: 'green' },
            { name: 'cyan', value: 'cyan' },
            { name: 'blue', value: 'blue' },
            { name: 'pink', value: 'pink' },
          ],
        },
      ],
    };
  } else {
    START_EVENT_COMMAND = {
      name: 'start-event',
      description: 'Start an event with team generation',
      options: [
        {
          type: 3, // STRING
          name: 'name',
          description: 'Choose the name / title of your event',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'description',
          description: 'Choose the description of your event',
          required: true,
        },
        {
          type: 4, // NUMBER
          name: 'expiration',
          description: 'Select the number of hours for team generation and signup deadline (default: 24 hours)',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'image',
          description: 'Add an image link to add to your event post',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'color',
          description: 'Select the color of the embed',
          required: false,
          choices: [
            { name: 'purple', value: 'purple' },
            { name: 'red', value: 'red' },
            { name: 'yellow', value: 'yellow' },
            { name: 'green', value: 'green' },
            { name: 'cyan', value: 'cyan' },
            { name: 'blue', value: 'blue' },
            { name: 'pink', value: 'pink' },
          ],
        },
      ],
    };
  }

  let CANCEL_EVENT_COMMAND;
  if (list && list.length > 0 && list_type == "events") {
    CANCEL_EVENT_COMMAND = {
      name: 'cancel-event',
      description: 'Cancel an event',
      options: [
        {
          type: 3, // STRING
          name: 'event',
          description: 'Select an event to cancel',
          required: true,
          choices: list,
        },
      ]
    };
  }

  // Define new commands based on the presence of REMOVE_GAME_COMMAND
  // const NEW_COMMANDS = [
  //   AWARD_TEAM_COMMAND,
  //   WALLET_COMMAND,
  //   DEDUCT_USER_COMMAND,
  //   AWARD_USER_COMMAND,
  //   SHOP_COMMAND,
  //   SET_REWARD_COMMAND,
  //   SET_ALL_REWARDS_COMMAND,
  //   SET_TEAMS_COMMAND,
  //   SET_TOKEN_EMOJI_COMMAND,
  //   SET_BOT_CHANNEL_COMMAND,
  //   ADD_GAME_COMMAND,
  //   GAMES_COMMAND,
  //   RESET_TEAMS_COMMAND,
  //   SET_STATUS_COMMAND,
  //   START_EVENT_COMMAND,
  //   ...(CANCEL_EVENT_COMMAND ? [CANCEL_EVENT_COMMAND] : []), // Add CANCEL_EVENT_COMMAND only if it exists
  //   ...(REMOVE_GAME_COMMAND ? [REMOVE_GAME_COMMAND] : []), // Add REMOVE_GAME_COMMAND only if it exists
  //   ...(UPDATE_GAME_COMMAND ? [UPDATE_GAME_COMMAND] : []), // Add UPDATE_GAME_COMMAND if it exists
  // ];

  // Define always-present commands
  const ALWAYS_PRESENT_COMMANDS = [
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
    START_EVENT_COMMAND,
  ];

  // Conditional commands based on list_type
  const CONDITIONAL_COMMANDS = [
    ...(list && list.length > 0 && list_type == "games" ? [
      REMOVE_GAME_COMMAND,
      UPDATE_GAME_COMMAND,
    ] : []),
    ...(list && list.length > 0 && list_type == "events" ? [
      CANCEL_EVENT_COMMAND,
    ] : []),
  ];

  // Combine always-present commands with conditional commands
  const NEW_COMMANDS = [
    ...ALWAYS_PRESENT_COMMANDS,
    ...CONDITIONAL_COMMANDS,
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

  async function deleteCommands(commandsToDeleteNames) {
    for (const commandName of commandsToDeleteNames) {
      const commandToDelete = existingCommands.find(
        existingCommand => existingCommand.name === commandName.toLowerCase()
      );
    
      if (commandToDelete) {
        await deleteCommand(commandToDelete.id); // Again, assuming deleteCommand is your function
        console.log(`Deleted command: ${commandName}`);
      } else {
        console.log(`Command ${commandName} not found.`);
      }
    }
  }


  // Call the function for games only if the corresponding variable is true
  if (shouldDeleteCommand && list_type == "games") {
    const commandsToDeleteGames = ['REMOVE_GAME_COMMAND', 'UPDATE_GAME_COMMAND'];
    deleteCommands(commandsToDeleteGames);
  }

  // Call the function for cancel events only if the corresponding variable is true
  if (shouldDeleteCommand && list_type == "events") {
    const commandsToDeleteCancel = ['CANCEL_EVENT_COMMAND'];
    deleteCommands(commandsToDeleteCancel);
  }

  // Create a map of existing command names to their IDs for quick lookup
  const existingCommandMap = new Map(existingCommands.map(cmd => [cmd.name, cmd.id]));

  // Prepare commands for registration/update
  const finalCommandList = NEW_COMMANDS.map(cmd => {
    const existingId = existingCommandMap.get(cmd.name);
    return existingId ? { id: existingId, ...cmd } : cmd;
  });

  // Define a list to keep commands
  let commandsToKeep = [];



  if (!shouldDeleteCommand && list_type == "events" || !shouldDeleteCommand && list_type == "games") {
    commandsToKeep = ['remove-game', 'update-game', 'cancel-event'];
  }

  // Add the commands to keep to the finalCommandList if they exist
  if (commandsToKeep.length > 0) {
    for (const commandName of commandsToKeep) {
      // Find the existing command that matches the commandName
      const filteredCommand = existingCommands.find(command => command.name === commandName);

      if (filteredCommand) {
        // Check if the command is already in finalCommandList
        const existingCommand = finalCommandList.find(cmd => cmd.name === commandName);
        if (!existingCommand) {
          // Add the command to finalCommandList
          finalCommandList.push({
            // id: filteredCommand.id,
            name: filteredCommand.name,
            description: filteredCommand.description,
            options: filteredCommand.options
          });
        }
      }

      const startEventCommand = existingCommands.find(command => command.name === "start-event");
      if (startEventCommand) {
        finalCommandList.find((command => command.name === "start-event")).options = startEventCommand.options;
      }

    }
  }

  // Register or update commands
  try {
    await InstallGlobalCommands(process.env.APP_ID, finalCommandList, guild_id);
    console.log('Successfully registered or updated commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  // Handle command deletion if required
  if (shouldDeleteCommand) {
    const commandsToDelete = existingCommands.filter(existingCommand =>
      !NEW_COMMANDS.some(newCommand => newCommand.name === existingCommand.name)
    );

    console.log("Commands to Delete:", commandsToDelete);

    for (const command of commandsToDelete) {
      await deleteCommand(command.id);
    }
  }
}

module.exports = registerCommands;