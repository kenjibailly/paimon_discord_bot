const { createCanvas, loadImage } = require("canvas");
const { AttachmentBuilder } = require("discord.js");

async function handleIntroductionCommand(interaction, client) {
  const name = interaction.options.getString("name");
  const age = interaction.options.getInteger("age");
  const country = interaction.options.getString("country");
  const jobOrStudy = interaction.options.getString("job_or_study");
  const hobbies = interaction.options.getString("hobbies");
  const favoriteBrawler = interaction.options.getString("favorite_brawler");
  const picture = interaction.options.getAttachment("picture");
  const brawlGoal = interaction.options.getString("brawl_goal");
  const extra = interaction.options.getString("extra");

  const providedFields = [
    name,
    age,
    country,
    jobOrStudy,
    hobbies,
    favoriteBrawler,
    picture,
    brawlGoal,
    extra,
  ].filter(Boolean);

  if (providedFields.length === 0) {
    return interaction.reply({
      content: "❌ Please provide at least one field to introduce yourself.",
      ephemeral: true,
    });
  }

  // Canvas settings
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#6dd5ed"); // Light blue
  gradient.addColorStop(1, "#2193b0"); // Dark blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Text settings
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Sans-serif";
  ctx.fillText(`Introduction: ${name || interaction.user.username}`, 40, 60);

  ctx.font = "20px Sans-serif";
  let y = 110;

  const drawField = (label, value) => {
    if (!value) return;
    ctx.fillText(`${label}: ${value}`, 40, y);
    y += 40;
  };

  drawField("Age", age);
  drawField("Country", country);
  drawField("Job/Study", jobOrStudy);
  drawField("Hobbies", hobbies);
  drawField("Favorite Brawler", favoriteBrawler);
  drawField("Brawl Stars Goal", brawlGoal);
  drawField("Extra", extra);

  // Add profile picture if present
  if (picture) {
    try {
      const image = await loadImage(picture.url);
      const imgSize = 128;
      ctx.beginPath();
      ctx.arc(
        width - imgSize - 40 + imgSize / 2,
        80 + imgSize / 2,
        imgSize / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, width - imgSize - 40, 80, imgSize, imgSize);
    } catch (err) {
      console.error("Failed to load image:", err);
    }
  }

  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer, {
    name: "introduction.png",
  });

  return interaction.editReply({
    content: `📢 <@${interaction.user.id}> has introduced themselves!`,
    files: [attachment],
  });
}

module.exports = handleIntroductionCommand;
