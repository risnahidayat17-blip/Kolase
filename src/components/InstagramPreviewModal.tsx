import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { StudioMode } from '../types/studio';

interface InstagramPreviewModalProps {
  isOpen: boolean;
  mode: StudioMode;
  renderedSlides: { filename: string; dataUrl: string }[];
  isRendering: boolean;
  seriesTitle: string;
  exifText: string;
  onClose: () => void;
  onDownloadAll: () => void;
}

export const InstagramPreviewModal: React.FC<InstagramPreviewModalProps> = ({
  isOpen,
  mode,
  renderedSlides,
  isRendering,
  seriesTitle,
  exifText,
  onClose,
  onDownloadAll,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'feed' | 'profile'>('feed');

  useEffect(() => {
    setActiveSlide(0);
  }, [renderedSlides.length, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && activeSlide < renderedSlides.length - 1) {
        setActiveSlide((s) => s + 1);
      }
      if (e.key === 'ArrowLeft' && activeSlide > 0) {
        setActiveSlide((s) => s - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeSlide, renderedSlides.length, onClose]);

  if (!isOpen) return null;

  const currentUrl = renderedSlides[activeSlide]?.dataUrl;

  const downloadSingle = (item: { filename: string; dataUrl: string }) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = item.filename;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Pratinjau Instagram
            </h2>
            <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'feed'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Tampilan Feed
              </button>
              <button
                type="button"
                onClick={() => setViewMode('profile')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'profile'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Grid Profil 3×3
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-[#09090B]">
          {isRendering ? (
            <div className="py-24 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-[#F2B705] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-400">Menyiapkan pratinjau resolusi tinggi...</p>
            </div>
          ) : viewMode === 'feed' ? (
            /* Authentic IG Post Card */
            <div className="w-full max-w-[390px] bg-black border border-zinc-800 rounded-xl overflow-hidden">
              {/* IG Post Header */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-editorial font-semibold text-zinc-200">
                    R
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-100 leading-tight">
                      studio.ris
                    </div>
                    <div className="text-[10px] text-zinc-400 leading-tight">
                      {exifText || 'Jakarta, Indonesia'}
                    </div>
                  </div>
                </div>
                {mode === 'carousel' && renderedSlides.length > 1 && (
                  <span className="text-[11px] font-mono tabular-nums text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-full">
                    {activeSlide + 1}/{renderedSlides.length}
                  </span>
                )}
              </div>

              {/* IG Media Viewport */}
              <div className="relative bg-zinc-950 flex items-center justify-center">
                {currentUrl && (
                  <img
                    src={currentUrl}
                    alt={`Instagram slide ${activeSlide + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto block"
                  />
                )}

                {renderedSlides.length > 1 && activeSlide > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSlide((s) => s - 1)}
                    aria-label="Slide sebelumnya"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {renderedSlides.length > 1 && activeSlide < renderedSlides.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveSlide((s) => s + 1)}
                    aria-label="Slide berikutnya"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* IG Action Bar & Pagination Dots */}
              <div className="px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 text-zinc-200">
                    <Heart className="w-5 h-5" aria-hidden="true" />
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    <Send className="w-5 h-5" aria-hidden="true" />
                  </div>

                  {renderedSlides.length > 1 && (
                    <div className="flex items-center gap-1">
                      {renderedSlides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlide(idx)}
                          aria-label={`Pilih slide ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeSlide
                              ? 'w-3 bg-[#3897f0]'
                              : 'w-1.5 bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <Bookmark className="w-5 h-5 text-zinc-200" aria-hidden="true" />
                </div>

                <div className="text-xs text-zinc-200 leading-relaxed">
                  <span className="font-semibold mr-1.5">studio.ris</span>
                  <span className="text-zinc-300">
                    {seriesTitle || 'Curated multi-frame visual series.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* IG 3x3 Profile Grid Simulation */
            <div className="w-full max-w-[400px] bg-black border border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">studio.ris</div>
                  <div className="text-xs text-zinc-400">
                    Simulasi Tampilan Grid Profil (Rasio 3:4 / 4:5)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-0.5 bg-zinc-900">
                {/* Highlighted current post in first slot */}
                <div className="aspect-[3/4] bg-zinc-950 overflow-hidden relative ring-1 ring-[#F2B705]">
                  {renderedSlides[0] && (
                    <img
                      src={renderedSlides[0].dataUrl}
                      alt="Postingan baru Anda"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Adjacent placeholder archival tiles */}
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="aspect-[3/4] bg-zinc-900/90 flex items-center justify-center text-[10px] font-mono text-zinc-600"
                  >
                    ARSIP {n}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Individual Slide Download or All */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-[#111114] flex flex-wrap items-center justify-between gap-3">
          {renderedSlides.length > 1 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {renderedSlides.map((slide, idx) => (
                <button
                  key={slide.filename}
                  type="button"
                  onClick={() => downloadSingle(slide)}
                  className="px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer"
                >
                  Slide {idx + 1} ↓
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-zinc-400">
              Siap diunggah ke Instagram tanpa kompresi berlebih
            </span>
          )}

          <button
            type="button"
            onClick={onDownloadAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-[#F2B705] hover:bg-[#e5ad04] rounded-lg transition-colors whitespace-nowrap cursor-pointer ml-auto"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {renderedSlides.length > 1
                ? `Download Semua (${renderedSlides.length} Slide)`
                : 'Download Gambar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
