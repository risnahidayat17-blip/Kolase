import { ASPECT_RATIOS } from '../data/templates';
import {
  CanvasSettings,
  FaceRegion,
  PhotoAsset,
  SlotRect,
  SlotState,
  StudioMode,
} from '../types/studio';
import { computeCanvasLayout } from './canvasRenderer';

interface DetectedFaceBox {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface NativeFaceDetector {
  detect(image: HTMLImageElement | HTMLCanvasElement): Promise<DetectedFaceBox[]>;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: {
      fastMode?: boolean;
      maxDetectedFaces?: number;
    }) => NativeFaceDetector;
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

/**
 * Fallback pure-JS face/head region detector using YCbCr skin-tone chrominance
 * + local luminance contrast variance on a compact downsampled grid.
 */
function detectFaceHeuristic(img: HTMLImageElement): FaceRegion | null {
  const size = 120;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Build skin-probability + local facial contrast map
  const scoreGrid = new Float32Array(size * size);
  const lumGrid = new Float32Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    lumGrid[i] = y;

    // Classic YCbCr skin range + luminance guard (avoid washed-out sky or pure shadow)
    const isSkin =
      y > 42 &&
      y < 238 &&
      cb >= 77 &&
      cb <= 127 &&
      cr >= 133 &&
      cr <= 174 &&
      r > g &&
      r - b > 12;

    if (isSkin) {
      // Favor natural skin chrominance center
      const dCb = Math.abs(cb - 108) / 25;
      const dCr = Math.abs(cr - 150) / 22;
      scoreGrid[i] = Math.max(0.2, 1.2 - 0.5 * (dCb + dCr));
    }
  }

  // Sliding window scan in upper 75% of photo to locate compact face-sized cluster
  // Faces typically span 10% to 45% of image width
  let bestScore = 0;
  let bestCx = 0.5;
  let bestCy = 0.35;
  let bestHalfW = 0.12;
  let bestHalfH = 0.14;

  const windowRadii = [8, 13, 19]; // ~13%, 22%, 32% of 120px grid

  for (const rad of windowRadii) {
    const step = 3;
    const area = (rad * 2 + 1) * (rad * 2 + 1);
    for (let cy = rad + 2; cy < Math.floor(size * 0.78) - rad; cy += step) {
      for (let cx = rad + 2; cx < size - rad - 2; cx += step) {
        let skinSum = 0;
        let skinCount = 0;
        let lumSum = 0;
        let lumSqSum = 0;

        for (let dy = -rad; dy <= rad; dy += 2) {
          const rowOffset = (cy + dy) * size;
          for (let dx = -rad; dx <= rad; dx += 2) {
            const idx = rowOffset + (cx + dx);
            const s = scoreGrid[idx];
            if (s > 0) {
              skinSum += s;
              skinCount++;
            }
            const l = lumGrid[idx];
            lumSum += l;
            lumSqSum += l * l;
          }
        }

        const samples = Math.ceil((rad * 2 + 1) / 2) ** 2;
        const density = skinCount / samples;
        // A face has 28%..88% skin coverage (eyes/brows/mouth break up solid skin)
        if (density < 0.25 || density > 0.92) continue;

        const meanLum = lumSum / samples;
        const lumVariance = lumSqSum / samples - meanLum * meanLum;
        // Reject flat warm walls/travertine concrete (low internal feature variance)
        if (lumVariance < 180) continue;

        // Slight portrait prior: upper-center region is more likely a face than bottom corners
        const verticalPrior = cy < size * 0.52 ? 1.18 : 0.92;
        const total = (skinSum / Math.sqrt(area)) * verticalPrior * Math.min(1.4, Math.sqrt(lumVariance) / 28);

        if (total > bestScore) {
          bestScore = total;
          bestCx = cx / size;
          bestCy = cy / size;
          bestHalfW = rad / size;
          bestHalfH = (rad * 1.15) / size;
        }
      }
    }
  }

  // Require meaningful confidence so landscapes/architecture stay cleanly centered
  if (bestScore < 2.1) {
    return null;
  }

  return {
    centerX: Math.max(0.05, Math.min(0.95, bestCx)),
    centerY: Math.max(0.05, Math.min(0.85, bestCy)),
    left: Math.max(0, bestCx - bestHalfW),
    right: Math.min(1, bestCx + bestHalfW),
    top: Math.max(0, bestCy - bestHalfH),
    bottom: Math.min(1, bestCy + bestHalfH),
    source: 'heuristic',
  };
}

/**
 * Detects face bounding region in a photo URL.
 * Uses Chrome's native FaceDetector when available, with a fast YCbCr+contrast fallback.
 */
export async function detectPhotoFocus(url: string): Promise<FaceRegion | null> {
  try {
    const img = await loadImageElement(url);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;

    if (typeof window !== 'undefined' && 'FaceDetector' in window && window.FaceDetector) {
      try {
        const detector = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 6,
        });
        const faces = await detector.detect(img);
        if (faces && faces.length > 0) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          for (const f of faces) {
            const b = f.boundingBox;
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.width);
            maxY = Math.max(maxY, b.y + b.height);
          }
          const left = Math.max(0, minX / w);
          const top = Math.max(0, minY / h);
          const right = Math.min(1, maxX / w);
          const bottom = Math.min(1, maxY / h);
          return {
            centerX: (left + right) / 2,
            centerY: (top + bottom) / 2,
            left,
            top,
            right,
            bottom,
            source: 'native',
          };
        }
      } catch {
        // Fallback to heuristic if native detector fails
      }
    }

    return detectFaceHeuristic(img);
  } catch {
    return null;
  }
}

function mapFacePointToSlotSpace(
  face: FaceRegion,
  rotation: number,
  flipH: boolean
): { fx: number; fy: number } {
  let fx = face.centerX;
  let fy = face.centerY;

  if (rotation === 90) {
    const nx = 1 - fy;
    const ny = fx;
    fx = nx;
    fy = ny;
  } else if (rotation === 180) {
    fx = 1 - fx;
    fy = 1 - fy;
  } else if (rotation === 270) {
    const nx = fy;
    const ny = 1 - fx;
    fx = nx;
    fy = ny;
  }

  if (flipH) {
    fx = 1 - fx;
  }

  return { fx, fy };
}

/**
 * Computes exact normalized panX/panY (-1..1) so a photo's detected face stays centered
 * with natural headroom inside the given slot's exact aspect ratio.
 */
export function computeAutoPanForSlot(params: {
  photo: PhotoAsset;
  slotId: string;
  mode: StudioMode;
  slideCount: number;
  slots: SlotRect[];
  settings: CanvasSettings;
  state: SlotState;
}): { panX: number; panY: number } {
  const { photo, slotId, mode, slideCount, slots, settings, state } = params;
  if (!photo.faceRegion) {
    return { panX: 0, panY: 0 };
  }

  const baseSpec =
    mode === 'carousel' && settings.aspectRatio === '9:16'
      ? ASPECT_RATIOS['4:5']
      : ASPECT_RATIOS[settings.aspectRatio];

  const effectiveSlides = mode === 'carousel' ? slideCount : 1;
  const logicalW = baseSpec.width * effectiveSlides;
  const logicalH = baseSpec.height;

  const layout = computeCanvasLayout(logicalW, logicalH, slots, settings, 1);
  const box = layout.boxes.find((b) => b.slot.id === slotId);
  if (!box) return { panX: 0, panY: 0 };

  const isRotated90 = state.rotation === 90 || state.rotation === 270;
  const natW = isRotated90 ? photo.height : photo.width;
  const natH = isRotated90 ? photo.width : photo.height;

  const coverScale = Math.max(box.w / natW, box.h / natH);
  const totalScale = coverScale * state.zoom;

  const drawW = natW * totalScale;
  const drawH = natH * totalScale;

  const maxPanX = Math.max(0, (drawW - box.w) / 2);
  const maxPanY = Math.max(0, (drawH - box.h) / 2);

  const { fx, fy } = mapFacePointToSlotSpace(
    photo.faceRegion,
    state.rotation,
    state.flipH
  );

  // Target face horizontally centered, and slightly above vertical midpoint (45% from top)
  // so hair/forehead headroom isn't clipped in tight horizontal frames.
  const panX =
    maxPanX > 0.5
      ? Math.max(-1, Math.min(1, ((fx - 0.5) * drawW) / maxPanX))
      : 0;

  const desiredFaceOffsetY = (0.5 - 0.45) * box.h;
  const panY =
    maxPanY > 0.5
      ? Math.max(
          -1,
          Math.min(1, ((fy - 0.5) * drawH + desiredFaceOffsetY) / maxPanY)
        )
      : 0;

  return { panX, panY };
}
