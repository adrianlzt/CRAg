import { saveAs } from 'file-saver';
import { AppState, Annotation } from '../types';
import { HOLD_TYPES } from '../components/HoldSelector';
import { calculateWrappedTextHeight, wrapText } from './canvas-utils';

const getHoldColor = (annotation: Annotation) => {
  switch (annotation.data.handColor) {
    case 'red': return '#ef4444';
    case 'green': return '#10b981';
    case 'blue': return '#3b82f6';
    case 'yellow': return '#eab308';
    default: return '#f97316';
  }
};

export async function exportAsImage(
  state: AppState,
  toast: any
) {
  if (state.photos.length === 0) {
    toast({ title: "Cannot export", description: "There are no photos to export.", variant: "destructive" });
    return;
  }

  const { id: toastId, update } = toast({
    title: 'Exporting as Image',
    description: 'Please wait while the image is being generated...',
  });

  const fetchedIcons: { [key: string]: HTMLImageElement } = {};
  try {
    await Promise.all(
      HOLD_TYPES.map(holdType => new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          fetchedIcons[holdType.id] = img;
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load icon: ${holdType.icon}`));
        img.src = holdType.icon;
      }))
    );
  } catch (error) {
    console.error("Failed to fetch icons:", error);
    update({
      id: toastId,
      title: 'Export Failed',
      description: 'Could not load hold icons for export.',
      variant: 'destructive',
    });
    return;
  }

  try {
    const PADDING = 50;

    // 1. Load all images to get their dimensions
    const loadedImages = await Promise.all(
      state.photos.map(p => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = p.url;
      }))
    );

    // 2. Calculate canvas dimensions
    const maxWidth = Math.max(...loadedImages.map(img => img.width));
    const totalImageHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);

    // Dynamically scale font sizes based on the image width. Reference is 16px for 1000px wide.
    const scaleFactor = maxWidth > 0 ? maxWidth / 1000 : 1;
    const FONT_SIZE_PROJECT_TITLE = Math.max(24, Math.round(32 * scaleFactor));
    const FONT_SIZE_TITLE = Math.max(12, Math.round(20 * scaleFactor));
    const FONT_SIZE_BODY = Math.max(10, Math.round(16 * scaleFactor));
    const LINE_HEIGHT = Math.max(15, Math.round(24 * scaleFactor));

    // Calculate the height needed for the text area
    let textAreaHeight = 0;
    if (state.projectDescription) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.font = `${FONT_SIZE_BODY}px sans-serif`;
        const descriptionHeight = calculateWrappedTextHeight(tempCtx, state.projectDescription, maxWidth, LINE_HEIGHT);
        textAreaHeight = (LINE_HEIGHT * 1.5) + descriptionHeight + LINE_HEIGHT;
      } else {
        textAreaHeight = 400; // Fallback
      }
    }

    const usedHoldTypeIds = new Set(
      state.annotations
        .filter((a) => a.type === 'hold')
        .map((a) => a.data.holdType || a.data.holdTypeId)
    );
    const legendItems = HOLD_TYPES.filter((ht) => usedHoldTypeIds.has(ht.id));
    const legendIconSize = FONT_SIZE_BODY * 1.5;
    const legendLineHeight = Math.max(legendIconSize, FONT_SIZE_BODY) * 1.2;

    let legendAreaHeight = 0;
    if (legendItems.length > 0) {
      legendAreaHeight += (LINE_HEIGHT * 1.5); // For title and spacing
      legendAreaHeight += legendItems.length * legendLineHeight;
      legendAreaHeight += LINE_HEIGHT; // Extra padding at the bottom
    }

    const projectTitleAreaHeight = state.projectName ? FONT_SIZE_PROJECT_TITLE + PADDING : 0;

    const canvasWidth = maxWidth + PADDING * 2;
    const canvasHeight = projectTitleAreaHeight + totalImageHeight + textAreaHeight + legendAreaHeight + PADDING * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // 3. Draw background and images with annotations
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let currentY = PADDING;

    if (state.projectName) {
      ctx.fillStyle = 'black';
      ctx.font = `bold ${FONT_SIZE_PROJECT_TITLE}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(state.projectName, canvasWidth / 2, currentY);
      currentY += FONT_SIZE_PROJECT_TITLE + PADDING;
    }

    // Restore default alignment
    ctx.textAlign = 'left';

    for (let i = 0; i < state.photos.length; i++) {
      const photo = state.photos[i];
      const img = loadedImages[i];
      const offsetX = (maxWidth - img.width) / 2 + PADDING;

      // Draw the image
      ctx.drawImage(img, offsetX, currentY);

      // Filter annotations for this photo
      const photoAnnotations = state.annotations.filter(a => a.photoId === photo.id);

      // Draw annotations on the main canvas
      for (const annotation of photoAnnotations) {
        if (annotation.type === 'hold') {
          const x = offsetX + annotation.x;
          const y = currentY + annotation.y;
          const rotation = annotation.data.rotation || 0;
          const scale = annotation.data.scale || 1;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);

          if (annotation.data.handColor === 'green' || annotation.data.handColor === 'yellow' || annotation.data.handColor === 'purple') {
            ctx.scale(-1, 1);
          }

          // Draw background circle
          ctx.strokeStyle = getHoldColor(annotation);
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.arc(0, 0, 18 * scale, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw Hold type icon
          const holdTypeId = annotation.data.holdType || annotation.data.holdTypeId;
          const iconImage = fetchedIcons[holdTypeId];

          if (iconImage) {
            ctx.globalAlpha = 1.0;
            ctx.shadowColor = "black";
            ctx.shadowBlur = 2;

            const iconSize = 24 * scale;
            ctx.drawImage(iconImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);

            ctx.shadowBlur = 0; // reset shadow
          }

          ctx.restore();
        } else if (annotation.type === 'line') {
          const points = annotation.data.points as number[];
          if (points && points.length >= 4) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = annotation.data.color || '#f97316';
            ctx.lineWidth = annotation.data.width || 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(offsetX + points[0], currentY + points[1]);
            for (let i = 2; i < points.length; i += 2) {
              ctx.lineTo(offsetX + points[i], currentY + points[i + 1]);
            }
            ctx.stroke();
            ctx.restore();
          }
        } else if (annotation.type === 'text' && annotation.data.text) {
          const x = offsetX + annotation.x;
          const y = currentY + annotation.y;
          const rotation = annotation.data.rotation || 0;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);

          const fontSize = annotation.data.fontSize || 16;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          const TEXT_PADDING = 5;
          const textLines = annotation.data.text.split('\n');
          const lineHeight = fontSize * 1.2;
          const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));

          const rectWidth = textWidth + TEXT_PADDING * 2;
          const rectHeight = (textLines.length * lineHeight) - (lineHeight - fontSize) + TEXT_PADDING * 2;

          // Draw background
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillRect(0, 0, rectWidth, rectHeight);

          // Draw text
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 2;
          ctx.fillStyle = '#000000';
          textLines.forEach((line, index) => {
            ctx.fillText(line, TEXT_PADDING, TEXT_PADDING + (index * lineHeight));
          });

          ctx.restore();
        }
      }

      currentY += img.height;
    }

    // 4. Draw descriptions
    let textY = currentY + PADDING;
    ctx.fillStyle = 'black';

    if (state.projectDescription) {
      if (textY < canvasHeight - PADDING) {
        ctx.font = `bold ${FONT_SIZE_TITLE}px sans-serif`;
        ctx.fillText("Route Description", PADDING, textY);
        textY += LINE_HEIGHT * 1.5;

        ctx.font = `${FONT_SIZE_BODY}px sans-serif`;
        textY = wrapText(ctx, state.projectDescription, PADDING, textY, maxWidth, LINE_HEIGHT);
        textY += LINE_HEIGHT;
      }
    }

    // Draw Legend
    if (legendItems.length > 0) {
      if (state.projectDescription) {
        textY += LINE_HEIGHT; // Add space after description
      }
      ctx.font = `bold ${FONT_SIZE_TITLE}px sans-serif`;
      ctx.fillStyle = 'black';
      ctx.fillText("Legend", PADDING, textY);
      textY += LINE_HEIGHT * 1.5;

      ctx.font = `${FONT_SIZE_BODY}px sans-serif`;
      ctx.textBaseline = 'top';
      const legendIconSpacing = FONT_SIZE_BODY * 0.5;

      for (const item of legendItems) {
        const iconImage = fetchedIcons[item.id];
        if (iconImage) {
          const iconY = textY + (legendLineHeight - legendIconSize) / 2;
          ctx.drawImage(iconImage, PADDING, iconY, legendIconSize, legendIconSize);
        }
        const textX = PADDING + legendIconSize + legendIconSpacing;
        const textRenderY = textY + (legendLineHeight - FONT_SIZE_BODY) / 2;
        ctx.fillStyle = 'black';
        ctx.fillText(item.name, textX, textRenderY);
        textY += legendLineHeight;
      }
    }

    // 5. Trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const safeProjectName = (state.projectName || 'climbing-route').replace(/[\s/\\?%*:|"<>]/g, '_');
        saveAs(blob, `${safeProjectName}.jpg`);
        update({
          id: toastId,
          title: 'Export Successful',
          description: 'Your image has been downloaded.',
        });
      } else {
        throw new Error("Canvas to Blob conversion failed");
      }
    }, 'image/jpeg');

  } catch (error) {
    console.error("Failed to export as image:", error);
    update({
      id: toastId,
      title: 'Export Failed',
      description: (error as Error).message || 'An unknown error occurred.',
      variant: 'destructive',
    });
  }
}
