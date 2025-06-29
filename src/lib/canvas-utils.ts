export function calculateWrappedTextHeight(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const textLines = text.split('\n');
  let currentY = 0;

  for (const textLine of textLines) {
    const words = textLine.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    currentY += lineHeight;
  }
  return currentY;
}

export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const textLines = text.split('\n');
  let currentY = y;

  for (const textLine of textLines) {
    const words = textLine.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export async function drawSvgOnCanvas(
  ctx: CanvasRenderingContext2D,
  svgString: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      resolve();
    };
    img.onerror = (err) => {
      console.error("Failed to load SVG for canvas drawing:", err);
      reject(err);
    };
    // Use fill='white' as the original code used white fill for the emoji
    const coloredSvg = svgString.replace('<svg', `<svg fill='white'`);
    img.src = `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
  });
}
