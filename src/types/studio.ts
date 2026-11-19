export type StudioMode = 'collage' | 'carousel';

export type AspectRatioKey = '4:5' | '1:1' | '3:4' | '9:16';

export interface AspectRatioSpec {
  key: AspectRatioKey;
  label: string;
  sublabel: string;
  width: number;
  height: number;
  ratio: number;
}

export interface FaceRegion {
  centerX: number; // 0..1 normalized
  centerY: number; // 0..1 normalized
  top: number; // 0..1 normalized
  bottom: number; // 0..1 normalized
  left: number; // 0..1 normalized
  right: number; // 0..1 normalized
  source: 'native' | 'heuristic';
}

export interface PhotoAsset {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  isSample?: boolean;
  faceRegion?: FaceRegion | null;
  faceChecked?: boolean;
}

export interface SlotRect {
  id: string;
  /** Normalized 0..1 coordinates inside the inner content area (excluding outer margin) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Optional zIndex for overlapping editorial inset layouts */
  zIndex?: number;
  /** Optional custom frame border for floating inset frames */
  insetBorder?: boolean;
  /** Optional per-slot label */
  label?: string;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  category: '2-photo' | '3-photo' | '4-photo' | 'multi';
  photoCount: number;
  description: string;
  slots: SlotRect[];
}

export interface CarouselTemplate {
  id: string;
  name: string;
  slideCount: number;
  description: string;
  /** Slots expressed in normalized coordinates across the full multi-slide panoramic canvas (x: 0..1 spans all slides) */
  slots: SlotRect[];
}

export interface SlotState {
  photoId: string | null;
  zoom: number; // 1 to 2.8
  panX: number; // -1 to 1 (0 is centered)
  panY: number; // -1 to 1 (0 is centered)
  rotation: number; // 0 | 90 | 180 | 270
  flipH: boolean;
  manualPan?: boolean;
}

export type TonePresetId =
  | 'original'
  | 'kodak-warm'
  | 'portra-soft'
  | 'ilford-bw'
  | 'noir-contrast'
  | 'matte-editorial';

export interface TonePreset {
  id: TonePresetId;
  name: string;
  cssFilter: string;
  description: string;
}

export type FrameStyle = 'clean' | 'film-35mm' | 'museum-mat';

export interface CanvasSettings {
  aspectRatio: AspectRatioKey;
  marginPx: number; // 0 to 120 in 1080px coordinate space
  gapPx: number; // 0 to 60 in 1080px coordinate space
  radiusPx: number; // 0 to 32 in 1080px coordinate space
  backgroundColor: string;
  frameStyle: FrameStyle;
  tonePreset: TonePresetId;
  grainAmount: number; // 0 to 30
  showExifFooter: boolean;
  seriesTitle: string;
  exifText: string;
  footerAlign: 'left' | 'center' | 'right';
}

export interface ExportOptions {
  format: 'image/jpeg' | 'image/png';
  scale: 1 | 2;
  quality: number;
}
