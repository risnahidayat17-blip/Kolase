import { ASPECT_RATIOS, TONE_PRESETS } from '../data/templates';
import {
  CanvasSettings,
  ExportOptions,
  PhotoAsset,
  SlotRect,
  SlotState,
  StudioMode,
} from '../types/studio';

export interface ComputedSlotBox {
  slot: SlotRect;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Computes exact pixel coordinates for every slot inside a target canvas.
 * Works identically for both interactive preview math and high-res 2D Canvas export.
 */
export function computeCanvasLayout(
  canvasWidth: number,
  canvasHeight: number,
  slots: SlotRect[],
  settings: CanvasSettings,
  scaleFactor = 1
): {
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
  footerHeight: number;
  boxes: ComputedSlotBox[];
} {
  const margin = settings.marginPx * scaleFactor;
  const gap = settings.gapPx * scaleFactor;

  const extraFooter = settings.showExifFooter ? 52 * scaleFactor : 0;
  const bottomMargin = settings.showExifFooter
    ? Math.max(margin, 64 * scaleFactor) + extraFooter * 0.25
    : margin;

  const innerX = margin;
  const innerY = margin;
  const innerW = Math.max(40, canvasWidth - margin * 2);
  const innerH = Math.max(40, canvasHeight - margin - bottomMargin);

  const EPS = 0.002;
  const sorted = [...slots].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

  const boxes: ComputedSlotBox[] = sorted.map((slot) => {
    if (slot.insetBorder) {
      return {
        slot,
        x: innerX + slot.x * innerW,
        y: innerY + slot.y * innerH,
        w: slot.w * innerW,
        h: slot.h * innerH,
      };
    }

    const leftInset = slot.x <= EPS ? 0 : gap / 2;
    const rightInset = slot.x + slot.w >= 1 - EPS ? 0 : gap / 2;
    const topInset = slot.y <= EPS ? 0 : gap / 2;
    const bottomInset = slot.y + slot.h >= 1 - EPS ? 0 : gap / 2;

    const x = innerX + slot.x * innerW + leftInset;
    const y = innerY + slot.y * innerH + topInset;
    const w = Math.max(8, slot.w * innerW - leftInset - rightInset);
    const h = Math.max(8, slot.h * innerH - topInset - bottomInset);

    return { slot, x, y, w, h };
  });

  return {
    innerX,
    innerY,
    innerW,
    innerH,
    footerHeight: bottomMargin,
    boxes,
  };
}

function isDarkColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFilm35mmDecor(
  ctx: CanvasRenderingContext2D,
  box: ComputedSlotBox,
  index: number,
  darkBg: boolean,
  scaleFactor: number
) {
  const frameNumber = `${String(index + 1).padStart(2, '0')}A`;
  ctx.save();
  ctx.font = `500 ${Math.round(11 * scaleFactor)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = darkBg ? 'rgba(244, 244, 245, 0.45)' : 'rgba(24, 24, 27, 0.45)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(frameNumber, box.x + 2 * scaleFactor, box.y - 4 * scaleFactor);
  ctx.restore();
}

function drawMuseumMatShadow(
  ctx: CanvasRenderingContext2D,
  box: ComputedSlotBox,
  radius: number,
  darkBg: boolean,
  scaleFactor: number
) {
  ctx.save();
  drawRoundedRectPath(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.strokeStyle = darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)';
  ctx.lineWidth = Math.max(1, 1.5 * scaleFactor);
  ctx.stroke();
  ctx.restore();
}

function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grainAmount: number
) {
  if (grainAmount <= 0) return;
  const tileSize = 180;
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = tileSize;
  grainCanvas.height = tileSize;
  const gCtx = grainCanvas.getContext('2d');
  if (!gCtx) return;

  const imgData = gCtx.createImageData(tileSize, tileSize);
  const data = imgData.data;
  const alpha = Math.min(48, Math.round((grainAmount / 30) * 34));

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = alpha;
  }
  gCtx.putImageData(imgData, 0, 0);

  const pattern = ctx.createPattern(grainCanvas, 'repeat');
  if (pattern) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

/**
 * Renders the full master canvas (single collage or full multi-slide carousel)
 * and returns either 1 blob (collage) or N slide blobs (carousel).
 */
export async function renderExportCanvases(params: {
  mode: StudioMode;
  slideCount: number;
  slots: SlotRect[];
  slotStates: Record<string, SlotState>;
  photos: PhotoAsset[];
  settings: CanvasSettings;
  exportOptions: ExportOptions;
}): Promise<{ filename: string; dataUrl: string }[]> {
  const { mode, slideCount, slots, slotStates, photos, settings, exportOptions } = params;

  const baseSpec =
    mode === 'carousel' && settings.aspectRatio === '9:16'
      ? ASPECT_RATIOS['4:5']
      : ASPECT_RATIOS[settings.aspectRatio];

  const scale = exportOptions.scale;
  const singleW = baseSpec.width * scale;
  const singleH = baseSpec.height * scale;
  const effectiveSlides = mode === 'carousel' ? slideCount : 1;
  const totalW = singleW * effectiveSlides;
  const totalH = singleH;

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = totalW;
  masterCanvas.height = totalH;
  const ctx = masterCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Background paper
  ctx.fillStyle = settings.backgroundColor;
  ctx.fillRect(0, 0, totalW, totalH);

  const darkBg = isDarkColor(settings.backgroundColor);

  // 2. Compute layout boxes
  const layout = computeCanvasLayout(totalW, totalH, slots, settings, scale);

  // Preload all referenced images
  const photoMap = new Map<string, PhotoAsset>();
  for (const p of photos) photoMap.set(p.id, p);

  const loadedImages = new Map<string, HTMLImageElement>();
  await Promise.all(
    layout.boxes.map(async ({ slot }) => {
      const state = slotStates[slot.id];
      if (!state?.photoId) return;
      const asset = photoMap.get(state.photoId);
      if (!asset || loadedImages.has(asset.id)) return;
      try {
        const img = await loadImage(asset.url);
        loadedImages.set(asset.id, img);
      } catch {
        // Ignore broken image gracefully
      }
    })
  );

  const tone = TONE_PRESETS.find((t) => t.id === settings.tonePreset) ?? TONE_PRESETS[0];
  const radius = settings.radiusPx * scale;

  // 3. Draw each slot
  layout.boxes.forEach((box, idx) => {
    const state = slotStates[box.slot.id] ?? {
      photoId: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
    };

    // Inset floating frame border
    if (box.slot.insetBorder) {
      const borderPad = Math.max(10 * scale, settings.gapPx * scale * 0.75);
      ctx.save();
      drawRoundedRectPath(
        ctx,
        box.x - borderPad,
        box.y - borderPad,
        box.w + borderPad * 2,
        box.h + borderPad * 2,
        radius > 0 ? radius + 2 * scale : 0
      );
      ctx.fillStyle = settings.backgroundColor;
      ctx.fill();
      ctx.restore();
    }

    // Clip slot region
    ctx.save();
    drawRoundedRectPath(ctx, box.x, box.y, box.w, box.h, radius);
    ctx.clip();

    const img = state.photoId ? loadedImages.get(state.photoId) : undefined;

    if (img) {
      const isRotated90 = state.rotation === 90 || state.rotation === 270;
      const naturalW = isRotated90 ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotated90 ? img.naturalWidth : img.naturalHeight;

      const coverScale = Math.max(box.w / naturalW, box.h / naturalH);
      const totalScale = coverScale * state.zoom;

      const drawW = naturalW * totalScale;
      const drawH = naturalH * totalScale;

      const maxPanX = Math.max(0, (drawW - box.w) / 2);
      const maxPanY = Math.max(0, (drawH - box.h) / 2);

      const centerX = box.x + box.w / 2 - state.panX * maxPanX;
      const centerY = box.y + box.h / 2 - state.panY * maxPanY;

      ctx.save();
      if (tone.cssFilter !== 'none') {
        ctx.filter = tone.cssFilter;
      }
      ctx.translate(centerX, centerY);
      if (state.flipH) {
        ctx.scale(-1, 1);
      }
      if (state.rotation !== 0) {
        ctx.rotate((state.rotation * Math.PI) / 180);
      }

      const rawW = img.naturalWidth * totalScale;
      const rawH = img.naturalHeight * totalScale;
      ctx.drawImage(img, -rawW / 2, -rawH / 2, rawW, rawH);
      ctx.restore();
    } else {
      ctx.fillStyle = darkBg ? '#1c1c21' : '#e4e4e7';
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }

    ctx.restore();

    if (settings.frameStyle === 'film-35mm') {
      drawFilm35mmDecor(ctx, box, idx, darkBg, scale);
    } else if (settings.frameStyle === 'museum-mat') {
      drawMuseumMatShadow(ctx, box, radius, darkBg, scale);
    }
  });

  // 4. Optional subtle grain
  if (settings.grainAmount > 0) {
    applyFilmGrain(ctx, totalW, totalH, settings.grainAmount);
  }

  // 5. Optional EXIF / Series Footer
  if (settings.showExifFooter && (settings.seriesTitle.trim() || settings.exifText.trim())) {
    const footerY = totalH - Math.max(24 * scale, settings.marginPx * scale * 0.42);
    const leftX = settings.marginPx * scale;
    const rightX = totalW - settings.marginPx * scale;
    const centerX = totalW / 2;

    ctx.save();
    const titleColor = darkBg ? 'rgba(255,255,255,0.92)' : 'rgba(15,15,18,0.92)';
    const metaColor = darkBg ? 'rgba(255,255,255,0.52)' : 'rgba(15,15,18,0.52)';

    const anchorX =
      settings.footerAlign === 'center'
        ? centerX
        : settings.footerAlign === 'right'
        ? rightX
        : leftX;

    ctx.textAlign = settings.footerAlign;
    ctx.textBaseline = 'alphabetic';

    if (settings.seriesTitle.trim()) {
      ctx.font = `600 ${Math.round(22 * scale)}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle = titleColor;
      ctx.fillText(settings.seriesTitle.trim(), anchorX, footerY - 22 * scale);
    }

    if (settings.exifText.trim()) {
      ctx.font = `400 ${Math.round(13 * scale)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = metaColor;
      ctx.fillText(settings.exifText.trim(), anchorX, footerY);
    }
    ctx.restore();
  }

  // 6. Export single collage or slice carousel into exact IG slides
  const ext = exportOptions.format === 'image/png' ? 'png' : 'jpg';
  const results: { filename: string; dataUrl: string }[] = [];

  if (mode === 'collage') {
    const dataUrl = masterCanvas.toDataURL(exportOptions.format, exportOptions.quality);
    results.push({
      filename: `ris-collage-${baseSpec.key.replace(':', 'x')}.${ext}`,
      dataUrl,
    });
  } else {
    const slideCanvas = document.createElement('canvas');
    slideCanvas.width = singleW;
    slideCanvas.height = singleH;
    const sCtx = slideCanvas.getContext('2d');
    if (!sCtx) throw new Error('Slide Canvas 2D context unavailable');

    for (let i = 0; i < effectiveSlides; i++) {
      sCtx.clearRect(0, 0, singleW, singleH);
      sCtx.drawImage(
        masterCanvas,
        i * singleW,
        0,
        singleW,
        singleH,
        0,
        0,
        singleW,
        singleH
      );
      const dataUrl = slideCanvas.toDataURL(exportOptions.format, exportOptions.quality);
      results.push({
        filename: `ris-carousel-slide-${String(i + 1).padStart(2, '0')}.${ext}`,
        dataUrl,
      });
    }
  }

  return results;
}
