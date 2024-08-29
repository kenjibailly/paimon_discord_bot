# Paimon Bot

The idea is that game events will be held within the discord server. Users will be able to join a team and the role will be awarded to them. The winning team gets awarded tokens.

Everyone who wants to join the next game event can react to a message and will be added towards the random team generation. A total of 2 teams will be randomly generated.

Award tokens to roles, all users in that said role will get their tokens. Users can then use their tokens for various rewards using the shop.

Shop rewards:
- add custom emoji next to name
- add custom server emoji
- add custom channel
- change someone's nickname of choice
- choose next game
- add custom role name and color
- add custom soundboard sound

After X amount of time, the reward will be removed and can be configured in the settings, or all rewards can be removed with a command, for example when a game event has started/ended.

# How to install

Copy `.env.sample` and paste it in the same directory, rename it to `.env`. Or use this command:
We will fill in the variables later.
```bash
cp .env.example .env
```

## Discord Developer Portal

Go to the [Discord Developer Portal](https://discord.com/developers/applications/) and create a `New Application`.

Under the `General Information` tab, find `Interactions Endpoint URL` and add your url your proxied ending in `/interactions`.
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

## Docker

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

## How to add slash commands

When adding or removing a slash command, the following command must be executed in order for Discord to acknowledge the slash command:

```bash
node commands/deploy-commands.js
```

## Discord

Move the bot's role to the top of the hierarchy or it will have permissions issues.