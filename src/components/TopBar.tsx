import React from 'react';
import { Download } from 'lucide-react';
import { StudioMode } from '../types/studio';

interface TopBarProps {
  mode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;
  onOpenPreview: () => void;
  onOpenRatioGuide: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onSelectMode,
  onOpenPreview,
  onOpenRatioGuide,
  onExport,
  isExporting,
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-zinc-800/90 bg-[#0D0D0F] px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Single-line Brand Wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectMode('collage');
        }}
        className="font-editorial text-2xl font-semibold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B705] rounded"
      >
        Ris Studio
      </a>

      {/* Zone 2: Clean single-line navigation links */}
      <nav aria-label="Workspace Navigation" className="hidden md:flex items-center gap-7">
        <button
          type="button"
          onClick={() => onSelectMode('collage')}
          className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
            mode === 'collage'
              ? 'text-zinc-100 border-[#F2B705]'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          Layout Grid
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('carousel')}
          className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
            mode === 'carousel'
              ? 'text-zinc-100 border-[#F2B705]'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          Carousel Panorama
        </button>
        <button
          type="button"
          onClick={onOpenPreview}
          className="text-sm font-medium text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Pratinjau IG
        </button>
        <button
          type="button"
          onClick={onOpenRatioGuide}
          className="text-sm font-medium text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Panduan Rasio
        </button>
      </nav>

      {/* Zone 3: Single Primary Action CTA */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-[#F2B705] hover:bg-[#e5ad04] active:scale-[0.98] disabled:opacity-60 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B705] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isExporting ? 'Memproses...' : 'Export HD'}</span>
        </button>
      </div>
    </header>
  );
};
