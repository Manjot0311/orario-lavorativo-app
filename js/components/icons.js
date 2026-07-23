/* ═══════════════════════════════════════════════════════════════
   js/components/icons.js — Icone SVG inline
   Modifica qui: cambia qualsiasi icona dell'app tutta in un posto
   ═══════════════════════════════════════════════════════════════ */

const Icons = {

  sun: (size = 13) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="2"    x2="12" y2="4"/>
      <line x1="12" y1="20"   x2="12" y2="22"/>
      <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2"  y1="12" x2="4"  y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>`,

  clock: (size = 13) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,

  download: (size = 15) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`,

  upload: (size = 15) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`,

  chevronLeft: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>`,

  chevronRight: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>`,

};

// Alias per compatibilità (usati nelle viste)
const svgSun      = () => Icons.sun();
const svgClock    = () => Icons.clock();
const svgDownload = () => Icons.download();
const svgUpload   = () => Icons.upload();