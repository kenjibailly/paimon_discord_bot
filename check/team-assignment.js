const Events = require("../models/events");
const TeamAssignments = require("../models/team-assignments");
const Teams = require("../models/teams");
const { EmbedBuilder } = require("discord.js");

// Helper function to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper function to fetch usernames for user IDs
async function fetchUsernames(userIds, client) {
  try {
    const users = await Promise.all(
      userIds.map((userId) => client.users.fetch(userId))
    );
    return users.map((user) => user.globalName);
  } catch (error) {
    logger.error("Error fetching usernames:", error);
    return [];
  }
}

// Helper function to assign users to a role in Discord
async function assignUsersToRole(guildId, users, roleId, client) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(roleId);
    const memberPromises = users.map((userId) =>
      guild.members.fetch(userId).then((member) => member.roles.add(role))
    );
    await Promise.all(memberPromises);
  } catch (error) {
    logger.error(
      `Error assigning users to role ${roleId} in guild ${guildId}:`,
      error
    );
  }
}

// Helper function to build and send the result embed
async function sendTeamsEmbed(
  event,
  team1Name,
  team2Name,
  team1Usernames,
  team2Usernames,
  client
) {
  try {
    const guild = await client.guilds.fetch(event.guild_id);
    const channel = await guild.channels.fetch(event.channel_id);

    // Format usernames as bullet points with bold names
    const formattedTeam1Usernames =
      team1Usernames.map((username) => `- **${username}**`).join("\n") ||
      "No members";
    const formattedTeam2Usernames =
      team2Usernames.map((username) => `- **${username}**`).join("\n") ||
      "No members";

    const embed = new EmbedBuilder()
      .setTitle(`${event.name} Teams`)
      .setDescription(
        `All users who have applied for **${event.name}** have now been assigned to the teams below:`
      )
      .addFields(
        { name: team1Name, value: formattedTeam1Usernames, inline: true },
        { name: team2Name, value: formattedTeam2Usernames, inline: true }
      )
      .setColor(event.color); // Adjust color if needed

    // Send the message
    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    logger.error("Error sending teams embed:", error);
  }
}

// Helper function to build and send the result embed for multiple teams
async function sendMultipleTeamsEmbed(event, teamUsernames, client) {
  try {
    const guild = await client.guilds.fetch(event.guild_id);
    const channel = await guild.channels.fetch(event.channel_id);

    // Format team usernames as bullet points with bold names
    const fields = teamUsernames.map((team, index) => ({
      name: `Team ${index + 1}`,
      value:
        team.map((username) => `- **${username}**`).join("\n") || "No members",
      inline: true,
    }));

    const embed = new EmbedBuilder()
      .setTitle(`${event.name} Teams`)
      .setDescription(
        `All users who have applied for **${event.name}** have now been assigned to the teams below:`
      )
      .addFields(...fields)
      .setColor(event.color); // Adjust color if needed

    // Send the message
    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    logger.error("Error sending multiple teams embed:", error);
  }
}

async function checkTeamAssignment(client) {
  try {
    const dateNow = new Date();

    // Find expired events
    const expiredEvents = await Events.find({
      $expr: {
        $lt: [
          {
            $add: [
              { $toDate: "$date" }, // Convert `date` field to Date object
              { $multiply: ["$expiration", 24 * 60 * 60 * 1000] }, // Convert `expiration` (in days) to ms and add to date
            ],
          },
          dateNow, // Current time
        ],
      },
    });

    if (expiredEvents.length > 0) {
      // Extract unique guild_ids from expired events
      const guildIds = [
        ...new Set(expiredEvents.map((event) => event.guild_id)),
      ];

      // Fetch team assignments for all extracted guild_ids
      const teamAssignments = await TeamAssignments.find({
        guild_id: { $in: guildIds },
      });
      // Fetch teams for all extracted guild_ids
      const teams = await Teams.find({ guild_id: { $in: guildIds } });

      // Organize team assignments by guild_id
      const assignmentsByGuild = teamAssignments.reduce(
        (guildMap, assignment) => {
          if (!guildMap[assignment.guild_id])
            guildMap[assignment.guild_id] = [];
          guildMap[assignment.guild_id].push(assignment.user);
          return guildMap;
        },
        {}
      );

      // Assign users to roles and send embed
      for (const event of expiredEvents) {
        if (event.max_members_per_team === null) {
          assignTwoTeams(client, teams, event, assignmentsByGuild);
        } else {
          assignMultipleTeams(client, event, assignmentsByGuild);
        }
        return;
      }
      return;
    }
  } catch (error) {
    logger.error("Check Team Assignments Error:", error);
  }
}

async function assignTwoTeams(client, teams, event, assignmentsByGuild) {
  // Organize teams by guild_id
  const teamsByGuild = teams.reduce((guildMap, team) => {
    guildMap[team.guild_id] = {
      team_1: team.team_1,
      team_2: team.team_2,
    };
    return guildMap;
  }, {});

  const guildId = event.guild_id;
  const users = assignmentsByGuild[guildId] || [];
  const roles = teamsByGuild[guildId];

  // Shuffle users to ensure random distribution
  shuffleArray(users);

  // Determine the number of users for each role
  const numTeam1 = Math.floor(users.length / 2);
  const numTeam2 = users.length - numTeam1;

  // Assign roles
  const team1Users = users.slice(0, numTeam1);
  const team2Users = users.slice(numTeam1);

  // Fetch role IDs and names
  const team1RoleId = roles.team_1;
  const team2RoleId = roles.team_2;

  const team1Role = await client.guilds.cache
    .get(guildId)
    .roles.fetch(team1RoleId);
  const team2Role = await client.guilds.cache
    .get(guildId)
    .roles.fetch(team2RoleId);
  const team1RoleName = team1Role.name;
  const team2RoleName = team2Role.name;

  // Add users to roles
  await assignUsersToRole(guildId, team1Users, team1RoleId, client);
  await assignUsersToRole(guildId, team2Users, team2RoleId, client);

  // Fetch usernames
  const team1Usernames = await fetchUsernames(team1Users, client);
  const team2Usernames = await fetchUsernames(team2Users, client);

  if (event.auto_team_generation) {
    // Send the embed message to the channel
    await sendTeamsEmbed(
      event,
      team1RoleName,
      team2RoleName,
      team1Usernames,
      team2Usernames,
      client
    );
  }

  // Remove the event from the database
  await Events.deleteOne({ _id: event._id });

  // Remove team assignments associated with the event
  await TeamAssignments.deleteMany({ event_id: event._id });

  return;
}

async function assignMultipleTeams(client, event, assignmentsByGuild) {
  const guildId = event.guild_id;
  const users = assignmentsByGuild[guildId] || [];

  if (users.length === 0) return;

  // Shuffle users for randomness
  shuffleArray(users);

  // Determine the number of teams needed
  const maxMembersPerTeam = event.max_members_per_team;
  const numTeams = Math.ceil(users.length / maxMembersPerTeam);

  // Distribute users into teams
  const teams = Array.from({ length: numTeams }, () => []);
  users.forEach((user, index) => {
    teams[index % numTeams].push(user);
  });

  // Fetch usernames
  const teamUsernames = await Promise.all(
    teams.map(async (team) => await fetchUsernames(team, client))
  );

  if (event.auto_team_generation) {
    // Send the embed message
    await sendMultipleTeamsEmbed(event, teamUsernames, client);
  }
  // Remove event and team assignments from the database
  await Events.deleteOne({ _id: event._id });
  await TeamAssignments.deleteMany({ event_id: event._id });

  return;
}

module.exports = checkTeamAssignment;
