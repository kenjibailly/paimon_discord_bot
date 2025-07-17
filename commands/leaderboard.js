async function handleLeaderboardCommand(interaction) {}

function drawText(ctx, value, size, posx, posy, shadowoffset, align = "left") {
  if (!value) return;
  ctx.save();
  ctx.font = size + 'px "Nougat"'; // Use the registered family name

  ctx.strokeStyle = "black";
  ctx.shadowColor = "black"; // Fully opaque black
  ctx.shadowBlur = 0; // No blur
  ctx.shadowOffsetX = 0; // No horizontal shift
  ctx.shadowOffsetY = shadowoffset; // Push shadow downward (adjust as needed)

  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;

  ctx.textAlign = align;

  ctx.strokeText(`${value}`, posx, posy);

  ctx.fillText(`${value}`, posx, posy);
  ctx.restore();
}

module.exports = handleLeaderboardCommand;
