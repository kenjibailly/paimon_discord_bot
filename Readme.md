<div align="center">

# 🤖 Paimon Event Bot

The idea is that game events will be held outside of Discord. One team goes against the other. The winning team gets awarded tokens through a slash command performed by the staff.

Those who wants to join the game event can react to a message and will be added towards the random team generation. A total of 2 teams will be randomly generated.

Award tokens to roles, all users in that said role will get their tokens. Users can then use their tokens for various rewards using the shop.

After X amount of time, the reward will be removed and can be configured in the settings, or all rewards can be removed with a command, for example when a game event has started/ended.

</div>

## ⚙️ Technical information

Used in this project:
- Docker
- MongoDB
- Nodejs (Discordjs)

## 💾 How to install

### 💻 Local
<details>

<summary>🛠️ Open for installation steps</summary>

1. Clone the repository

    ```bash 
    git clone https://github.com/kenjibailly/paimon_discord_bot
    ```

2. Copy example .env file and make changes:

    > We will fill in the variables later.

    ```bash
    cp .env.example .env
    ```

3. Run the Docker Compose

    ```bash
    docker-compose up -d
    ```
</details>

### ⚓ Docker

<details>

<summary>🛠️ Open for installation steps</summary>

Edit `docker-compose.yml`:

> Network `swag` is the network you put your swag / nginx-proxy-manager / nginx container in, change to your own existing network. 

```bash
docker-compose up -d
```

Create a proxy to your (sub)domain with swag / nginx-proxy-manager / nginx. 
```
http://discord_bot_paimon:3000
```
And add a CNAME for your sub domain if used.

</details>


### 🌀 Discord Developer Portal

<details>

<summary>🛠️ Open for installation steps</summary>

Go to the [Discord Developer Portal](https://discord.com/developers/applications/) and create a `New Application`.

Under the `General Information` tab, find `Interactions Endpoint URL` and add your url you proxied ending in `/interactions`.
Example:
```
https://sub.domain.com/interactions
```

Under the `Installation` tab, find `Guild Install` at the bottom, add `bot` to scopes and add `Administrator` to permissions.

Under the `Bot` tab, find `Privileged Gateway Intents` and enable:
- `Presence Intent`
- `Server Members Intent`
- `Message Content Intent`

Now we will fill in the .env file we created.
- Under the `General Information` tab, find `Application ID` and click copy. Paste it in your .env file after `APP_ID=`.
- Under the `General Information` tab, find `Public Key` and click copy. Paste it in your .env file after `PUBLIC_KEY=`.
- Under the `Bot` tab, find `Token` and click reset token, copy it. Paste it in your .env file after `DISCORD_TOKEN=`.
- Under the `OAuth2` tab, find `Client Secret` and click reset secret, copy it. Paste it in your .env file after `DISCORD_CLIENT_SECRET=`.

Now invite your Discord bot to your server.
Under the `OAuth2` tab, find `OAuth2 URL Generator` and check `bot` under the scopes, then check `Administrator` under the bot permissions. Now find `Generated URL` at the bottom of the page and copy the link. Open the link in your browser and invite the Discord Bot to your server.

</details>


### 💾 Register Discord Slash Commands

<details>

<summary>✅ Information</summary>

The slash commands are automatically registered when the bot enters the server. 
When a game is being added or removed from the list, this specific slash command is being added, updated or removed.

> The Discord client has to be refreshed before the change in the slash command(s) get updated. `ctrl + R` on windows. Restart app on mobile.

</details>

### 👾 Discord

<details>

<summary>🛠️ Open for installation steps</summary>

Go to `Server Settings` > `Roles` and move the bot's role to the top of the hierarchy or it will have permissions issues.

Change the permissions of the commands of the bot. Go to `Server Settings` > `Integrations`, find the bot under `Bots and Apps` and click on `Manage`. Configure each command's permissions to your preference.

</details>

# Functionality

### 🦜 Slash Commands:

#### 🎉 General Functions

- ✅ /shop
    - Opens the shop
- ✅ /wallet
    - Checks your wallet balance
- ✅ /games
    - Lists the upcoming games

#### 🧑‍💼 Staff functions

- ✅  /award-team
    - Awards a role 🪙
    - Input: `role`, `amount`, optional: `reason`
- ✅  /award-user
    - Awards a user 🪙
    - Input: `user`, `amount`, optional: `reason`
- ✅  /deduct-user
    - Deducts 🪙 from a user
    - Input: `user`, `amount`, optional: `reason`
- ❌ /start-event
    - Creates event, users can apply to this event to be added to the team generation
    - Input: `event name`, `description`, `game`, `channel`, optional: `image link`
- ✅ /reset-teams
    - Removes all users from the roles created for the team generation to start over
- ✅ /add-game
    - Adds game to the list
    - Input: `game`
- ✅ /remove-game
    - Removes game
    - Input: `game name list`
- ✅ /update-game
    - Removes game
    - Input: `game name list`

#### ⚙️ Settings

- ✅ /set-teams
    - Choose 2 roles to be assigned as teams for the team generation
    - Input: `role`, `role`
- ✅ /set-reward
    - Sets the price per reward and / or time the reward gets removed after and / or enable or disable the reward
    - Input: `reward name list`, optional: `price`, optional: `time`, optional: `enable/disable`
- ✅ /set-all-rewards
    - Sets the price of all rewards and / or time all the rewards gets removed after, default: `30 days`
    - Input: `time`
- ✅ /set-token-emoji
    - Sets the token emoji to your preferred emoji, custom emoji are allowed, default: 🪙
    - Input: `emoji`
- ✅ /set-bot-channel
    - Sets the channel of the bot where updates are posted, like reset of awards
    - Input: `channel`


Rewards are automatically set to be all enabled and have a default price of 1 🪙;

### 🏪 Shop 

When opening the shop, the user can click a button to start interacting with the bot in a private thread. The bot will guide the user and ask the required things needed in order for the reward to be claimed and the wallet to be deducted.

#### 🏆 Rewards:
- ✅ Change your nickname
- ✅ Change someone's nickname
- ❌ Add a custom server emoji
- ❌ Add a custom channel
- ❌ Add a custom role name and color
- ❌ Add a custom soundboard sound
- ❌ Choose the next game

### 💪 Join event and assign team

- ❌ Users apply to join event, those who applied will be randomly assigned to a team
- ❌ Assign applied users to random team