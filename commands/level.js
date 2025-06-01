const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const Levels = require("../models/levels");
const LevelConfig = require("../models/level-config");
const { AttachmentBuilder } = require("discord.js");
const createEmbed = require("../helpers/embed");

// Constants
const WIDTH = 400;
const HEIGHT = 150;
const RADIUS = 20;

const levelGradients = [
  { min: 0, max: 10, colors: ["#FFD445", "#FF5757"] },
  { min: 11, max: 20, colors: ["#DD45FF", "#FF5757"] },
  { min: 21, max: 30, colors: ["#DD45FF", "#57D2FF"] },
  { min: 31, max: 40, colors: ["#45FF77", "#57D2FF"] },
  { min: 41, max: 50, colors: ["#45FF77", "#BC57FF"] },
];

async function handleLevelCommand(interaction, client, user, message) {
  registerFont("./introduction/fonts/Nougat-ExtraBlack.ttf", {
    family: "Nougat", // This name must match what you'll use in ctx.font
    weight: "bold", // Optional: helps with clarity
  });

  if (!user) {
    await interaction.deferReply();
  }

  const guildId = user ? message.guildId : interaction.guildId;
  const userId = user ? user : interaction.user.id;

  const config = await LevelConfig.findOne({ guild_id: guildId });

  if (!config) {
    const errorEmbed = createEmbed(
      "Level System Not Configured",
      "This server has not configured its level system yet.",
      "error"
    );
    return interaction.editReply({ embeds: [errorEmbed], flags: 64 });
  }

  let userLevel = await Levels.findOne({ guild_id: guildId, user_id: userId });

  if (!userLevel) {
    // If user doesn't exist in levels, create them with level 1
    userLevel = await Levels.create({
      guild_id: guildId,
      user_id: userId,
      message_count: 0,
    });
  }

  const level = calculateLevel(userLevel.message_count, config);
  const { exp, next_level_exp, exp_percentage } = calculateExp(
    userLevel.message_count,
    config
  );

  const canvas = await drawBackground(level);
  const ctx = canvas.getContext("2d");
  await drawProfile(ctx, interaction, user, client);

  let displayName;

  if (interaction?.user) {
    displayName = interaction.user.globalName?.toUpperCase();
  } else if (user && message?.author) {
    displayName = message.author.globalName?.toUpperCase();
  }

  // Fallback in case globalName is null or undefined
  if (!displayName) {
    displayName =
      interaction?.user?.username?.toUpperCase() ||
      message?.author?.username?.toUpperCase() ||
      "UNKNOWN USER";
  }

  drawText(ctx, displayName, 24, 142, 29 + 15, 2, 4);

  drawText(
    ctx,
    "LEVEL " + level,
    24,
    142,
    58 + 15,
    2,
    4,
    "left",
    getGradientColors(level)
  );
  drawText(
    ctx,
    exp + "/" + next_level_exp + " EXP",
    13,
    132 + 250,
    77 + 15,
    1,
    1,
    "right"
  );
  await drawExpBar(ctx, exp_percentage, getGradientColors(level));
  await drawRewards(ctx, level, config);

  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer, { name: "level-card.png" });

  if (user) {
    const targetChannel = await client.channels
      .fetch(config.channel)
      .catch(() => null);
    await targetChannel.send({
      content: `🎉 <@${message.author.id}> leveled up!`,
      files: [attachment],
    });
  } else {
    await interaction.editReply({ files: [attachment] });
  }
}

// Helper to draw rounded rect
function drawRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius,
  fillStyle = undefined
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

function getGradientColors(level) {
  for (const range of levelGradients) {
    if (level >= range.min && level <= range.max) {
      return range.colors;
    }
  }
  return ["#45FF77", "#BC57FF"];
}

async function drawBackground(level) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Rounded clip
  drawRoundedRect(ctx, 0, 0, WIDTH, HEIGHT, RADIUS);
  ctx.clip();

  const [startColor, endColor] = getGradientColors(level);
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const patternPath = path.join(__dirname, "../level/assets/pattern.png");
  const patternImg = await loadImage(patternPath);
  ctx.globalAlpha = 0.15;
  ctx.drawImage(patternImg, 0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 1;

  return canvas;
}

async function drawProfile(ctx, interaction, user, client) {
  const img_width = 107;
  const img_height = 122;
  const image = await loadImage("./introduction/assets/pfp-star.png");
  ctx.save();
  ctx.drawImage(image, 14, 14, img_width, img_height);
  ctx.restore();

  const imgSize = 73; // adjust as needed
  let imageURL;

  if (interaction?.user) {
    imageURL = interaction.user.displayAvatarURL({
      extension: "png",
      size: 512,
    });
  } else if (user && client) {
    const userObj = await client.users.fetch(user).catch(() => null);
    if (userObj) {
      imageURL = userObj.displayAvatarURL({
        extension: "png",
        size: 512,
      });
    }
  }

  try {
    const image = await loadImage(imageURL);

    const x = 31;
    const y = 39;

    // Step 1: Draw the circular profile picture
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + imgSize / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, imgSize, imgSize);
    ctx.restore();

    // Step 2: Draw the crescent-shaped inner shadow
    ctx.save();
    ctx.beginPath();

    // Outer circle (shadow base), slightly inset
    ctx.arc(x + imgSize / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);

    // Inner cut (creates the crescent), offset to bottom-right to carve away that side
    ctx.arc(
      x + imgSize / 2 + 2, // move right
      y + imgSize / 2 + 2, // move down
      imgSize / 2 - 2,
      0,
      Math.PI * 2,
      true // counter-clockwise to create subtraction effect
    );

    ctx.closePath();

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
    ctx.restore();
  } catch (err) {
    console.error("Failed to load image:", err);
  }
}

function drawText(
  ctx,
  value,
  size,
  posx,
  posy,
  shadowoffset,
  lineWidth,
  align = "left",
  gradient
) {
  if (!value) return;
  ctx.save();
  ctx.font = size + 'px "Nougat"';

  ctx.strokeStyle = "black";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadowoffset;

  ctx.lineWidth = lineWidth;
  ctx.textAlign = align;

  // If gradient is passed, create horizontal (left-to-right) linear gradient
  if (Array.isArray(gradient) && gradient.length === 2) {
    const textWidth = ctx.measureText(value).width;
    const grad = ctx.createLinearGradient(posx, posy, posx + textWidth, posy);
    grad.addColorStop(0, gradient[1]);
    grad.addColorStop(1, gradient[0]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = "#ffffff";
  }

  ctx.strokeText(`${value}`, posx, posy);
  ctx.fillText(`${value}`, posx, posy);
  ctx.restore();
}

function calculateLevel(message_count, config) {
  const level = Math.floor(message_count / config.message_count);
  return level;
}

function calculateExp(message_count, config) {
  const level = message_count / config.message_count; // current float level
  const exp = Math.round(level * config.exp_points); // total EXP accumulated
  const flooredLevel = Math.floor(level); // integer level

  const current_level_exp = flooredLevel * config.exp_points; // EXP needed to reach current level
  const next_level_exp = (flooredLevel + 1) * config.exp_points; // EXP needed for next level

  const exp_into_current_level = exp - current_level_exp;
  const exp_needed_for_next_level = next_level_exp - current_level_exp;

  const exp_percentage = Math.min(
    100,
    Math.max(0, (exp_into_current_level / exp_needed_for_next_level) * 100)
  );
  return { exp, next_level_exp, exp_percentage };
}

async function drawExpBar(ctx, exp_percentage, gradientColors) {
  const ypos = 95;

  // Draw background bar
  drawRoundedRect(ctx, 132, ypos, 250, 10, 5, "#2D2D2D");

  // Calculate width of progress bar (max width = 246)
  const progressWidth = (exp_percentage / 100) * 246;

  if (progressWidth <= 0) return; // nothing to draw if zero or negative

  // Create inverted gradient from right to left for progress bar
  const gradient = ctx.createLinearGradient(134 + progressWidth, 92, 134, 92);
  gradient.addColorStop(0, gradientColors[0]);
  gradient.addColorStop(1, gradientColors[1]);

  // Draw progress bar
  drawRoundedRect(ctx, 134, ypos + 2, progressWidth, 6, 5, gradient);
}

async function drawRewards(ctx, level, config) {
  const spacing = 2;
  const startX = 365;

  let drewMainReward = false;

  // Main reward (coin.png)
  if (config.reward && config.reward > 0) {
    const totalCoins = Math.floor(level / config.reward);
    if (totalCoins > 0) {
      const coinImage = await loadImage("./level/assets/coin.png");
      const coinSize = 15;
      const y = 110;
      const maxCoins = 13;
      const coinsToDraw = Math.min(totalCoins, maxCoins);

      for (let i = 0; i < coinsToDraw; i++) {
        const x = startX - i * (coinSize + spacing);
        ctx.drawImage(coinImage, x, y, coinSize, coinSize);
      }

      if (totalCoins > maxCoins) {
        const leftMostX = startX - (coinsToDraw - 1) * (coinSize + spacing);
        const textX = leftMostX - 5;
        const textY = y + 12;
        drawText(ctx, `${totalCoins}`, 13, textX, textY, 1, 1, "right");
      }

      drewMainReward = true;
    }
  }

  // Extra reward (reward_extra.png)
  if (config.reward_extra && config.reward_extra > 0) {
    const totalExtras = Math.floor(level / config.reward_extra);
    if (totalExtras > 0) {
      const extraImage = await loadImage("./level/assets/reward_extra.png");
      const extraSize = 20;
      const y = drewMainReward ? 125 : 105; // shift up if main reward is not shown
      const maxExtras = 10;
      const extrasToDraw = Math.min(totalExtras, maxExtras);

      for (let i = 0; i < extrasToDraw; i++) {
        const x = startX - i * (extraSize + spacing) - 5;
        ctx.drawImage(extraImage, x, y, extraSize, extraSize);
      }

      if (totalExtras > maxExtras) {
        const leftMostX = startX - (extrasToDraw - 1) * (extraSize + spacing);
        const textX = leftMostX - 10;
        const textY = y + 15;
        drawText(ctx, `${totalExtras}`, 13, textX, textY, 1, 1, "right");
      }
    }
  }
}

module.exports = { handleLevelCommand, calculateExp };
