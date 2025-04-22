import { Canvas } from 'canvas';

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  context.font = 'bold 72px RobotoBlack';
  context.textAlign = 'left';
  context.fillText(data.artist, labelRect.x, labelRect.y + 65);

  //// Label 2 Drawing
  const label2Rect = makeRect(1170, 1375, 280.09, 81);
  context.fillStyle = textForeground;
  context.font = 'bold 72px RobotoBlack';
  context.textAlign = 'left';
  context.fillText('Relisten', label2Rect.x, label2Rect.y + 65);

  //// Group
  //// Label 3 Drawing
  context.save();
  context.translate(750, 521);

  const label3Rect = makeRect(-695, 0, 1390, 174.98);
  context.fillStyle = textForeground;
  context.font = 'bold 190px RobotoBlack';
  context.textAlign = 'center';
  context.fillText(data.showDate, label3Rect.x + label3Rect.w / 2, label3Rect.y + 127);

  context.restore();

  //// Label 4 Drawing
  context.save();
  context.translate(750, 713.37);

  const label4Rect = makeRect(-695, 0, 1390, 132.7);
  context.fillStyle = textForeground;
  context.font = 'bold 140px RobotoBlack';
  context.textAlign = 'center';
  context.fillText(data.venue, label4Rect.x + label4Rect.w / 2, label4Rect.y + 91);

  context.restore();

  //// Label 5 Drawing
  context.save();
  context.translate(750, 846.3);

  const label5Rect = makeRect(-695, 0, 1390, 132.7);
  context.fillStyle = textForeground;
  context.font = 'bold 140px RobotoBlack';
  context.textAlign = 'center';
  context.fillText(data.location, label5Rect.x + label5Rect.w / 2, label5Rect.y + 91);

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

export {
  drawRelistenAlbumArt,
  makeRect
};
