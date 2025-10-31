export const createGradientDataUrl = (gradient, width = 1600, height = 900) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Convert the CSS angle (clockwise from top) to canvas angle (counterclockwise from right)
    const cssAngle = gradient.angle ?? 90; // default to 90deg if not specified
    // Convert to radians and adjust coordinate system
    const angleInRadians = (450 - cssAngle) % 360 * Math.PI / 180;
    
    // Calculate diagonal length to ensure gradient covers the entire canvas
    const diagonalLength = Math.sqrt(width * width + height * height);
    
    // Calculate gradient start and end points from the center
    const centerX = width / 2;
    const centerY = height / 2;
    const startX = centerX + Math.cos(angleInRadians) * diagonalLength;
    const startY = centerY + Math.sin(angleInRadians) * diagonalLength;
    const endX = centerX - Math.cos(angleInRadians) * diagonalLength;
    const endY = centerY - Math.sin(angleInRadians) * diagonalLength;
    
    const g = ctx.createLinearGradient(startX, startY, endX, endY);
    g.addColorStop(0, `#${gradient.start}`);
    g.addColorStop(1, `#${gradient.end}`);

    ctx.fillStyle = g;
    ctx.globalAlpha = gradient.opacity ?? 1;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Could not create gradient canvas, falling back to solid color', e);
    return null;
  }
};