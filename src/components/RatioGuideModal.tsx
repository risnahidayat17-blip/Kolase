import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface RatioGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RatioGuideModal: React.FC<RatioGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">
            Panduan Rasio & Workflow Fotografer IG
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-zinc-300 leading-relaxed max-h-[75vh] overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#F2B705]">
              01. Standar Resolusi Feed Instagram
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-mono text-xs font-medium text-zinc-100">
                  4:5 Portrait · 1080 × 1350 px
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Pilihan utama fotografer IG karena memenuhi ruang vertikal layar ponsel secara maksimal.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-mono text-xs font-medium text-zinc-100">
                  3:4 Editorial · 1080 × 1440 px
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Rasio native kamera DSLR/Mirrorless serta sesuai dengan tampilan baru grid profil IG.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-mono text-xs font-medium text-zinc-100">
                  1:1 Square · 1080 × 1080 px
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Klasik medium format (Hasselblad 6×6) untuk komposisi simetris yang tenang.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="font-mono text-xs font-medium text-zinc-100">
                  9:16 Story · 1080 × 1920 px
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Untuk kolase Instagram Story atau sampul Reels multi-frame.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-[#F2B705]">
              02. Teknik Carousel Seamless
            </h3>
            <p className="text-xs text-zinc-400">
              Pada tab <span className="text-zinc-200 font-medium">Carousel Panorama</span>, garis putus-putus kuning menandai batas antar-slide Instagram. Foto yang melintasi garis tersebut akan otomatis terpotong presisi menjadi file berurutan (<span className="font-mono text-zinc-300">slide-01</span>, <span className="font-mono text-zinc-300">slide-02</span>, dst.) agar tersambung mulus saat digeser di Instagram.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-[#F2B705]">
              03. Tips Matting & Konsistensi Feed
            </h3>
            <p className="text-xs text-zinc-400">
              Gunakan <span className="text-zinc-200 font-medium">Archival Paper (#F5F2EB)</span> atau <span className="text-zinc-200 font-medium">Gallery White (#FFFFFF)</span> dengan margin konsisten 48–64 px agar foto landscape dan portrait tetap harmonis berdampingan di profil Instagram Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
