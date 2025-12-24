import { Canvas, CanvasRenderingContext2D } from 'canvas';

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ResizeBehavior = 'aspectfit' | 'aspectfill' | 'stretch' | 'center';

function drawRelistenAlbumArt(
  canvas: Canvas,
  data: { artist: string; showDate: string; venue: string; location: string },
  targetFrame: Rect,
  resizing: ResizeBehavior
) {
  //// General Declarations
  const context = canvas.getContext('2d');

  //// Resize to Target Frame
  context.save();
  const resizedFrame = applyResizingBehavior(resizing, makeRect(0, 0, 1500, 1500), targetFrame);
  context.translate(resizedFrame.x, resizedFrame.y);
  context.scale(resizedFrame.w / 1500, resizedFrame.h / 1500);

  //// Color Declarations
  const gradientColor = 'rgba(0, 200, 255, 1)';
  const gradientColor2 = 'rgba(0, 172, 220, 1)';
  const gradientColor3 = 'rgba(0, 138, 176, 1)';
  const textForeground = 'rgba(255, 255, 255, 1)';

  //// Gradient Declarations
  function linearGradient1(g: CanvasGradient) {
    g.addColorStop(0, gradientColor);
    g.addColorStop(0.45, gradientColor2);
    g.addColorStop(1, gradientColor3);
    return g;
  }

  //// Page-1
  //// path-2 Drawing
  context.beginPath();
  context.rect(0, 0, 1500, 1500);
  context.fillStyle = linearGradient1(context.createLinearGradient(750, 0, 750, 1500));
  context.fill();

  //// Label Drawing
  const labelRect = makeRect(60, 55, 620.12, 81);
  context.fillStyle = textForeground;
  context.font = 'bold 72px Inter';
  context.textAlign = 'left';
  drawWrappedText(context, data.artist, labelRect, {
    align: 'left',
    minFontSize: 44,
  });

  //// Label 2 Drawing
  const label2Rect = makeRect(1170, 1375, 280.09, 81);
  context.fillStyle = textForeground;
  context.font = 'bold 72px Inter';
  context.textAlign = 'left';
  drawWrappedText(context, 'Relisten', label2Rect, { align: 'left', minFontSize: 44 });

  //// Group
  //// Label 3 Drawing
  context.save();
  context.translate(750, 420);

  const label3Rect = makeRect(-695, 0, 1390, 240);
  context.fillStyle = textForeground;
  context.font = 'bold 210px Inter';
  context.textAlign = 'center';
  drawWrappedText(context, data.showDate, label3Rect, { align: 'center', minFontSize: 128 });

  context.restore();

  const venueTop = 713.37;
  const relistenTop = 1375;
  const bottomPadding = 20;
  const blockGap = 20;
  const compactGap = 24;
  const availableHeight = relistenTop - bottomPadding - venueTop;
  const venueHeight = Math.round(availableHeight * 0.45);
  const locationHeight = Math.max(0, availableHeight - blockGap - venueHeight);
  let locationTop = venueTop + venueHeight + blockGap;

  //// Label 4 Drawing
  context.save();
  context.translate(750, venueTop);

  const labelWidth = 1390;
  let label4Rect = makeRect(-695, 0, labelWidth, venueHeight);
  let label5Rect = makeRect(-695, 0, labelWidth, locationHeight);
  context.fillStyle = textForeground;
  context.font = 'bold 140px Inter';
  context.textAlign = 'center';
  const venueText = data.venue;
  // const venueText = 'The MECCA';
  // const venueText = 'Suwannee Hulaween - Amphitheatre Stage, Spirit of the Suwannee Music Park';
  const locationText = data.location;
  // const locationText = 'Milwaukee, WI, USA';
  // const locationText = 'Fredericton, New Brunswick, Canada';
  const minVenueFontSize = 48;
  const minLocationFontSize = 36;
  const locationMaxScale = 0.7;
  const maxVenueFontSize = 140;
  const maxLocationFontSize = Math.round(maxVenueFontSize * locationMaxScale);
  const lineHeightMultiplier = 1.1;

  const { venueFontSize, locationFontSize } = fitPairedTextSizes(context, {
    venue: {
      text: venueText,
      rect: label4Rect,
      align: 'center',
      minFontSize: minVenueFontSize,
      maxFontSize: maxVenueFontSize,
      lineHeightMultiplier,
    },
    location: {
      text: locationText,
      rect: label5Rect,
      align: 'center',
      minFontSize: minLocationFontSize,
      maxFontSize: maxLocationFontSize,
      lineHeightMultiplier,
      verticalAlign: 'top',
    },
    maxSizeDeltaRatio: 0.33,
  });

  const venueMetrics = measureWrappedText(
    context,
    venueText,
    labelWidth,
    venueFontSize,
    lineHeightMultiplier
  );
  const locationMetrics = measureWrappedText(
    context,
    locationText,
    labelWidth,
    locationFontSize,
    lineHeightMultiplier
  );
  const compactTotal = venueMetrics.height + locationMetrics.height + compactGap;
  if (compactTotal <= availableHeight) {
    label4Rect = makeRect(-695, 0, labelWidth, venueMetrics.height);
    label5Rect = makeRect(-695, 0, labelWidth, locationMetrics.height);
    locationTop = venueTop + venueMetrics.height + compactGap;
  }

  drawWrappedText(context, venueText, label4Rect, {
    align: 'center',
    minFontSize: venueFontSize,
    maxFontSize: venueFontSize,
    lineHeightMultiplier,
  });

  context.restore();

  //// Label 5 Drawing
  context.save();
  context.translate(750, locationTop);

  context.fillStyle = textForeground;
  context.font = 'bold 140px Inter';
  context.textAlign = 'center';
  drawWrappedText(context, locationText, label5Rect, {
    align: 'center',
    minFontSize: locationFontSize,
    maxFontSize: locationFontSize,
    lineHeightMultiplier,
    verticalAlign: 'top',
  });

  context.restore();

  context.restore();
}

// Possible arguments for 'resizing' parameter are:
//   'aspectfit': The content is proportionally resized to fit into the target rectangle.
//   'aspectfill': The content is proportionally resized to completely fill the target rectangle.
//   'stretch': The content is stretched to match the entire target rectangle.
//   'center': The content is centered in the target rectangle, but it is NOT resized.
function applyResizingBehavior(resizing: ResizeBehavior, rect: Rect, targetRect: Rect) {
  if (
    targetRect === undefined ||
    equalRects(rect, targetRect) ||
    equalRects(targetRect, makeRect(0, 0, 0, 0))
  ) {
    return rect;
  }

  const scales = makeSize(0, 0);
  scales.w = Math.abs(targetRect.w / rect.w);
  scales.h = Math.abs(targetRect.h / rect.h);

  switch (resizing) {
    case 'aspectfit': {
      scales.w = Math.min(scales.w, scales.h);
      scales.h = scales.w;
      break;
    }
    case 'aspectfill': {
      scales.w = Math.max(scales.w, scales.h);
      scales.h = scales.w;
      break;
    }
    case 'stretch':
    case undefined:
      break;
    case 'center': {
      scales.w = 1;
      scales.h = 1;
      break;
    }
    default:
      throw (
        'Unknown resizing behavior "' +
        resizing +
        '". Use "aspectfit", "aspectfill", "stretch" or "center" as resizing behavior.'
      );
  }

  const result = makeRect(
    Math.min(rect.x, rect.x + rect.w),
    Math.min(rect.y, rect.y + rect.h),
    Math.abs(rect.w),
    Math.abs(rect.h)
  );
  result.w *= scales.w;
  result.h *= scales.h;
  result.x = targetRect.x + (targetRect.w - result.w) / 2;
  result.y = targetRect.y + (targetRect.h - result.h) / 2;
  return result;
}

function makeRect(x: number, y: number, w: number, h: number): Rect {
  return { x: x, y: y, w: w, h: h };
}

function equalRects(r1: Rect, r2: Rect): boolean {
  return r1.x === r2.x && r1.y === r2.y && r1.w == r2.w && r1.h === r2.h;
}

function makeSize(w: number, h: number) {
  return { w: w, h: h };
}

type WrappedTextOptions = {
  align: CanvasTextAlign;
  minFontSize: number;
  maxFontSize?: number;
  lineHeightMultiplier?: number;
  verticalAlign?: 'top' | 'center';
};

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  options: WrappedTextOptions
) {
  const fontMatch = context.font.match(/(\d+(?:\.\d+)?)px/);
  if (!fontMatch) {
    return;
  }

  const baseSize = Number(fontMatch[1]);
  const startSize = Math.min(options.maxFontSize ?? baseSize, baseSize);
  const fontTemplate = context.font.replace(/(\d+(?:\.\d+)?)px/, '{size}px');
  const lineHeightMultiplier = options.lineHeightMultiplier ?? 1.1;

  for (let size = startSize; size >= options.minFontSize; size -= 2) {
    context.font = fontTemplate.replace('{size}', String(size));
    const lineHeight = size * lineHeightMultiplier;
    const lines = wrapText(context, text, rect.w);
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= rect.h) {
      const x = options.align === 'center' ? rect.x + rect.w / 2 : rect.x;
      const startY =
        options.verticalAlign === 'top' ? rect.y : rect.y + Math.max(0, (rect.h - totalHeight) / 2);
      const previousBaseline = context.textBaseline;
      context.textBaseline = 'top';
      for (let i = 0; i < lines.length; i += 1) {
        context.fillText(lines[i], x, startY + i * lineHeight);
      }
      context.textBaseline = previousBaseline;
      return;
    }
  }

  context.font = fontTemplate.replace('{size}', String(options.minFontSize));
  const fallbackLineHeight = options.minFontSize * lineHeightMultiplier;
  const fallbackLines = wrapText(context, text, rect.w);
  const maxLines = Math.max(1, Math.floor(rect.h / fallbackLineHeight));
  const visibleLines = fallbackLines.slice(0, maxLines);
  const fallbackHeight = visibleLines.length * fallbackLineHeight;
  const fallbackX = options.align === 'center' ? rect.x + rect.w / 2 : rect.x;
  const fallbackStartY =
    options.verticalAlign === 'top' ? rect.y : rect.y + Math.max(0, (rect.h - fallbackHeight) / 2);
  const previousBaseline = context.textBaseline;
  context.textBaseline = 'top';
  for (let i = 0; i < visibleLines.length; i += 1) {
    context.fillText(visibleLines[i], fallbackX, fallbackStartY + i * fallbackLineHeight);
  }
  context.textBaseline = previousBaseline;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  const pushLine = (line: string) => {
    if (line) {
      lines.push(line);
    }
  };

  const breakLongWord = (word: string) => {
    let remaining = word;
    while (remaining.length > 0) {
      let sliceLength = remaining.length;
      while (
        sliceLength > 1 &&
        context.measureText(remaining.slice(0, sliceLength)).width > maxWidth
      ) {
        sliceLength -= 1;
      }
      pushLine(remaining.slice(0, sliceLength));
      remaining = remaining.slice(sliceLength);
    }
  };

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) {
      pushLine(currentLine);
      currentLine = '';
    }

    if (context.measureText(word).width <= maxWidth) {
      currentLine = word;
    } else {
      breakLongWord(word);
    }
  }

  pushLine(currentLine);
  return lines.length > 0 ? lines : [''];
}

type FitTextOptions = {
  text: string;
  rect: Rect;
  align: CanvasTextAlign;
  minFontSize: number;
  maxFontSize: number;
  lineHeightMultiplier: number;
  verticalAlign?: 'top' | 'center';
};

type PairedFitInput = {
  venue: FitTextOptions;
  location: FitTextOptions;
  maxSizeDeltaRatio: number;
};

function measureFits(
  context: CanvasRenderingContext2D,
  fontTemplate: string,
  options: FitTextOptions,
  fontSize: number
) {
  context.font = fontTemplate.replace('{size}', String(fontSize));
  const lineHeight = fontSize * options.lineHeightMultiplier;
  const lines = wrapText(context, options.text, options.rect.w);
  return lines.length * lineHeight <= options.rect.h;
}

function findMaxFitSize(
  context: CanvasRenderingContext2D,
  fontTemplate: string,
  options: FitTextOptions
) {
  for (let size = options.maxFontSize; size >= options.minFontSize; size -= 2) {
    if (measureFits(context, fontTemplate, options, size)) {
      return size;
    }
  }

  return options.minFontSize;
}

function fitPairedTextSizes(context: CanvasRenderingContext2D, input: PairedFitInput) {
  const baseMatch = context.font.match(/(\d+(?:\.\d+)?)px/);
  const fontTemplate = baseMatch
    ? context.font.replace(/(\d+(?:\.\d+)?)px/, '{size}px')
    : '{size}px';

  let venueSize = findMaxFitSize(context, fontTemplate, input.venue);
  let locationSize = findMaxFitSize(context, fontTemplate, input.location);

  if (locationSize > venueSize) {
    locationSize = venueSize;
  }

  const maxDelta = Math.max(1, Math.round(venueSize * input.maxSizeDeltaRatio));
  if (venueSize - locationSize > maxDelta) {
    const targetLocation = Math.min(input.location.maxFontSize, venueSize - maxDelta);
    const adjustedLocation = findMaxFitSize(context, fontTemplate, {
      ...input.location,
      maxFontSize: targetLocation,
    });
    locationSize = adjustedLocation;

    if (venueSize - locationSize > maxDelta) {
      venueSize = Math.max(input.venue.minFontSize, locationSize + maxDelta);
    }
  }

  return { venueFontSize: venueSize, locationFontSize: locationSize };
}

function measureWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  lineHeightMultiplier: number
) {
  const fontMatch = context.font.match(/(\d+(?:\.\d+)?)px/);
  if (fontMatch) {
    const fontTemplate = context.font.replace(/(\d+(?:\.\d+)?)px/, '{size}px');
    context.font = fontTemplate.replace('{size}', String(fontSize));
  }

  const lines = wrapText(context, text, maxWidth);
  return { lines, height: lines.length * fontSize * lineHeightMultiplier };
}

export { drawRelistenAlbumArt, makeRect };
