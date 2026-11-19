import { useCallback, useEffect, useMemo, useState } from 'react';
import { InspectorPanel } from './components/InspectorPanel';
import { InstagramPreviewModal } from './components/InstagramPreviewModal';
import { PhotoLibraryPanel } from './components/PhotoLibraryPanel';
import { RatioGuideModal } from './components/RatioGuideModal';
import { StudioCanvas } from './components/StudioCanvas';
import { TopBar } from './components/TopBar';
import {
  CAROUSEL_TEMPLATES,
  COLLAGE_TEMPLATES,
  SAMPLE_PHOTOS,
} from './data/templates';
import {
  CanvasSettings,
  ExportOptions,
  PhotoAsset,
  SlotRect,
  SlotState,
  StudioMode,
} from './types/studio';
import { renderExportCanvases } from './utils/canvasRenderer';
import { computeAutoPanForSlot, detectPhotoFocus } from './utils/faceDetector';

function createDefaultSlotState(photoId: string | null): SlotState {
  return {
    photoId,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    flipH: false,
    manualPan: false,
  };
}

function buildInitialSlotStates(
  slots: SlotRect[],
  photos: PhotoAsset[]
): Record<string, SlotState> {
  const states: Record<string, SlotState> = {};
  slots.forEach((slot, idx) => {
    const photo = photos.length > 0 ? photos[idx % photos.length] : null;
    states[slot.id] = createDefaultSlotState(photo ? photo.id : null);
  });
  return states;
}

function readImageFile(file: File): Promise<PhotoAsset> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const faceRegion = await detectPhotoFocus(url);
      resolve({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        url,
        width: img.naturalWidth || 1200,
        height: img.naturalHeight || 1500,
        isSample: false,
        faceRegion,
        faceChecked: true,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Gagal memuat gambar ${file.name}`));
    };
    img.src = url;
  });
}

export default function App() {
  const [mode, setMode] = useState<StudioMode>('collage');
  const [photos, setPhotos] = useState<PhotoAsset[]>(SAMPLE_PHOTOS);

  const [collageTemplateId, setCollageTemplateId] = useState<string>('hero-two-detail');
  const [carouselTemplateId, setCarouselTemplateId] = useState<string>('seamless-triptych-3');

  const activeCollageTemplate = useMemo(
    () =>
      COLLAGE_TEMPLATES.find((t) => t.id === collageTemplateId) ?? COLLAGE_TEMPLATES[0],
    [collageTemplateId]
  );

  const activeCarouselTemplate = useMemo(
    () =>
      CAROUSEL_TEMPLATES.find((t) => t.id === carouselTemplateId) ?? CAROUSEL_TEMPLATES[0],
    [carouselTemplateId]
  );

  const activeSlots = useMemo(
    () =>
      mode === 'collage' ? activeCollageTemplate.slots : activeCarouselTemplate.slots,
    [mode, activeCollageTemplate, activeCarouselTemplate]
  );

  const activeSlideCount =
    mode === 'collage' ? 1 : activeCarouselTemplate.slideCount;

  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>(() =>
    buildInitialSlotStates(
      (COLLAGE_TEMPLATES.find((t) => t.id === 'hero-two-detail') ?? COLLAGE_TEMPLATES[0]).slots,
      SAMPLE_PHOTOS
    )
  );

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [autoCenterFace, setAutoCenterFace] = useState<boolean>(true);

  const [settings, setSettings] = useState<CanvasSettings>({
    aspectRatio: '4:5',
    marginPx: 48,
    gapPx: 14,
    radiusPx: 0,
    backgroundColor: '#F5F2EB',
    frameStyle: 'clean',
    tonePreset: 'original',
    grainAmount: 4,
    showExifFooter: true,
    seriesTitle: 'Solitude in Light & Stone',
    exifText: 'Leica M6 · 35mm f/1.4 · Archival Series',
    footerAlign: 'left',
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'image/jpeg',
    scale: 1,
    quality: 0.95,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRatioGuideOpen, setIsRatioGuideOpen] = useState(false);
  const [previewSlides, setPreviewSlides] = useState<
    { filename: string; dataUrl: string }[]
  >([]);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const applyAutoFaceToStates = useCallback(
    (
      statesMap: Record<string, SlotState>,
      targetSlots: SlotRect[],
      currentPhotos: PhotoAsset[],
      targetMode: StudioMode,
      targetSlideCount: number,
      targetSettings: CanvasSettings,
      respectManualPan: boolean
    ): Record<string, SlotState> => {
      const next: Record<string, SlotState> = {};
      for (const slot of targetSlots) {
        const st = statesMap[slot.id] ?? createDefaultSlotState(null);
        const photo = st.photoId
          ? currentPhotos.find((p) => p.id === st.photoId)
          : undefined;

        if (photo?.faceRegion && (!respectManualPan || !st.manualPan)) {
          const { panX, panY } = computeAutoPanForSlot({
            photo,
            slotId: slot.id,
            mode: targetMode,
            slideCount: targetSlideCount,
            slots: targetSlots,
            settings: targetSettings,
            state: st,
          });
          next[slot.id] = {
            ...st,
            panX,
            panY,
            manualPan: respectManualPan ? st.manualPan : false,
          };
        } else {
          next[slot.id] = respectManualPan
            ? st
            : { ...st, panX: 0, panY: 0, manualPan: false };
        }
      }
      return next;
    },
    []
  );

  // Detect faces asynchronously for sample/unchecked photos and auto-center active slots
  useEffect(() => {
    const unchecked = photos.filter((p) => !p.faceChecked);
    if (unchecked.length === 0) return;

    let cancelled = false;
    Promise.all(
      unchecked.map(async (p) => ({
        id: p.id,
        faceRegion: await detectPhotoFocus(p.url),
      }))
    ).then((results) => {
      if (cancelled) return;
      const resultMap = new Map(results.map((r) => [r.id, r.faceRegion]));
      setPhotos((prev) => {
        const updated = prev.map((p) =>
          resultMap.has(p.id)
            ? { ...p, faceRegion: resultMap.get(p.id) ?? null, faceChecked: true }
            : p
        );
        if (autoCenterFace) {
          setSlotStates((prevStates) =>
            applyAutoFaceToStates(
              prevStates,
              activeSlots,
              updated,
              mode,
              activeSlideCount,
              settings,
              true
            )
          );
        }
        return updated;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [photos, autoCenterFace, activeSlots, mode, activeSlideCount, settings, applyAutoFaceToStates]);

  // Synchronize slotStates whenever template or mode changes
  const syncSlotsWithTemplate = useCallback(
    (
      nextSlots: SlotRect[],
      currentPhotos: PhotoAsset[],
      nextMode: StudioMode,
      nextSlideCount: number
    ) => {
      setSlotStates((prev) => {
        const prevValues = Object.values(prev).filter((s) => s.photoId);
        const mapped: Record<string, SlotState> = {};
        nextSlots.forEach((slot, idx) => {
          if (prev[slot.id]?.photoId) {
            mapped[slot.id] = createDefaultSlotState(prev[slot.id].photoId);
          } else if (prevValues[idx]?.photoId) {
            mapped[slot.id] = createDefaultSlotState(prevValues[idx].photoId);
          } else if (currentPhotos.length > 0) {
            mapped[slot.id] = createDefaultSlotState(
              currentPhotos[idx % currentPhotos.length].id
            );
          } else {
            mapped[slot.id] = createDefaultSlotState(null);
          }
        });

        if (!autoCenterFace) return mapped;
        return applyAutoFaceToStates(
          mapped,
          nextSlots,
          currentPhotos,
          nextMode,
          nextSlideCount,
          settings,
          false
        );
      });
      setSelectedSlotId(null);
    },
    [autoCenterFace, applyAutoFaceToStates, settings]
  );

  const handleSelectMode = useCallback(
    (nextMode: StudioMode) => {
      setMode(nextMode);
      const nextSlots =
        nextMode === 'collage'
          ? activeCollageTemplate.slots
          : activeCarouselTemplate.slots;
      const nextSlideCount =
        nextMode === 'collage' ? 1 : activeCarouselTemplate.slideCount;
      syncSlotsWithTemplate(nextSlots, photos, nextMode, nextSlideCount);
    },
    [
      activeCollageTemplate.slots,
      activeCarouselTemplate.slots,
      activeCarouselTemplate.slideCount,
      photos,
      syncSlotsWithTemplate,
    ]
  );

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      if (mode === 'collage') {
        setCollageTemplateId(templateId);
        const tpl = COLLAGE_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) syncSlotsWithTemplate(tpl.slots, photos, 'collage', 1);
      } else {
        setCarouselTemplateId(templateId);
        const tpl = CAROUSEL_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) syncSlotsWithTemplate(tpl.slots, photos, 'carousel', tpl.slideCount);
      }
    },
    [mode, photos, syncSlotsWithTemplate]
  );

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length === 0) return;

      try {
        const uploaded = await Promise.all(files.map(readImageFile));
        const nextPhotos = [...uploaded, ...photos];
        setPhotos(nextPhotos);

        // Automatically fill empty slots if any exist, centered on face
        setSlotStates((prev) => {
          const next = { ...prev };
          let uploadIdx = 0;
          for (const slot of activeSlots) {
            if (!next[slot.id]?.photoId && uploadIdx < uploaded.length) {
              const photo = uploaded[uploadIdx];
              const baseState = createDefaultSlotState(photo.id);
              if (autoCenterFace && photo.faceRegion) {
                const { panX, panY } = computeAutoPanForSlot({
                  photo,
                  slotId: slot.id,
                  mode,
                  slideCount: activeSlideCount,
                  slots: activeSlots,
                  settings,
                  state: baseState,
                });
                next[slot.id] = { ...baseState, panX, panY };
              } else {
                next[slot.id] = baseState;
              }
              uploadIdx++;
            }
          }
          return next;
        });

        showToast(`${uploaded.length} foto ditambahkan ke galeri`);
      } catch {
        showToast('Sebagian file tidak dapat dibaca sebagai gambar.');
      }
    },
    [activeSlots, activeSlideCount, autoCenterFace, mode, photos, settings, showToast]
  );

  const handleUploadToSlot = useCallback(
    async (slotId: string, fileList: FileList) => {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length === 0) return;
      try {
        const uploaded = await Promise.all(files.map(readImageFile));
        const photo = uploaded[0];
        setPhotos((prev) => [...uploaded, ...prev]);

        const baseState = createDefaultSlotState(photo.id);
        let finalState = baseState;
        if (autoCenterFace && photo.faceRegion) {
          const { panX, panY } = computeAutoPanForSlot({
            photo,
            slotId,
            mode,
            slideCount: activeSlideCount,
            slots: activeSlots,
            settings,
            state: baseState,
          });
          finalState = { ...baseState, panX, panY };
        }
        setSlotStates((prev) => ({
          ...prev,
          [slotId]: finalState,
        }));
      } catch {
        showToast('Gagal memuat foto ke frame.');
      }
    },
    [activeSlots, activeSlideCount, autoCenterFace, mode, settings, showToast]
  );

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (target && !target.isSample) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((p) => p.id !== photoId);
    });
    setSlotStates((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].photoId === photoId) {
          next[key] = createDefaultSlotState(null);
        }
      }
      return next;
    });
  }, []);

  const createFramedStateForSlot = useCallback(
    (slotId: string, photoId: string): SlotState => {
      const baseState = createDefaultSlotState(photoId);
      if (!autoCenterFace) return baseState;
      const photo = photos.find((p) => p.id === photoId);
      if (!photo?.faceRegion) return baseState;
      const { panX, panY } = computeAutoPanForSlot({
        photo,
        slotId,
        mode,
        slideCount: activeSlideCount,
        slots: activeSlots,
        settings,
        state: baseState,
      });
      return { ...baseState, panX, panY };
    },
    [activeSlots, activeSlideCount, autoCenterFace, mode, photos, settings]
  );

  const handleAssignPhotoToSelected = useCallback(
    (photoId: string) => {
      if (selectedSlotId) {
        setSlotStates((prev) => ({
          ...prev,
          [selectedSlotId]: createFramedStateForSlot(selectedSlotId, photoId),
        }));
        return;
      }
      // If no slot selected, fill first empty slot, or first slot
      const emptySlot = activeSlots.find((s) => !slotStates[s.id]?.photoId);
      const targetSlot = emptySlot ?? activeSlots[0];
      if (targetSlot) {
        setSlotStates((prev) => ({
          ...prev,
          [targetSlot.id]: createFramedStateForSlot(targetSlot.id, photoId),
        }));
        setSelectedSlotId(targetSlot.id);
      }
    },
    [selectedSlotId, activeSlots, slotStates, createFramedStateForSlot]
  );

  const handleAutoFill = useCallback(() => {
    if (photos.length === 0) {
      showToast('Upload foto terlebih dahulu untuk mengisi frame.');
      return;
    }
    setSlotStates(() => {
      const next: Record<string, SlotState> = {};
      activeSlots.forEach((slot, idx) => {
        next[slot.id] = createFramedStateForSlot(
          slot.id,
          photos[idx % photos.length].id
        );
      });
      return next;
    });
  }, [activeSlots, photos, createFramedStateForSlot, showToast]);

  const handleShufflePhotos = useCallback(() => {
    if (photos.length === 0) return;
    const pool = [...photos].sort(() => Math.random() - 0.5);
    setSlotStates(() => {
      const next: Record<string, SlotState> = {};
      activeSlots.forEach((slot, idx) => {
        next[slot.id] = createFramedStateForSlot(
          slot.id,
          pool[idx % pool.length].id
        );
      });
      return next;
    });
  }, [activeSlots, photos, createFramedStateForSlot]);

  const handleUpdateSlotState = useCallback(
    (slotId: string, patch: Partial<SlotState>) => {
      setSlotStates((prev) => {
        const current = prev[slotId] ?? createDefaultSlotState(null);
        const updated: SlotState = { ...current, ...patch };
        const shouldReframe =
          autoCenterFace &&
          !updated.manualPan &&
          updated.photoId &&
          (patch.rotation !== undefined ||
            patch.flipH !== undefined ||
            patch.zoom !== undefined);

        if (shouldReframe) {
          const photo = photos.find((p) => p.id === updated.photoId);
          if (photo?.faceRegion) {
            const { panX, panY } = computeAutoPanForSlot({
              photo,
              slotId,
              mode,
              slideCount: activeSlideCount,
              slots: activeSlots,
              settings,
              state: updated,
            });
            return {
              ...prev,
              [slotId]: { ...updated, panX, panY },
            };
          }
        }
        return {
          ...prev,
          [slotId]: updated,
        };
      });
    },
    [activeSlots, activeSlideCount, autoCenterFace, mode, photos, settings]
  );

  const handleSwapSlots = useCallback(
    (slotIdA: string, slotIdB: string) => {
      setSlotStates((prev) => {
        const a = prev[slotIdA] ?? createDefaultSlotState(null);
        const b = prev[slotIdB] ?? createDefaultSlotState(null);
        const swappedA = a.photoId
          ? createFramedStateForSlot(slotIdB, a.photoId)
          : createDefaultSlotState(null);
        const swappedB = b.photoId
          ? createFramedStateForSlot(slotIdA, b.photoId)
          : createDefaultSlotState(null);
        return {
          ...prev,
          [slotIdA]: swappedB,
          [slotIdB]: swappedA,
        };
      });
    },
    [createFramedStateForSlot]
  );

  const handleDropPhotoOnSlot = useCallback(
    (slotId: string, photoId: string) => {
      setSlotStates((prev) => ({
        ...prev,
        [slotId]: createFramedStateForSlot(slotId, photoId),
      }));
    },
    [createFramedStateForSlot]
  );

  const handleFocusFaceSlot = useCallback(
    async (slotId: string) => {
      const state = slotStates[slotId];
      if (!state?.photoId) return;
      let photo = photos.find((p) => p.id === state.photoId);
      if (!photo) return;

      if (!photo.faceChecked) {
        const region = await detectPhotoFocus(photo.url);
        photo = { ...photo, faceRegion: region, faceChecked: true };
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo!.id ? photo! : p))
        );
      }

      if (!photo.faceRegion) {
        setSlotStates((prev) => ({
          ...prev,
          [slotId]: { ...state, panX: 0, panY: 0, manualPan: false },
        }));
        showToast('Wajah tidak terdeteksi, posisi dikembalikan ke tengah.');
        return;
      }

      const { panX, panY } = computeAutoPanForSlot({
        photo,
        slotId,
        mode,
        slideCount: activeSlideCount,
        slots: activeSlots,
        settings,
        state,
      });

      setSlotStates((prev) => ({
        ...prev,
        [slotId]: { ...state, panX, panY, manualPan: false },
      }));
      showToast('Posisi frame dipusatkan ke wajah.');
    },
    [
      activeSlots,
      activeSlideCount,
      mode,
      photos,
      settings,
      slotStates,
      showToast,
    ]
  );

  const handleToggleAutoCenterFace = useCallback(() => {
    setAutoCenterFace((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        setSlotStates((curr) =>
          applyAutoFaceToStates(
            curr,
            activeSlots,
            photos,
            mode,
            activeSlideCount,
            settings,
            false
          )
        );
        showToast('Auto Wajah diaktifkan — frame dipusatkan ke wajah.');
      } else {
        showToast('Auto Wajah dinonaktifkan.');
      }
      return nextVal;
    });
  }, [
    activeSlots,
    activeSlideCount,
    applyAutoFaceToStates,
    mode,
    photos,
    settings,
    showToast,
  ]);

  const handleUpdateSettings = useCallback(
    (patch: Partial<CanvasSettings>) => {
      setSettings((prev) => {
        const nextSettings = { ...prev, ...patch };
        if (
          autoCenterFace &&
          (patch.aspectRatio !== undefined ||
            patch.marginPx !== undefined ||
            patch.gapPx !== undefined ||
            patch.showExifFooter !== undefined)
        ) {
          setSlotStates((curr) =>
            applyAutoFaceToStates(
              curr,
              activeSlots,
              photos,
              mode,
              activeSlideCount,
              nextSettings,
              true
            )
          );
        }
        return nextSettings;
      });
    },
    [
      activeSlots,
      activeSlideCount,
      applyAutoFaceToStates,
      autoCenterFace,
      mode,
      photos,
    ]
  );

  const handleUpdateExportOptions = useCallback(
    (patch: Partial<ExportOptions>) => {
      setExportOptions((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleOpenPreview = useCallback(async () => {
    setIsPreviewOpen(true);
    setIsRenderingPreview(true);
    try {
      const slides = await renderExportCanvases({
        mode,
        slideCount: activeSlideCount,
        slots: activeSlots,
        slotStates,
        photos,
        settings,
        exportOptions: { format: 'image/jpeg', scale: 1, quality: 0.92 },
      });
      setPreviewSlides(slides);
    } catch {
      showToast('Gagal merender pratinjau Instagram.');
    } finally {
      setIsRenderingPreview(false);
    }
  }, [mode, activeSlideCount, activeSlots, slotStates, photos, settings, showToast]);

  const triggerDownloads = (files: { filename: string; dataUrl: string }[]) => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 220);
    });
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const files = await renderExportCanvases({
        mode,
        slideCount: activeSlideCount,
        slots: activeSlots,
        slotStates,
        photos,
        settings,
        exportOptions,
      });
      triggerDownloads(files);
      showToast(
        files.length > 1
          ? `${files.length} slide carousel berhasil diunduh`
          : 'Layout resolusi tinggi berhasil diunduh'
      );
    } catch {
      showToast('Terjadi kesalahan saat mengekspor gambar.');
    } finally {
      setIsExporting(false);
    }
  }, [
    mode,
    activeSlideCount,
    activeSlots,
    slotStates,
    photos,
    settings,
    exportOptions,
    showToast,
  ]);

  // Escape key deselects active slot
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPreviewOpen && !isRatioGuideOpen) {
        setSelectedSlotId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewOpen, isRatioGuideOpen]);

  const activeTemplateId =
    mode === 'collage' ? collageTemplateId : carouselTemplateId;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0A0A0B] text-zinc-100">
      <TopBar
        mode={mode}
        onSelectMode={handleSelectMode}
        onOpenPreview={handleOpenPreview}
        onOpenRatioGuide={() => setIsRatioGuideOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Mobile Mode Switcher (visible below md breakpoint) */}
      <div className="md:hidden px-4 py-2 border-b border-zinc-800 bg-[#0D0D0F] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => handleSelectMode('collage')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              mode === 'collage' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'
            }`}
          >
            Layout Grid
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('carousel')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              mode === 'carousel' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'
            }`}
          >
            Carousel
          </button>
        </div>
        <button
          type="button"
          onClick={handleOpenPreview}
          className="px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-md"
        >
          Pratinjau IG
        </button>
      </div>

      {/* Main 3-Column Darkroom Studio Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <PhotoLibraryPanel
          mode={mode}
          photos={photos}
          activeTemplateId={activeTemplateId}
          selectedSlotId={selectedSlotId}
          onSelectTemplate={handleSelectTemplate}
          onUploadFiles={handleUploadFiles}
          onRemovePhoto={handleRemovePhoto}
          onAssignPhotoToSelected={handleAssignPhotoToSelected}
          onAutoFill={handleAutoFill}
          onShufflePhotos={handleShufflePhotos}
        />

        <StudioCanvas
          mode={mode}
          slideCount={activeSlideCount}
          slots={activeSlots}
          slotStates={slotStates}
          photos={photos}
          settings={settings}
          selectedSlotId={selectedSlotId}
          autoCenterFace={autoCenterFace}
          onToggleAutoCenterFace={handleToggleAutoCenterFace}
          onFocusFaceSlot={handleFocusFaceSlot}
          onSelectSlot={setSelectedSlotId}
          onUpdateSlotState={handleUpdateSlotState}
          onSwapSlots={handleSwapSlots}
          onDropPhotoOnSlot={handleDropPhotoOnSlot}
          onUploadToSlot={handleUploadToSlot}
        />

        <InspectorPanel
          mode={mode}
          slideCount={activeSlideCount}
          settings={settings}
          exportOptions={exportOptions}
          isExporting={isExporting}
          onUpdateSettings={handleUpdateSettings}
          onUpdateExportOptions={handleUpdateExportOptions}
          onOpenPreview={handleOpenPreview}
          onExport={handleExport}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-100 shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      <InstagramPreviewModal
        isOpen={isPreviewOpen}
        mode={mode}
        renderedSlides={previewSlides}
        isRendering={isRenderingPreview}
        seriesTitle={settings.seriesTitle}
        exifText={settings.exifText}
        onClose={() => setIsPreviewOpen(false)}
        onDownloadAll={handleExport}
      />

      <RatioGuideModal
        isOpen={isRatioGuideOpen}
        onClose={() => setIsRatioGuideOpen(false)}
      />
    </div>
  );
}
