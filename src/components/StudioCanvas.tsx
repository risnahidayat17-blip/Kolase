import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  FlipHorizontal2,
  ImagePlus,
  RotateCw,
  RotateCcw,
  Trash2,
  ZoomIn,
  Maximize2,
  ScanFace,
} from 'lucide-react';
import { ASPECT_RATIOS, TONE_PRESETS } from '../data/templates';
import {
  CanvasSettings,
  PhotoAsset,
  SlotRect,
  SlotState,
  StudioMode,
} from '../types/studio';
import { computeCanvasLayout } from '../utils/canvasRenderer';

interface StudioCanvasProps {
  mode: StudioMode;
  slideCount: number;
  slots: SlotRect[];
  slotStates: Record<string, SlotState>;
  photos: PhotoAsset[];
  settings: CanvasSettings;
  selectedSlotId: string | null;
  autoCenterFace: boolean;
  onToggleAutoCenterFace: () => void;
  onFocusFaceSlot: (slotId: string) => void;
  onSelectSlot: (slotId: string | null) => void;
  onUpdateSlotState: (slotId: string, patch: Partial<SlotState>) => void;
  onSwapSlots: (slotIdA: string, slotIdB: string) => void;
  onDropPhotoOnSlot: (slotId: string, photoId: string) => void;
  onUploadToSlot: (slotId: string, files: FileList) => void;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  mode,
  slideCount,
  slots,
  slotStates,
  photos,
  settings,
  selectedSlotId,
  autoCenterFace,
  onToggleAutoCenterFace,
  onFocusFaceSlot,
  onSelectSlot,
  onUpdateSlotState,
  onSwapSlots,
  onDropPhotoOnSlot,
  onUploadToSlot,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [dragHoverSlotId, setDragHoverSlotId] = useState<string | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [carouselFitAll, setCarouselFitAll] = useState(true);

  const panDragRef = useRef<{
    slotId: string;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    maxPanX: number;
    maxPanY: number;
  } | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseSpec =
    mode === 'carousel' && settings.aspectRatio === '9:16'
      ? ASPECT_RATIOS['4:5']
      : ASPECT_RATIOS[settings.aspectRatio];

  const effectiveSlides = mode === 'carousel' ? slideCount : 1;
  const logicalW = baseSpec.width * effectiveSlides;
  const logicalH = baseSpec.height;

  // Compute display pixel dimensions for the artboard
  const displayDims = useMemo(() => {
    const padW = 48;
    const padH = 48;
    const availW = Math.max(260, stageSize.width - padW);
    const availH = Math.max(260, stageSize.height - padH);

    if (mode === 'carousel' && !carouselFitAll) {
      const h = Math.min(availH, 480);
      const w = h * (logicalW / logicalH);
      return { width: w, height: h };
    }

    const scale = Math.min(availW / logicalW, availH / logicalH);
    return {
      width: Math.max(180, Math.round(logicalW * scale)),
      height: Math.max(180, Math.round(logicalH * scale)),
    };
  }, [stageSize.width, stageSize.height, logicalW, logicalH, mode, carouselFitAll]);

  const scaleFactor = displayDims.width / logicalW;

  const layout = useMemo(
    () =>
      computeCanvasLayout(
        displayDims.width,
        displayDims.height,
        slots,
        settings,
        scaleFactor
      ),
    [displayDims.width, displayDims.height, slots, settings, scaleFactor]
  );

  const photoMap = useMemo(() => {
    const map = new Map<string, PhotoAsset>();
    for (const p of photos) map.set(p.id, p);
    return map;
  }, [photos]);

  const activeTone = useMemo(
    () => TONE_PRESETS.find((t) => t.id === settings.tonePreset) ?? TONE_PRESETS[0],
    [settings.tonePreset]
  );

  const darkBg = isDarkHex(settings.backgroundColor);

  const selectedSlotState = selectedSlotId ? slotStates[selectedSlotId] : undefined;

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = panDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    const nextPanX =
      drag.maxPanX > 0.5
        ? Math.max(-1, Math.min(1, drag.startPanX - dx / drag.maxPanX))
        : 0;
    const nextPanY =
      drag.maxPanY > 0.5
        ? Math.max(-1, Math.min(1, drag.startPanY - dy / drag.maxPanY))
        : 0;

    onUpdateSlotState(drag.slotId, {
      panX: nextPanX,
      panY: nextPanY,
      manualPan: true,
    });
  };

  const handlePointerUp = () => {
    panDragRef.current = null;
  };

  return (
    <main
      className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#08080A] relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <input
        ref={slotFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && selectedSlotId) {
            onUploadToSlot(selectedSlotId, e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Subtle Canvas Header Info Bar */}
      <div className="h-11 px-5 border-b border-zinc-800/70 bg-[#0C0C0E] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-zinc-200 font-medium">
            {mode === 'collage' ? 'Kanvas Single Post' : `Carousel ${effectiveSlides} Slide`}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-zinc-400">
            {baseSpec.width} × {baseSpec.height} px
            {mode === 'carousel' ? ` (×${effectiveSlides})` : ''}
          </span>
          {swapSourceId && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#F2B705] font-medium">
                Klik frame lain untuk menukar posisi foto
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAutoCenterFace}
            title="Otomatis pusatkan posisi wajah saat ganti template atau foto"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              autoCenterFace
                ? 'text-[#F2B705] bg-[#F2B705]/12 border-[#F2B705]/40'
                : 'text-zinc-400 bg-zinc-900 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Auto Wajah: {autoCenterFace ? 'Aktif' : 'Nonaktif'}</span>
          </button>

          {mode === 'carousel' && (
            <button
              type="button"
              onClick={() => setCarouselFitAll((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" aria-hidden="true" />
              <span>{carouselFitAll ? 'Zoom Per Slide' : 'Tampilkan Semua Slide'}</span>
            </button>
          )}
          {selectedSlotId && (
            <button
              type="button"
              onClick={() => {
                onSelectSlot(null);
                setSwapSourceId(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              Selesai Edit
            </button>
          )}
        </div>
      </div>

      {/* Center Artboard Stage */}
      <div
        ref={stageRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectSlot(null);
            setSwapSourceId(null);
          }
        }}
        className="flex-1 min-h-0 overflow-auto flex p-6"
      >
        <div
          style={{
            width: `${displayDims.width}px`,
            height: `${displayDims.height}px`,
            backgroundColor: settings.backgroundColor,
          }}
          className="relative m-auto shadow-[0_24px_70px_rgba(0,0,0,0.75)] shrink-0 select-none transition-[background-color] duration-150"
        >
          {/* Render Layout Boxes */}
          {layout.boxes.map((box, idx) => {
            const state = slotStates[box.slot.id] ?? {
              photoId: null,
              zoom: 1,
              panX: 0,
              panY: 0,
              rotation: 0,
              flipH: false,
            };
            const photo = state.photoId ? photoMap.get(state.photoId) : undefined;
            const isSelected = selectedSlotId === box.slot.id;
            const isDragHover = dragHoverSlotId === box.slot.id;
            const isSwapTarget = swapSourceId && swapSourceId !== box.slot.id;

            // Calculate exact cover + zoom + pan geometry
            let imgStyle: React.CSSProperties | undefined;
            let maxPanX = 0;
            let maxPanY = 0;

            if (photo) {
              const isRotated90 = state.rotation === 90 || state.rotation === 270;
              const natW = isRotated90 ? photo.height : photo.width;
              const natH = isRotated90 ? photo.width : photo.height;
              const coverScale = Math.max(box.w / natW, box.h / natH);
              const totalScale = coverScale * state.zoom;
              const drawW = natW * totalScale;
              const drawH = natH * totalScale;
              maxPanX = Math.max(0, (drawW - box.w) / 2);
              maxPanY = Math.max(0, (drawH - box.h) / 2);

              const panOffsetX = state.panX * maxPanX;
              const panOffsetY = state.panY * maxPanY;

              const rawW = photo.width * totalScale;
              const rawH = photo.height * totalScale;

              imgStyle = {
                width: `${rawW}px`,
                height: `${rawH}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% - ${panOffsetX}px), calc(-50% - ${panOffsetY}px)) rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1})`,
                filter: activeTone.cssFilter === 'none' ? undefined : activeTone.cssFilter,
              };
            }

            const radiusPx = settings.radiusPx * scaleFactor;
            const borderPad = box.slot.insetBorder
              ? Math.max(10 * scaleFactor, settings.gapPx * scaleFactor * 0.75)
              : 0;

            return (
              <React.Fragment key={box.slot.id}>
                {/* Inset floating border backdrop */}
                {box.slot.insetBorder && (
                  <div
                    style={{
                      left: `${box.x - borderPad}px`,
                      top: `${box.y - borderPad}px`,
                      width: `${box.w + borderPad * 2}px`,
                      height: `${box.h + borderPad * 2}px`,
                      backgroundColor: settings.backgroundColor,
                      borderRadius: `${radiusPx > 0 ? radiusPx + 2 * scaleFactor : 0}px`,
                      zIndex: (box.slot.zIndex ?? 1) * 10 - 1,
                    }}
                    className="absolute pointer-events-none"
                  />
                )}

                {/* Film 35mm frame number label */}
                {settings.frameStyle === 'film-35mm' && (
                  <span
                    style={{
                      left: `${box.x + 2 * scaleFactor}px`,
                      top: `${box.y - 15 * scaleFactor}px`,
                      fontSize: `${Math.max(8, Math.round(11 * scaleFactor))}px`,
                      color: darkBg
                        ? 'rgba(244, 244, 245, 0.45)'
                        : 'rgba(24, 24, 27, 0.45)',
                    }}
                    className="absolute font-mono font-medium leading-none pointer-events-none z-30"
                  >
                    {String(idx + 1).padStart(2, '0')}A
                  </span>
                )}

                {/* Interactive Slot Frame */}
                <div
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.w}px`,
                    height: `${box.h}px`,
                    borderRadius: `${radiusPx}px`,
                    zIndex: (box.slot.zIndex ?? 1) * 10,
                    outline:
                      settings.frameStyle === 'museum-mat'
                        ? `1px solid ${darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)'}`
                        : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (swapSourceId && swapSourceId !== box.slot.id) {
                      onSwapSlots(swapSourceId, box.slot.id);
                      setSwapSourceId(null);
                      onSelectSlot(box.slot.id);
                      return;
                    }
                    onSelectSlot(box.slot.id);
                  }}
                  onPointerDown={(e) => {
                    if (!photo || swapSourceId) return;
                    e.stopPropagation();
                    onSelectSlot(box.slot.id);
                    panDragRef.current = {
                      slotId: box.slot.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startPanX: state.panX,
                      startPanY: state.panY,
                      maxPanX,
                      maxPanY,
                    };
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragHoverSlotId(box.slot.id);
                  }}
                  onDragLeave={() => setDragHoverSlotId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragHoverSlotId(null);
                    const photoId = e.dataTransfer.getData('text/photo-id');
                    if (photoId) {
                      onDropPhotoOnSlot(box.slot.id, photoId);
                      onSelectSlot(box.slot.id);
                    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      onUploadToSlot(box.slot.id, e.dataTransfer.files);
                      onSelectSlot(box.slot.id);
                    }
                  }}
                  className={`absolute overflow-hidden group transition-shadow ${
                    photo ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  }`}
                >
                  {photo && imgStyle ? (
                    <img
                      src={photo.url}
                      alt={photo.name}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      style={imgStyle}
                      className="absolute pointer-events-none select-none"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 transition-colors ${
                        darkBg
                          ? 'bg-zinc-900/90 text-zinc-500 hover:bg-zinc-800/90'
                          : 'bg-zinc-200/80 text-zinc-500 hover:bg-zinc-300/80'
                      }`}
                    >
                      <ImagePlus className="w-5 h-5" aria-hidden="true" />
                      <span className="text-[11px] font-medium">Pilih / Tarik Foto</span>
                    </div>
                  )}

                  {/* Selection / Hover / Swap / Drop Ring */}
                  <div
                    style={{ borderRadius: `${radiusPx}px` }}
                    className={`absolute inset-0 pointer-events-none transition-all ${
                      isDragHover
                        ? 'ring-2 ring-inset ring-[#F2B705] bg-[#F2B705]/15'
                        : isSelected
                        ? 'ring-2 ring-inset ring-[#F2B705]'
                        : isSwapTarget
                        ? 'ring-1 ring-inset ring-[#F2B705]/70 hover:bg-[#F2B705]/10'
                        : 'ring-0 group-hover:ring-1 group-hover:ring-inset group-hover:ring-white/40'
                    }`}
                  />
                </div>
              </React.Fragment>
            );
          })}

          {/* Subtle Film Grain Preview Overlay */}
          {settings.grainAmount > 0 && (
            <div
              style={{
                opacity: (settings.grainAmount / 30) * 0.22,
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.45) 0.5px, transparent 0.5px), radial-gradient(rgba(0,0,0,0.45) 0.5px, transparent 0.5px)',
                backgroundSize: '3px 3px',
                backgroundPosition: '0 0, 1.5px 1.5px',
              }}
              className="absolute inset-0 pointer-events-none z-40 mix-blend-overlay"
            />
          )}

          {/* Optional EXIF & Series Title Footer */}
          {settings.showExifFooter &&
            (settings.seriesTitle.trim() || settings.exifText.trim()) && (
              <div
                style={{
                  left: `${settings.marginPx * scaleFactor}px`,
                  right: `${settings.marginPx * scaleFactor}px`,
                  bottom: `${Math.max(10 * scaleFactor, settings.marginPx * scaleFactor * 0.32)}px`,
                  textAlign: settings.footerAlign,
                }}
                className="absolute pointer-events-none z-40"
              >
                {settings.seriesTitle.trim() && (
                  <div
                    style={{
                      fontSize: `${Math.max(10, Math.round(22 * scaleFactor))}px`,
                      color: darkBg
                        ? 'rgba(255,255,255,0.92)'
                        : 'rgba(15,15,18,0.92)',
                      lineHeight: 1.15,
                    }}
                    className="font-editorial font-semibold truncate"
                  >
                    {settings.seriesTitle}
                  </div>
                )}
                {settings.exifText.trim() && (
                  <div
                    style={{
                      fontSize: `${Math.max(7, Math.round(13 * scaleFactor))}px`,
                      color: darkBg
                        ? 'rgba(255,255,255,0.52)'
                        : 'rgba(15,15,18,0.52)',
                      marginTop: `${Math.max(1, 3 * scaleFactor)}px`,
                    }}
                    className="font-mono truncate"
                  >
                    {settings.exifText}
                  </div>
                )}
              </div>
            )}

          {/* Carousel Slide Cut Guides */}
          {mode === 'carousel' &&
            Array.from({ length: effectiveSlides - 1 }).map((_, idx) => (
              <div
                key={idx}
                style={{ left: `${((idx + 1) / effectiveSlides) * 100}%` }}
                className="absolute top-0 bottom-0 w-px border-l border-dashed border-[#F2B705]/85 z-50 pointer-events-none"
              >
                <span className="absolute top-2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-950/90 text-[#F2B705] rounded border border-[#F2B705]/40 whitespace-nowrap">
                  Slide {idx + 1} | {idx + 2}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Contextual Floating Slot Editing Bar */}
      <div className="h-14 px-5 border-t border-zinc-800/80 bg-[#0D0D0F] flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
        {selectedSlotId && selectedSlotState ? (
          <>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                <span className="text-xs text-zinc-400 whitespace-nowrap">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={2.8}
                  step={0.05}
                  value={selectedSlotState.zoom}
                  onChange={(e) =>
                    onUpdateSlotState(selectedSlotId, {
                      zoom: parseFloat(e.target.value),
                    })
                  }
                  className="w-24 cursor-pointer"
                  aria-label="Zoom foto dalam frame"
                />
                <span className="text-xs font-mono tabular-nums text-zinc-300 w-10">
                  {selectedSlotState.zoom.toFixed(2)}×
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800" />

              <button
                type="button"
                onClick={() =>
                  onUpdateSlotState(selectedSlotId, {
                    rotation: (selectedSlotState.rotation + 90) % 360,
                  })
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Putar</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateSlotState(selectedSlotId, {
                    flipH: !selectedSlotState.flipH,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSlotState.flipH
                    ? 'text-[#F2B705] bg-[#F2B705]/10 border-[#F2B705]/40'
                    : 'text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-800'
                }`}
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Balik</span>
              </button>

              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSwapSourceId((prev) =>
                      prev === selectedSlotId ? null : selectedSlotId
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    swapSourceId === selectedSlotId
                      ? 'text-zinc-950 bg-[#F2B705] border-[#F2B705] font-medium'
                      : 'text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-800'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{swapSourceId === selectedSlotId ? 'Pilih Target...' : 'Tukar Posisi'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => slotFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ganti Foto</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedSlotState.photoId && (
                <button
                  type="button"
                  onClick={() => onFocusFaceSlot(selectedSlotId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#F2B705] hover:bg-[#F2B705]/10 border border-[#F2B705]/30 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ScanFace className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Fokus Wajah</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onUpdateSlotState(selectedSlotId, {
                    zoom: 1,
                    panX: 0,
                    panY: 0,
                    rotation: 0,
                    flipH: false,
                    manualPan: false,
                  })
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Crop</span>
              </button>
              {selectedSlotState.photoId && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSlotState(selectedSlotId, {
                      photoId: null,
                      zoom: 1,
                      panX: 0,
                      panY: 0,
                      manualPan: false,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-zinc-400">
            <span>
              Klik frame mana saja untuk mengatur posisi crop, zoom, atau menukar foto.
            </span>
            <span className="hidden sm:inline font-mono text-zinc-500">
              Drag foto di dalam frame untuk menggeser titik fokus
            </span>
          </div>
        )}
      </div>
    </main>
  );
};
