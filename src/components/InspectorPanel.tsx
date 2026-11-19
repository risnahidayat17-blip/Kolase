import React from 'react';
import { Download, Eye } from 'lucide-react';
import { ASPECT_RATIOS, PAPER_PRESETS, TONE_PRESETS } from '../data/templates';
import {
  AspectRatioKey,
  CanvasSettings,
  ExportOptions,
  FrameStyle,
  StudioMode,
  TonePresetId,
} from '../types/studio';

interface InspectorPanelProps {
  mode: StudioMode;
  slideCount: number;
  settings: CanvasSettings;
  exportOptions: ExportOptions;
  isExporting: boolean;
  onUpdateSettings: (patch: Partial<CanvasSettings>) => void;
  onUpdateExportOptions: (patch: Partial<ExportOptions>) => void;
  onOpenPreview: () => void;
  onExport: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  mode,
  slideCount,
  settings,
  exportOptions,
  isExporting,
  onUpdateSettings,
  onUpdateExportOptions,
  onOpenPreview,
  onExport,
}) => {
  const availableRatios: AspectRatioKey[] =
    mode === 'carousel' ? ['4:5', '1:1', '3:4'] : ['4:5', '1:1', '3:4', '9:16'];

  return (
    <aside className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/90 bg-[#111114] flex flex-col min-h-0 lg:h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 1. Aspect Ratio Section */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-200">Rasio Instagram</h2>
            <span className="text-[11px] font-mono tabular-nums text-zinc-400">
              {ASPECT_RATIOS[
                mode === 'carousel' && settings.aspectRatio === '9:16'
                  ? '4:5'
                  : settings.aspectRatio
              ].sublabel.split(' · ')[0]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {availableRatios.map((key) => {
              const spec = ASPECT_RATIOS[key];
              const isActive =
                (mode === 'carousel' && settings.aspectRatio === '9:16'
                  ? '4:5'
                  : settings.aspectRatio) === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onUpdateSettings({ aspectRatio: key })}
                  className={`px-3 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#F2B705]/12 border-[#F2B705]/60 text-zinc-100'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-semibold whitespace-nowrap">{spec.label}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {spec.sublabel.split(' · ')[1]}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-zinc-800/80" />

        {/* 2. Margin, Gap, Radius */}
        <section className="space-y-3.5">
          <h2 className="text-xs font-semibold text-zinc-200">Bingkai & Proporsi Ruang</h2>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Margin Luar (Mat)</span>
              <span className="font-mono tabular-nums text-zinc-200">{settings.marginPx} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={2}
              value={settings.marginPx}
              onChange={(e) =>
                onUpdateSettings({ marginPx: parseInt(e.target.value, 10) })
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Jarak Antar Foto (Gap)</span>
              <span className="font-mono tabular-nums text-zinc-200">{settings.gapPx} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={56}
              step={2}
              value={settings.gapPx}
              onChange={(e) =>
                onUpdateSettings({ gapPx: parseInt(e.target.value, 10) })
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Kelengkungan Sudut</span>
              <span className="font-mono tabular-nums text-zinc-200">{settings.radiusPx} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              step={1}
              value={settings.radiusPx}
              onChange={(e) =>
                onUpdateSettings({ radiusPx: parseInt(e.target.value, 10) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </section>

        <div className="h-px bg-zinc-800/80" />

        {/* 3. Paper Mat Background & Frame Style */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-200">Warna Kertas & Gaya</h2>
            <span className="text-[11px] font-mono text-zinc-500">
              {settings.backgroundColor.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {PAPER_PRESETS.map((paper) => {
              const active =
                settings.backgroundColor.toLowerCase() === paper.hex.toLowerCase();
              return (
                <button
                  key={paper.hex}
                  type="button"
                  title={paper.name}
                  onClick={() => onUpdateSettings({ backgroundColor: paper.hex })}
                  style={{ backgroundColor: paper.hex }}
                  className={`w-8 h-8 rounded-lg border transition-transform cursor-pointer ${
                    active
                      ? 'ring-2 ring-[#F2B705] ring-offset-2 ring-offset-[#111114] scale-105 border-zinc-400'
                      : 'border-zinc-700 hover:scale-105'
                  }`}
                />
              );
            })}
            <label
              title="Pilih warna kustom"
              className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-300 cursor-pointer hover:border-zinc-500 overflow-hidden relative"
            >
              <span>+</span>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) =>
                  onUpdateSettings({ backgroundColor: e.target.value })
                }
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { id: 'clean', label: 'Bersih' },
              { id: 'museum-mat', label: 'Garis Halus' },
              { id: 'film-35mm', label: 'Index 35mm' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() =>
                  onUpdateSettings({ frameStyle: style.id as FrameStyle })
                }
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                  settings.frameStyle === style.id
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-zinc-800/80" />

        {/* 4. Film Color Tone & Grain */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-200">Color Tone & Film Grain</h2>

          <div className="grid grid-cols-2 gap-1.5">
            {TONE_PRESETS.map((tone) => {
              const active = settings.tonePreset === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ tonePreset: tone.id as TonePresetId })
                  }
                  className={`px-2.5 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#F2B705]/12 border-[#F2B705]/60 text-zinc-100'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-medium truncate">{tone.name}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Tekstur Film Grain</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {settings.grainAmount}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={2}
              value={settings.grainAmount}
              onChange={(e) =>
                onUpdateSettings({ grainAmount: parseInt(e.target.value, 10) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </section>

        <div className="h-px bg-zinc-800/80" />

        {/* 5. Editorial Title & EXIF Footer */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="toggle-exif"
              className="text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              Judul & Info EXIF Bawah
            </label>
            <button
              id="toggle-exif"
              type="button"
              role="switch"
              aria-checked={settings.showExifFooter}
              onClick={() =>
                onUpdateSettings({ showExifFooter: !settings.showExifFooter })
              }
              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                settings.showExifFooter ? 'bg-[#F2B705]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                  settings.showExifFooter ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.showExifFooter && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Judul Seri Foto
                </label>
                <input
                  type="text"
                  value={settings.seriesTitle}
                  onChange={(e) =>
                    onUpdateSettings({ seriesTitle: e.target.value })
                  }
                  placeholder="Contoh: Solitude in Light"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#F2B705]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Kamera / Lensa / Lokasi
                </label>
                <input
                  type="text"
                  value={settings.exifText}
                  onChange={(e) =>
                    onUpdateSettings({ exifText: e.target.value })
                  }
                  placeholder="Contoh: Leica M6 · 35mm f/1.4 · Tokyo"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#F2B705]"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => onUpdateSettings({ footerAlign: align })}
                    className={`py-1 text-xs rounded-md border capitalize transition-colors cursor-pointer ${
                      settings.footerAlign === align
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Export & Preview Action Dock */}
      <div className="p-4 border-t border-zinc-800/90 bg-[#0D0D0F] space-y-3 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={exportOptions.format}
            onChange={(e) =>
              onUpdateExportOptions({
                format: e.target.value as 'image/jpeg' | 'image/png',
              })
            }
            aria-label="Format file export"
            className="px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-[#F2B705] cursor-pointer"
          >
            <option value="image/jpeg">JPEG (IG Optimal)</option>
            <option value="image/png">PNG (Lossless)</option>
          </select>

          <select
            value={exportOptions.scale}
            onChange={(e) =>
              onUpdateExportOptions({
                scale: Number(e.target.value) as 1 | 2,
              })
            }
            aria-label="Resolusi export"
            className="px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-[#F2B705] cursor-pointer"
          >
            <option value={1}>1080px (Standard)</option>
            <option value={2}>2160px (Ultra HD 2×)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-3 py-2.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Pratinjau</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-950 bg-[#F2B705] hover:bg-[#e5ad04] disabled:opacity-60 rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isExporting
                ? 'Menyimpan...'
                : mode === 'carousel'
                ? `Download ${slideCount} Slide`
                : 'Download Hasil'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
