import React, { useRef, useState } from 'react';
import { Upload, Shuffle, Sparkles, Trash2, ImagePlus } from 'lucide-react';
import { CAROUSEL_TEMPLATES, COLLAGE_TEMPLATES } from '../data/templates';
import { LayoutTemplate, PhotoAsset, StudioMode } from '../types/studio';
import { TemplateThumbnail } from './TemplateThumbnail';

interface PhotoLibraryPanelProps {
  mode: StudioMode;
  photos: PhotoAsset[];
  activeTemplateId: string;
  selectedSlotId: string | null;
  onSelectTemplate: (id: string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onRemovePhoto: (photoId: string) => void;
  onAssignPhotoToSelected: (photoId: string) => void;
  onAutoFill: () => void;
  onShufflePhotos: () => void;
}

type LeftTab = 'templates' | 'photos';
type CategoryFilter = 'all' | LayoutTemplate['category'];
type SlideFilter = 'all' | 2 | 3 | 4 | '5+';

export const PhotoLibraryPanel: React.FC<PhotoLibraryPanelProps> = ({
  mode,
  photos,
  activeTemplateId,
  selectedSlotId,
  onSelectTemplate,
  onUploadFiles,
  onRemovePhoto,
  onAssignPhotoToSelected,
  onAutoFill,
  onShufflePhotos,
}) => {
  const [activeTab, setActiveTab] = useState<LeftTab>('templates');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [slideFilter, setSlideFilter] = useState<SlideFilter>('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCollageTemplates =
    categoryFilter === 'all'
      ? COLLAGE_TEMPLATES
      : COLLAGE_TEMPLATES.filter((t) => t.category === categoryFilter);

  const filteredCarouselTemplates =
    slideFilter === 'all'
      ? CAROUSEL_TEMPLATES
      : slideFilter === '5+'
      ? CAROUSEL_TEMPLATES.filter((t) => t.slideCount >= 5)
      : CAROUSEL_TEMPLATES.filter((t) => t.slideCount === slideFilter);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
      setActiveTab('photos');
    }
  };

  return (
    <aside className="w-full lg:w-[310px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/90 bg-[#111114] flex flex-col min-h-0 lg:h-full">
      {/* Segmented Workspace Tab */}
      <div className="p-3 border-b border-zinc-800/80">
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {mode === 'collage' ? 'Template Grid' : 'Template Carousel'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Galeri Foto ({photos.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {activeTab === 'templates' ? (
          <>
            {mode === 'collage' ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-400">Filter Jumlah Foto</span>
                  <span className="text-xs font-mono tabular-nums text-zinc-500">
                    {filteredCollageTemplates.length} layout
                  </span>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: '2-photo', label: '2 Foto' },
                    { id: '3-photo', label: '3 Foto' },
                    { id: '4-photo', label: '4 Foto' },
                    { id: 'multi', label: '5–9 Foto' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        categoryFilter === cat.id
                          ? 'bg-[#F2B705]/15 text-[#F2B705] border border-[#F2B705]/40'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Collage Template Cards */}
                <div className="space-y-2 pt-1">
                  {filteredCollageTemplates.map((tpl) => {
                    const isActive = tpl.id === activeTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => onSelectTemplate(tpl.id)}
                        className={`group w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900/90 border-[#F2B705]/70'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <TemplateThumbnail slots={tpl.slots} active={isActive} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-100 truncate">
                              {tpl.name}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-zinc-500 shrink-0">
                              {tpl.photoCount} slot
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-400">Filter Jumlah Slide</span>
                  <span className="text-xs font-mono tabular-nums text-zinc-500">
                    {filteredCarouselTemplates.length} layout
                  </span>
                </div>

                {/* Slide Count Filter Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 2, label: '2 Slide' },
                    { id: 3, label: '3 Slide' },
                    { id: 4, label: '4 Slide' },
                    { id: '5+', label: '5–6 Slide' },
                  ].map((opt) => (
                    <button
                      key={String(opt.id)}
                      type="button"
                      onClick={() => setSlideFilter(opt.id as SlideFilter)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        slideFilter === opt.id
                          ? 'bg-[#F2B705]/15 text-[#F2B705] border border-[#F2B705]/40'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 pt-1">
                  {filteredCarouselTemplates.map((tpl) => {
                    const isActive = tpl.id === activeTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => onSelectTemplate(tpl.id)}
                        className={`group w-full text-left p-3 rounded-xl border transition-all space-y-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900/90 border-[#F2B705]/70'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <TemplateThumbnail
                          slots={tpl.slots}
                          slideCount={tpl.slideCount}
                          active={isActive}
                        />
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-100 truncate">
                              {tpl.name}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-zinc-500 shrink-0">
                              {tpl.slideCount} slide · {tpl.slots.length} foto
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          /* Photo Gallery & Upload Tab */
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {/* Drag & Drop Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDraggingOver
                  ? 'border-[#F2B705] bg-[#F2B705]/10'
                  : 'border-zinc-700 bg-zinc-950/60 hover:border-zinc-500'
              }`}
            >
              <Upload className="w-5 h-5 text-zinc-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-medium text-zinc-200">
                Upload Foto Anda
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Klik atau tarik beberapa JPG / PNG sekaligus
              </p>
            </div>

            {/* Quick Fill Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onAutoFill}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" aria-hidden="true" />
                <span>Isi Otomatis</span>
              </button>
              <button
                type="button"
                onClick={onShufflePhotos}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                <span>Acak Urutan</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {selectedSlotId
                ? 'Klik foto di bawah untuk mengisi frame yang dipilih, atau tarik langsung ke kanvas.'
                : 'Tarik foto ke frame kanvas, atau klik salah satu frame lebih dulu.'}
            </p>

            {/* Contact Sheet Photo Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/photo-id', photo.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAssignPhotoToSelected(photo.id)}
                  className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-[#F2B705]/70 transition-colors"
                >
                  <div className="aspect-[4/5] bg-zinc-900 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="px-2 py-1.5 flex items-center justify-between gap-1 bg-zinc-950/90 border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-300 truncate">
                      {photo.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePhoto(photo.id);
                      }}
                      title="Hapus foto dari galeri"
                      className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Upload Shortcut when on Templates Tab */}
      {activeTab === 'templates' && (
        <div className="p-3 border-t border-zinc-800/80 bg-[#0E0E11] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#F2B705]" aria-hidden="true" />
            <span>Pilih / Upload Foto ({photos.length})</span>
          </button>
        </div>
      )}
    </aside>
  );
};
