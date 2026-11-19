import {
  AspectRatioKey,
  AspectRatioSpec,
  CarouselTemplate,
  LayoutTemplate,
  PhotoAsset,
  TonePreset,
} from '../types/studio';

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioSpec> = {
  '4:5': {
    key: '4:5',
    label: '4:5 Portrait',
    sublabel: '1080 × 1350 · Optimal Feed IG',
    width: 1080,
    height: 1350,
    ratio: 4 / 5,
  },
  '1:1': {
    key: '1:1',
    label: '1:1 Square',
    sublabel: '1080 × 1080 · Klasik Grid IG',
    width: 1080,
    height: 1080,
    ratio: 1,
  },
  '3:4': {
    key: '3:4',
    label: '3:4 Editorial',
    sublabel: '1080 × 1440 · Rasio Kamera',
    width: 1080,
    height: 1440,
    ratio: 3 / 4,
  },
  '9:16': {
    key: '9:16',
    label: '9:16 Story',
    sublabel: '1080 × 1920 · IG Story / Cover',
    width: 1080,
    height: 1920,
    ratio: 9 / 16,
  },
};

export const PAPER_PRESETS = [
  { name: 'Gallery White', hex: '#FFFFFF' },
  { name: 'Archival Paper', hex: '#F5F2EB' },
  { name: 'Warm Stone', hex: '#E8E3D9' },
  { name: 'Darkroom Slate', hex: '#141417' },
  { name: 'Obsidian Black', hex: '#050505' },
];

export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'original',
    name: 'Original',
    cssFilter: 'none',
    description: 'Warna asli tanpa filter',
  },
  {
    id: 'kodak-warm',
    name: 'Gold 200',
    cssFilter: 'contrast(1.06) saturate(1.12) sepia(0.12) brightness(1.02)',
    description: 'Hangat keemasan ala film analog',
  },
  {
    id: 'portra-soft',
    name: 'Portra 400',
    cssFilter: 'contrast(0.96) saturate(0.95) brightness(1.04) sepia(0.06)',
    description: 'Highlight lembut & skin tone natural',
  },
  {
    id: 'ilford-bw',
    name: 'Ilford HP5',
    cssFilter: 'grayscale(1) contrast(1.14) brightness(1.02)',
    description: 'Monokrom klasik dengan gradasi halus',
  },
  {
    id: 'noir-contrast',
    name: 'Tri-X Noir',
    cssFilter: 'grayscale(1) contrast(1.38) brightness(0.95)',
    description: 'Hitam putih kontras tinggi dramatis',
  },
  {
    id: 'matte-editorial',
    name: 'Cinestill Matte',
    cssFilter: 'contrast(0.92) saturate(0.86) brightness(0.98)',
    description: 'Redup kalem gaya majalah seni',
  },
];

export const SAMPLE_PHOTOS: PhotoAsset[] = [
  {
    id: 'sample-arch',
    name: 'Brutalist Courtyard.jpg',
    url: '/src/assets/images/photo_editorial_arch_1795090293648.jpg',
    width: 1200,
    height: 1600,
    isSample: true,
  },
  {
    id: 'sample-street',
    name: 'Cafe du Coin 35mm.jpg',
    url: '/src/assets/images/photo_street_portrait_1795090292833.jpg',
    width: 1200,
    height: 1600,
    isSample: true,
  },
  {
    id: 'sample-coast',
    name: 'Atlantic Horizon.jpg',
    url: '/src/assets/images/photo_coastal_horizon_1795090291785.jpg',
    width: 1600,
    height: 1200,
    isSample: true,
  },
  {
    id: 'sample-still',
    name: 'Stoneware & Linen.jpg',
    url: '/src/assets/images/photo_still_life_1795090292114.jpg',
    width: 1400,
    height: 1400,
    isSample: true,
  },
  {
    id: 'sample-tokyo',
    name: 'Rainy Alley Tokyo.jpg',
    url: '/src/assets/images/photo_night_alley_1795090292400.jpg',
    width: 1200,
    height: 1600,
    isSample: true,
  },
];

export const COLLAGE_TEMPLATES: LayoutTemplate[] = [
  // 2 PHOTO
  {
    id: 'diptych-vertical',
    name: 'Diptych Vertikal',
    category: '2-photo',
    photoCount: 2,
    description: 'Dua kolom sejajar untuk narasi pasangan atau perbandingan.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 1 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'diptych-horizontal',
    name: 'Diptych Sinematik',
    category: '2-photo',
    photoCount: 2,
    description: 'Dua frame bertumpuk atas-bawah gaya wide cinema.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 0.5 },
      { id: 's2', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'editorial-inset',
    name: 'Editorial Inset',
    category: '2-photo',
    photoCount: 2,
    description: 'Satu foto utama penuh dengan satu foto detail mengambang.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 1, zIndex: 1 },
      { id: 's2', x: 0.56, y: 0.58, w: 0.38, h: 0.36, zIndex: 2, insetBorder: true },
    ],
  },

  // 3 PHOTO
  {
    id: 'triptych-columns',
    name: 'Triptych 3 Kolom',
    category: '3-photo',
    photoCount: 3,
    description: 'Tiga panel vertikal ritmis untuk street & fashion series.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1 / 3, h: 1 },
      { id: 's2', x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { id: 's3', x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  {
    id: 'hero-two-detail',
    name: 'Hero + 2 Detail',
    category: '3-photo',
    photoCount: 3,
    description: 'Satu potret utama di kiri, dua foto pendukung di kanan.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.6, h: 1 },
      { id: 's2', x: 0.6, y: 0, w: 0.4, h: 0.5 },
      { id: 's3', x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ],
  },
  {
    id: 'magazine-top-split',
    name: 'Editorial Header + 2',
    category: '3-photo',
    photoCount: 3,
    description: 'Establishing shot lebar di atas dan dua detail di bawah.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 0.55 },
      { id: 's2', x: 0, y: 0.55, w: 0.5, h: 0.45 },
      { id: 's3', x: 0.5, y: 0.55, w: 0.5, h: 0.45 },
    ],
  },
  {
    id: 'cinema-3-strip',
    name: '3 Strip Film',
    category: '3-photo',
    photoCount: 3,
    description: 'Tiga potongan sinematik berurutan seperti storyboard.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 1 / 3 },
      { id: 's2', x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { id: 's3', x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
  },

  // 4 PHOTO
  {
    id: 'grid-2x2',
    name: 'Grid 2×2 Galeri',
    category: '4-photo',
    photoCount: 4,
    description: 'Empat panel seimbang dengan proporsi klasik.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 's3', x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 's4', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'feature-plus-3',
    name: '1 Utama + 3 Strip',
    category: '4-photo',
    photoCount: 4,
    description: 'Satu foto dominan di atas dengan 3 urutan momen di bawah.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 0.65 },
      { id: 's2', x: 0, y: 0.65, w: 1 / 3, h: 0.35 },
      { id: 's3', x: 1 / 3, y: 0.65, w: 1 / 3, h: 0.35 },
      { id: 's4', x: 2 / 3, y: 0.65, w: 1 / 3, h: 0.35 },
    ],
  },
  {
    id: 'asymmetric-stagger',
    name: 'Editorial Stagger',
    category: '4-photo',
    photoCount: 4,
    description: 'Susunan asimetris dinamis ala majalah fotografi.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.6, h: 0.58 },
      { id: 's2', x: 0.6, y: 0, w: 0.4, h: 0.42 },
      { id: 's3', x: 0, y: 0.58, w: 0.4, h: 0.42 },
      { id: 's4', x: 0.4, y: 0.42, w: 0.6, h: 0.58 },
    ],
  },

  // MULTI (5, 6, 9)
  {
    id: 'gallery-5',
    name: 'Gallery Wall 5',
    category: 'multi',
    photoCount: 5,
    description: 'Dua foto besar di atas dan tiga frame di bawah.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 0.56 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 0.56 },
      { id: 's3', x: 0, y: 0.56, w: 1 / 3, h: 0.44 },
      { id: 's4', x: 1 / 3, y: 0.56, w: 1 / 3, h: 0.44 },
      { id: 's5', x: 2 / 3, y: 0.56, w: 1 / 3, h: 0.44 },
    ],
  },
  {
    id: 'contact-2x3',
    name: 'Contact Sheet 2×3',
    category: 'multi',
    photoCount: 6,
    description: 'Lembar kontak 6 frame untuk bercerita dalam satu unggahan.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 1 / 3 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
      { id: 's3', x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { id: 's4', x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { id: 's5', x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
      { id: 's6', x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
    ],
  },
  {
    id: 'mosaic-6',
    name: 'Mosaic 1+5 Story',
    category: 'multi',
    photoCount: 6,
    description: 'Satu pembuka besar plus lima frame pengiring.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 2 / 3, h: 2 / 3 },
      { id: 's2', x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { id: 's3', x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's4', x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's5', x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's6', x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
  },
  {
    id: 'contact-3x3',
    name: 'Contact Sheet 3×3',
    category: 'multi',
    photoCount: 9,
    description: 'Sembilan frame penuh gaya darkroom contact sheet.',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
      { id: 's2', x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { id: 's3', x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { id: 's4', x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's5', x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's6', x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's7', x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's8', x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { id: 's9', x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
  },
];

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  // 2 SLIDES
  {
    id: 'panoramic-2-split',
    name: 'Panorama Split 2 Slide',
    slideCount: 2,
    description: 'Satu foto panorama terbelah mulus di 2 slide + 1 foto inset.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.72, y: 0.58, w: 0.23, h: 0.34, zIndex: 2, insetBorder: true },
    ],
  },
  {
    id: 'diptych-bridge-2',
    name: 'Hero + Diptych Bridge',
    slideCount: 2,
    description: 'Foto utama melewati garis lipatan slide, disambung 2 detail di kanan.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.64, h: 1 },
      { id: 'c2', x: 0.64, y: 0, w: 0.36, h: 0.5 },
      { id: 'c3', x: 0.64, y: 0.5, w: 0.36, h: 0.5 },
    ],
  },
  {
    id: 'film-2-split-stack',
    name: 'Double Panorama Stack',
    slideCount: 2,
    description: 'Dua foto wide atas-bawah yang keduanya melintasi 2 slide sekaligus.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1, h: 0.5 },
      { id: 'c2', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'editorial-overlap-2',
    name: 'Seam Overlap Gallery',
    slideCount: 2,
    description: 'Dua panel utama dengan satu foto melayang tepat di lipatan tengah.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.5, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.5, y: 0, w: 0.5, h: 1, zIndex: 1 },
      { id: 'c3', x: 0.36, y: 0.2, w: 0.28, h: 0.6, zIndex: 2, insetBorder: true },
    ],
  },

  // 3 SLIDES
  {
    id: 'seamless-triptych-3',
    name: 'Seamless Spread 3 Slide',
    slideCount: 3,
    description: 'Foto lebar melintasi batas slide 1–2, diikuti diptych di slide 3.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.56, h: 1 },
      { id: 'c2', x: 0.56, y: 0, w: 0.24, h: 0.52 },
      { id: 'c3', x: 0.56, y: 0.52, w: 0.24, h: 0.48 },
      { id: 'c4', x: 0.8, y: 0, w: 0.2, h: 1 },
    ],
  },
  {
    id: 'panoramic-bridge-3',
    name: 'Full 3-Slide Panorama',
    slideCount: 3,
    description: 'Satu foto landscape utuh terbentang 3 slide swipe tanpa putus.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.04, y: 0.62, w: 0.18, h: 0.3, zIndex: 2, insetBorder: true },
      { id: 'c3', x: 0.78, y: 0.08, w: 0.18, h: 0.3, zIndex: 2, insetBorder: true },
    ],
  },
  {
    id: 'seam-overlap-3',
    name: 'Floating Seam Exhibition',
    slideCount: 3,
    description: 'Tiga panel dasar dengan dua foto melintasi tepat di garis batas slide.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1 / 3, h: 1, zIndex: 1 },
      { id: 'c2', x: 1 / 3, y: 0, w: 1 / 3, h: 1, zIndex: 1 },
      { id: 'c3', x: 2 / 3, y: 0, w: 1 / 3, h: 1, zIndex: 1 },
      { id: 'c4', x: 0.24, y: 0.54, w: 0.18, h: 0.38, zIndex: 2, insetBorder: true },
      { id: 'c5', x: 0.57, y: 0.08, w: 0.18, h: 0.38, zIndex: 2, insetBorder: true },
    ],
  },
  {
    id: 'story-arc-3',
    name: 'Cover + Panorama + Detail',
    slideCount: 3,
    description: 'Slide 1 potret penuh, diikuti panorama ke slide 2 dan 3 foto detail.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1 / 3, h: 1 },
      { id: 'c2', x: 1 / 3, y: 0, w: 0.44, h: 1 },
      { id: 'c3', x: 0.7733, y: 0, w: 0.2267, h: 1 / 3 },
      { id: 'c4', x: 0.7733, y: 1 / 3, w: 0.2267, h: 1 / 3 },
      { id: 'c5', x: 0.7733, y: 2 / 3, w: 0.2267, h: 1 / 3 },
    ],
  },
  {
    id: 'cinema-filmstrip-3',
    name: 'Cinema Top + 4 Strip',
    slideCount: 3,
    description: 'Panorama lebar di separuh atas 3 slide, 4 frame sekuens di bawah.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1, h: 0.58 },
      { id: 'c2', x: 0, y: 0.58, w: 0.25, h: 0.42 },
      { id: 'c3', x: 0.25, y: 0.58, w: 0.25, h: 0.42 },
      { id: 'c4', x: 0.5, y: 0.58, w: 0.25, h: 0.42 },
      { id: 'c5', x: 0.75, y: 0.58, w: 0.25, h: 0.42 },
    ],
  },

  // 4 SLIDES
  {
    id: 'magazine-ribbon-4',
    name: 'Editorial Ribbon 4 Slide',
    slideCount: 4,
    description: 'Tata letak majalah bersambung 4 slide: hero, panorama tengah, dan penutup.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.25, h: 1 },
      { id: 'c2', x: 0.25, y: 0.12, w: 0.42, h: 0.76 },
      { id: 'c3', x: 0.67, y: 0, w: 0.33, h: 0.5 },
      { id: 'c4', x: 0.67, y: 0.5, w: 0.165, h: 0.5 },
      { id: 'c5', x: 0.835, y: 0.5, w: 0.165, h: 0.5 },
    ],
  },
  {
    id: 'series-4-framed',
    name: 'Seri Galeri 4 Slide',
    slideCount: 4,
    description: 'Empat slide terpisah dengan bingkai konsisten untuk seri foto berurutan.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.25, h: 1 },
      { id: 'c2', x: 0.25, y: 0, w: 0.25, h: 1 },
      { id: 'c3', x: 0.5, y: 0, w: 0.25, h: 1 },
      { id: 'c4', x: 0.75, y: 0, w: 0.25, h: 1 },
    ],
  },
  {
    id: 'gallery-walk-4',
    name: 'Museum Wall Walk',
    slideCount: 4,
    description: 'Ritme pameran galeri 4 slide dengan foto melintasi lipatan dan mosaic akhir.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.36, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.36, y: 0, w: 0.39, h: 0.62, zIndex: 1 },
      { id: 'c3', x: 0.36, y: 0.62, w: 0.195, h: 0.38, zIndex: 1 },
      { id: 'c4', x: 0.555, y: 0.62, w: 0.195, h: 0.38, zIndex: 1 },
      { id: 'c5', x: 0.75, y: 0, w: 0.25, h: 1, zIndex: 1 },
      { id: 'c6', x: 0.19, y: 0.54, w: 0.13, h: 0.36, zIndex: 2, insetBorder: true },
    ],
  },
  {
    id: 'dual-panorama-4',
    name: 'Dual Panorama 2+2',
    slideCount: 4,
    description: 'Dua panorama terpisah (Slide 1–2 & Slide 3–4) dengan detail inset.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.5, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.5, y: 0, w: 0.5, h: 1, zIndex: 1 },
      { id: 'c3', x: 0.39, y: 0.6, w: 0.1, h: 0.32, zIndex: 2, insetBorder: true },
      { id: 'c4', x: 0.87, y: 0.1, w: 0.1, h: 0.32, zIndex: 2, insetBorder: true },
    ],
  },

  // 5 & 6 SLIDES
  {
    id: 'monograph-5',
    name: 'Editorial Monograph 5 Slide',
    slideCount: 5,
    description: 'Cover penuh, panorama tengah menyambung, dan mosaic penutup di slide 5.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.2, h: 1 },
      { id: 'c2', x: 0.2, y: 0, w: 0.34, h: 1 },
      { id: 'c3', x: 0.54, y: 0, w: 0.26, h: 0.54 },
      { id: 'c4', x: 0.54, y: 0.54, w: 0.26, h: 0.46 },
      { id: 'c5', x: 0.8, y: 0, w: 0.2, h: 0.5 },
      { id: 'c6', x: 0.8, y: 0.5, w: 0.1, h: 0.5 },
      { id: 'c7', x: 0.9, y: 0.5, w: 0.1, h: 0.5 },
    ],
  },
  {
    id: 'panoramic-5-showcase',
    name: 'Exhibition Center 5 Slide',
    slideCount: 5,
    description: 'Satu panorama besar membentang di Slide 2–4, diapit pembuka & penutup.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.2, h: 1, zIndex: 1 },
      { id: 'c2', x: 0.2, y: 0, w: 0.6, h: 1, zIndex: 1 },
      { id: 'c3', x: 0.8, y: 0, w: 0.2, h: 0.5, zIndex: 1 },
      { id: 'c4', x: 0.8, y: 0.5, w: 0.2, h: 0.5, zIndex: 1 },
      { id: 'c5', x: 0.15, y: 0.62, w: 0.11, h: 0.3, zIndex: 2, insetBorder: true },
    ],
  },
  {
    id: 'contact-carousel-5',
    name: 'Wedding / Docu 10 Foto',
    slideCount: 5,
    description: '10 foto tersusun rapi 2 frame per slide untuk cerita dokumenter lengkap.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 0.2, h: 0.5 },
      { id: 'c2', x: 0, y: 0.5, w: 0.2, h: 0.5 },
      { id: 'c3', x: 0.2, y: 0, w: 0.1, h: 1 },
      { id: 'c4', x: 0.3, y: 0, w: 0.1, h: 1 },
      { id: 'c5', x: 0.4, y: 0, w: 0.2, h: 0.62 },
      { id: 'c6', x: 0.4, y: 0.62, w: 0.2, h: 0.38 },
      { id: 'c7', x: 0.6, y: 0, w: 0.2, h: 0.38 },
      { id: 'c8', x: 0.6, y: 0.38, w: 0.2, h: 0.62 },
      { id: 'c9', x: 0.8, y: 0, w: 0.1, h: 1 },
      { id: 'c10', x: 0.9, y: 0, w: 0.1, h: 1 },
    ],
  },
  {
    id: 'grand-lookbook-6',
    name: 'Grand Lookbook 6 Slide',
    slideCount: 6,
    description: 'Format seri besar 6 slide dengan dua panorama panjang dan detail triptych.',
    slots: [
      { id: 'c1', x: 0, y: 0, w: 1 / 6, h: 1, zIndex: 1 },
      { id: 'c2', x: 1 / 6, y: 0, w: 2 / 6, h: 1, zIndex: 1 },
      { id: 'c3', x: 3 / 6, y: 0, w: 1 / 6, h: 1 / 3, zIndex: 1 },
      { id: 'c4', x: 3 / 6, y: 1 / 3, w: 1 / 6, h: 1 / 3, zIndex: 1 },
      { id: 'c5', x: 3 / 6, y: 2 / 3, w: 1 / 6, h: 1 / 3, zIndex: 1 },
      { id: 'c6', x: 4 / 6, y: 0, w: 2 / 6, h: 1, zIndex: 1 },
      { id: 'c7', x: 0.78, y: 0.58, w: 0.09, h: 0.32, zIndex: 2, insetBorder: true },
    ],
  },
];
