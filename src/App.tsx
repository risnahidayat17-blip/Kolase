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

function createDefaultSlotState(photoId: string | null): SlotState {
  return {
    photoId,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    flipH: false,
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
    img.onload = () => {
      resolve({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        url,
        width: img.naturalWidth || 1200,
        height: img.naturalHeight || 1500,
        isSample: false,
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

  // Synchronize slotStates whenever slots list changes
  const syncSlotsWithTemplate = useCallback(
    (nextSlots: SlotRect[], currentPhotos: PhotoAsset[]) => {
      setSlotStates((prev) => {
        const prevValues = Object.values(prev).filter((s) => s.photoId);
        const next: Record<string, SlotState> = {};
        nextSlots.forEach((slot, idx) => {
          if (prev[slot.id]) {
            next[slot.id] = prev[slot.id];
          } else if (prevValues[idx]?.photoId) {
            next[slot.id] = createDefaultSlotState(prevValues[idx].photoId);
          } else if (currentPhotos.length > 0) {
            next[slot.id] = createDefaultSlotState(
              currentPhotos[idx % currentPhotos.length].id
            );
          } else {
            next[slot.id] = createDefaultSlotState(null);
          }
        });
        return next;
      });
      setSelectedSlotId(null);
    },
    []
  );

  const handleSelectMode = useCallback(
    (nextMode: StudioMode) => {
      setMode(nextMode);
      const nextSlots =
        nextMode === 'collage'
          ? activeCollageTemplate.slots
          : activeCarouselTemplate.slots;
      syncSlotsWithTemplate(nextSlots, photos);
    },
    [activeCollageTemplate.slots, activeCarouselTemplate.slots, photos, syncSlotsWithTemplate]
  );

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      if (mode === 'collage') {
        setCollageTemplateId(templateId);
        const tpl = COLLAGE_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) syncSlotsWithTemplate(tpl.slots, photos);
      } else {
        setCarouselTemplateId(templateId);
        const tpl = CAROUSEL_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) syncSlotsWithTemplate(tpl.slots, photos);
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
        setPhotos((prev) => {
          const updated = [...uploaded, ...prev];
          return updated;
        });

        // Automatically fill empty slots if any exist
        setSlotStates((prev) => {
          const next = { ...prev };
          let uploadIdx = 0;
          for (const slot of activeSlots) {
            if (!next[slot.id]?.photoId && uploadIdx < uploaded.length) {
              next[slot.id] = createDefaultSlotState(uploaded[uploadIdx].id);
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
    [activeSlots, showToast]
  );

  const handleUploadToSlot = useCallback(
    async (slotId: string, fileList: FileList) => {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length === 0) return;
      try {
        const uploaded = await Promise.all(files.map(readImageFile));
        setPhotos((prev) => [...uploaded, ...prev]);
        setSlotStates((prev) => ({
          ...prev,
          [slotId]: createDefaultSlotState(uploaded[0].id),
        }));
      } catch {
        showToast('Gagal memuat foto ke frame.');
      }
    },
    [showToast]
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

  const handleAssignPhotoToSelected = useCallback(
    (photoId: string) => {
      if (selectedSlotId) {
        setSlotStates((prev) => ({
          ...prev,
          [selectedSlotId]: createDefaultSlotState(photoId),
        }));
        return;
      }
      // If no slot selected, fill first empty slot, or first slot
      const emptySlot = activeSlots.find((s) => !slotStates[s.id]?.photoId);
      const targetSlot = emptySlot ?? activeSlots[0];
      if (targetSlot) {
        setSlotStates((prev) => ({
          ...prev,
          [targetSlot.id]: createDefaultSlotState(photoId),
        }));
        setSelectedSlotId(targetSlot.id);
      }
    },
    [selectedSlotId, activeSlots, slotStates]
  );

  const handleAutoFill = useCallback(() => {
    if (photos.length === 0) {
      showToast('Upload foto terlebih dahulu untuk mengisi frame.');
      return;
    }
    setSlotStates(() => {
      const next: Record<string, SlotState> = {};
      activeSlots.forEach((slot, idx) => {
        next[slot.id] = createDefaultSlotState(photos[idx % photos.length].id);
      });
      return next;
    });
  }, [activeSlots, photos, showToast]);

  const handleShufflePhotos = useCallback(() => {
    if (photos.length === 0) return;
    const pool = [...photos].sort(() => Math.random() - 0.5);
    setSlotStates(() => {
      const next: Record<string, SlotState> = {};
      activeSlots.forEach((slot, idx) => {
        next[slot.id] = createDefaultSlotState(pool[idx % pool.length].id);
      });
      return next;
    });
  }, [activeSlots, photos]);

  const handleUpdateSlotState = useCallback(
    (slotId: string, patch: Partial<SlotState>) => {
      setSlotStates((prev) => ({
        ...prev,
        [slotId]: {
          ...(prev[slotId] ?? createDefaultSlotState(null)),
          ...patch,
        },
      }));
    },
    []
  );

  const handleSwapSlots = useCallback((slotIdA: string, slotIdB: string) => {
    setSlotStates((prev) => {
      const a = prev[slotIdA] ?? createDefaultSlotState(null);
      const b = prev[slotIdB] ?? createDefaultSlotState(null);
      return {
        ...prev,
        [slotIdA]: { ...b },
        [slotIdB]: { ...a },
      };
    });
  }, []);

  const handleDropPhotoOnSlot = useCallback((slotId: string, photoId: string) => {
    setSlotStates((prev) => ({
      ...prev,
      [slotId]: createDefaultSlotState(photoId),
    }));
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<CanvasSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

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
