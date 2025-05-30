require("dotenv/config");
const {
  InstallGuildCommands,
  InstallGlobalCommands,
} = require("../utilities/utils.js");
const game = require("../introduction/game.json");

async function registerCommands(guildId) {
  const defaultManageGuildPermission = 0x0000000000000020; // MANAGE_GUILD permission
  // Define commands
  const AWARD_TEAM_COMMAND = {
    name: "award-team",
    description: "Award shop coins to a team/role",
    options: [
      {
        type: 8, // ROLE
        name: "role",
        description: "Select a role to award coins to",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "amount",
        description: "Amount of coins to award",
        required: true,
      },
      {
        type: 3, // STRING
        name: "reason",
        description: "Reason for the awarding",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const WALLET_COMMAND = {
    name: "wallet",
    description: "Check your wallet balance",
  };

  const DEDUCT_USER_COMMAND = {
    name: "deduct-user",
    description: "Deduct shop coins from wallet of user by amount",
    options: [
      {
        type: 6, // USER
        name: "user",
        description: "Select a user to deduct wallet",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "amount",
        description: "Amount of coins to deduct",
        required: false,
      },
      {
        type: 4, // INTEGER
        name: "extra_amount",
        description: "Amount of extra coins to deduct",
        required: false,
      },
      {
        type: 3, // STRING
        name: "reason",
        description: "Reason for the deduction",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const AWARD_USER_COMMAND = {
    name: "award-user",
    description: "Award shop coins to a user",
    options: [
      {
        type: 6, // USER
        name: "user",
        description: "Select a user to award wallet",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "amount",
        description: "Amount of coins to award",
        required: true,
      },
      {
        type: 3, // STRING
        name: "reason",
        description: "Reason for the awarding",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SHOP_COMMAND = {
    name: "shop",
    description: "Open the shop",
  };

  const SET_REWARD_COMMAND = {
    name: "set-reward",
    description: "Set reward price, reset time, enable/disable reward",
    options: [
      {
        type: 3, // STRING
        name: "reward",
        description: "Select the reward type",
        required: true,
        choices: [
          { name: "Change your nickname", value: "change-own-nickname" },
          { name: "Change someone's nickname", value: "change-user-nickname" },
          { name: "Add a custom server emoji", value: "custom-emoji" },
          { name: "Add a custom channel", value: "custom-channel" },
          { name: "Add a custom role name and color", value: "custom-role" },
          { name: "Choose next game", value: "choose-game" },
          { name: "Troll someone", value: "troll-user" },
        ],
      },
      {
        type: 4, // INTEGER
        name: "price",
        description: "Price of the reward",
        required: false,
      },
      {
        type: 4, // INTEGER
        name: "time",
        description: "Time in days before reward is removed",
        required: false,
      },
      {
        type: 5, // BOOLEAN
        name: "enable",
        description: "Enable or disable the reward",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_ALL_REWARDS_COMMAND = {
    name: "set-all-rewards",
    description: "Set reward price and time for all rewards",
    options: [
      {
        type: 4, // INTEGER
        name: "price",
        description: "Price of the rewards",
        required: false,
      },
      {
        type: 4, // INTEGER
        name: "time",
        description: "Time in days before rewards are removed",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_TEAMS_COMMAND = {
    name: "set-teams",
    description: "Choose 2 roles as teams for team generation",
    options: [
      {
        type: 8, // ROLE
        name: "team_1",
        description: "First team role",
        required: true,
      },
      {
        type: 8, // ROLE
        name: "team_2",
        description: "Second team role",
        required: true,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_WALLET_CONFIG_COMMAND = {
    name: "set-wallet-config",
    description: "Set the token emoji",
    options: [
      {
        type: 3, // STRING
        name: "token_emoji",
        description: "Token Emoji (e.g., 😃)",
        required: true,
      },
      {
        type: 5, // BOOLEAN
        name: "extra_currency_active",
        description: "Do you want to set the extra currency active?",
        required: false,
      },
      {
        type: 3, // STRING
        name: "extra_token_emoji",
        description: "Token Emoji (e.g., 😃)",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_BOT_CHANNEL_COMMAND = {
    name: "set-bot-channel",
    description: "Set the bot channel for updates",
    options: [
      {
        type: 7, // CHANNEL
        name: "channel",
        description: "Choose a channel",
        required: true,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const GAMES_COMMAND = {
    name: "games",
    description: "Show a list of all the games",
  };

  const NEXT_GAMES_COMMAND = {
    name: "upcoming-games",
    description: "Show a list of all the upcoming games",
  };

  const RESET_TEAMS_COMMAND = {
    name: "reset-teams",
    description: "Remove all users from the set teams",
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_STATUS_COMMAND = {
    name: "set-status",
    description: "Set a custom status for Paimon",
    options: [
      {
        type: 3, // STRING
        name: "status",
        description: "Choose a status",
        required: true,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const MANAGE_GAMES_COMMAND = {
    name: "manage-games",
    description: "Add, remove a game from the list",
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const START_EVENT_COMMAND = {
    name: "start-event",
    description: "Start an event with team generation",
    options: [
      {
        type: 3, // STRING
        name: "name",
        description: "Choose the name / title of your event",
        required: true,
      },
      {
        type: 3, // STRING
        name: "description",
        description: "Choose the description of your event",
        required: true,
      },
      {
        type: 4, // STRING
        name: "max_members_per_team",
        description: "Choose the maximum amount of members per team",
        required: false,
      },
      {
        type: 4, // NUMBER
        name: "expiration",
        description:
          "Select the number of hours for team generation and signup deadline (default: 24 hours)",
        required: false,
      },
      {
        type: 3, // STRING
        name: "image",
        description: "Add an image link to add to your event post",
        required: false,
      },
      {
        type: 3, // STRING
        name: "color",
        description: "Select the color of the embed",
        required: false,
        choices: [
          { name: "purple", value: "purple" },
          { name: "red", value: "red" },
          { name: "yellow", value: "yellow" },
          { name: "green", value: "green" },
          { name: "cyan", value: "cyan" },
          { name: "blue", value: "blue" },
          { name: "pink", value: "pink" },
        ],
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const CANCEL_EVENT_COMMAND = {
    name: "cancel-event",
    description: "Cancel current event",
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const SET_CHANNEL_NAME_CONFIGURATION_COMMAND = {
    name: "set-channel-name-configuration",
    description:
      "Set the channel name configuration for the channel creation reward.",
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const TROLL_MISSIONS_COMMAND = {
    name: "troll-missions",
    description: "Show a list of all the troll missions",
  };

  const MANAGE_TROLL_MISSIONS_COMMAND = {
    name: "manage-troll-missions",
    description: "Add, remove or update a troll mission",
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const TROLL_USER_COMPLETE_MISSION_COMMAND = {
    name: "troll-user-complete-mission",
    description: `Complete a trolled user's mission, if no message link is added, last message will be used`,
    options: [
      {
        type: 6, // USER
        name: "user",
        description: "Select a user to complete its troll mission",
        required: true,
      },
      {
        type: 3, // STRING
        name: "message-link",
        description:
          "Copy the message link of the completed mission to post it to server",
        required: false,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const CREATE_IMAGE_COMMAND = {
    name: "create-image",
    description: "Creates an image using AI",
    options: [
      {
        type: 3, // STRING
        name: "prompt",
        description: "Choose a prompt for your image creation",
        required: true,
      },
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  };

  const CREATE_IMAGE_SETTINGS_COMMAND = {
    name: "create-image-settings",
    description:
      "Open the settings for image creation, change models, dimensions or add LoRas.",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  };

  const SEND_EMBED_COMMAND = {
    name: "send-embed",
    description: "Send a simple embed",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 3, // STRING
        name: "title",
        description: "Select the title for the embed",
        required: true,
      },
      {
        type: 3, // STRING
        name: "message",
        description: "Select the message for the embed",
        required: true,
      },
      {
        type: 3, // STRING
        name: "color",
        description: "Select the color in hex format for the embed",
        required: false,
      },
    ],
  };

  const SEND_EMBED_FILE_COMMAND = {
    name: "send-embed-file",
    description: "Send an embed using a JSON file",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 7, // CHANNEL
        name: "channel",
        description: "Select the channel to send the embed",
        required: true,
      },
      {
        type: 11, // ATTACHMENT
        name: "file",
        description: "Upload a JSON file containing the embed data",
        required: true,
      },
    ],
  };

  const DOWNLOAD_EMBED_FILE_COMMAND = {
    name: "download-embed-file",
    description: "Download an embed as a JSON file",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 3, // STRING
        name: "message",
        description: "Copy the link to the message and send it here",
        required: true,
      },
    ],
  };

  const EDIT_EMBED_FILE_COMMAND = {
    name: "edit-embed-file",
    description: "Edit an already sent embed with a JSON file",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 3, // STRING
        name: "message",
        description: "Copy the link to the message and send it here",
        required: true,
      },
      {
        type: 11, // ATTACHMENT
        name: "file",
        description: "Upload a JSON file containing the embed data",
        required: true,
      },
    ],
  };

  const SET_STAFF_ROLE_COMMAND = {
    name: "set-staff-role",
    description: "Configure the staff role",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 8, // ROLE
        name: "role",
        description: "Select the role to assign as the staff role",
        required: true,
      },
    ],
  };

  const INTRODUCTION_COMMAND = {
    name: "introduction",
    description: "Introduce yourself to the server!",
    options: [
      {
        type: 3, // STRING
        name: "gamertag",
        description: "Your in game name",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "age",
        description: "Your age",
        required: true,
      },
      {
        type: 3, // STRING
        name: "country",
        description: "The country you're from",
        required: true,
        autocomplete: true,
      },
      {
        type: 3, // STRING
        name: "occupation",
        description: "What you do (job, school, etc.)",
        required: true,
      },
      {
        type: 3, // STRING
        name: "hobbies",
        description: "What do you like to do?",
        required: true,
      },
      {
        type: 3, // STRING
        name: "favorite_character",
        description: "Your favorite character",
        required: true,
        autocomplete: true,
      },
      {
        type: 3, // STRING
        name: "game_goal",
        description: "Your goal in " + game.game,
        required: true,
      },
      {
        type: 3, // STRING
        name: "about_me",
        description: "Anything else you'd like to share about you",
        required: true,
      },
      {
        type: 3, // STRING
        name: "name",
        description: "Your name or nickname",
        required: false,
      },
      {
        type: 11, // ATTACHMENT
        name: "picture",
        description: "Upload a profile picture or IRL photo",
        required: false,
      },
    ],
  };

  const SET_INTRODUCTION_CHANNEL_COMMAND = {
    name: "set-introduction-channel",
    description: "Set the introduction channel where the bot should post",
    options: [
      {
        type: 7, // CHANNEL
        name: "channel",
        description: "Choose a channel",
        required: true,
      },
    ],
    default_member_permissions: defaultManageGuildPermission, // Manage Server permission
    dm_permission: false, // Command can’t be used in DMs
  };

  const MANAGE_DAILY_CHARACTER_POLL_COMMAND = {
    name: "manage-daily-character-poll",
    description: "Configure the daily character poll",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 5, // BOOLEAN
        name: "active",
        description: "Is the daily character poll active?",
        required: true,
      },
      {
        type: 7, // ROLE
        name: "channel",
        description:
          "In which channel should the daily character poll be posted?",
        required: true,
      },
    ],
  };

  const REGISTER_SLASH_COMMANDS_COMMAND = {
    name: "register-slash-commands",
    description: "Register new slash commands.",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
  };

  const LEVEL_CONFIG_COMMAND = {
    name: "level-config",
    description: "Configure the level system",
    default_member_permissions: 0x20, // Manage Guild Permission (Administrator)
    options: [
      {
        type: 4, // INTEGER
        name: "message_count",
        description: "How many messages per level?",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "exp_points",
        description: "How many exp points per level?",
        required: true,
      },
      {
        type: 7, // CHANNEL
        name: "channel",
        description: "Choose a channel",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "reward",
        description:
          "After how many levels should a coin be rewarded to the user? Use 0 to disable.",
        required: true,
      },
      {
        type: 4, // INTEGER
        name: "reward_extra",
        description:
          "After how many levels should the extra currency be rewarded to the user? Use 0 to disable.",
        required: true,
      },
    ],
  };

  const LEVEL_COMMAND = {
    name: "level",
    description: "Check out your current level",
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
    SET_WALLET_CONFIG_COMMAND,
    SET_BOT_CHANNEL_COMMAND,
    GAMES_COMMAND,
    NEXT_GAMES_COMMAND,
    RESET_TEAMS_COMMAND,
    SET_STATUS_COMMAND,
    START_EVENT_COMMAND,
    MANAGE_GAMES_COMMAND,
    CANCEL_EVENT_COMMAND,
    SET_CHANNEL_NAME_CONFIGURATION_COMMAND,
    TROLL_MISSIONS_COMMAND,
    MANAGE_TROLL_MISSIONS_COMMAND,
    TROLL_USER_COMPLETE_MISSION_COMMAND,
    SEND_EMBED_COMMAND,
    SEND_EMBED_FILE_COMMAND,
    DOWNLOAD_EMBED_FILE_COMMAND,
    EDIT_EMBED_FILE_COMMAND,
    SET_STAFF_ROLE_COMMAND,
    INTRODUCTION_COMMAND,
    SET_INTRODUCTION_CHANNEL_COMMAND,
    MANAGE_DAILY_CHARACTER_POLL_COMMAND,
    REGISTER_SLASH_COMMANDS_COMMAND,
    LEVEL_CONFIG_COMMAND,
    LEVEL_COMMAND,
    ...(process.env.COMFYUI_ADDRESS ? [CREATE_IMAGE_COMMAND] : []), // Conditionally add CREATE_IMAGE_COMMAND
    ...(process.env.COMFYUI_ADDRESS ? [CREATE_IMAGE_SETTINGS_COMMAND] : []), // Conditionally add CREATE_IMAGE_COMMAND
  ];

  // Register or update the existing commands
  try {
    // Pass guildId to register commands for a specific guild
    await InstallGuildCommands(process.env.APP_ID, NEW_COMMANDS, guildId);
    await InstallGlobalCommands(process.env.APP_ID, [
      ...(process.env.COMFYUI_ADDRESS
        ? [CREATE_IMAGE_COMMAND, CREATE_IMAGE_SETTINGS_COMMAND]
        : []), // Register both commands globally if COMFYUI_ADDRESS is set
    ]);
    logger.success("Successfully registered or updated commands.");
  } catch (error) {
    logger.error("Error registering commands:", error);
  }
}

module.exports = registerCommands;
