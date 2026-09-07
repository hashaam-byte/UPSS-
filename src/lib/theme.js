// /lib/theme.js
// Applies a school's chosen accent color as a CSS variable at runtime.
// This is the foundation for per-school branding — it does NOT retheme
// every existing hardcoded Tailwind gradient class across the app (that
// would mean touching hundreds of files). What it does do: expose
// `--brand-primary` (and RGB channels for opacity utilities) that new
// components can use, and that existing components can be migrated to
// over time via `var(--brand-primary)` in inline styles or a Tailwind
// arbitrary value like `bg-[var(--brand-primary)]`.

const DEFAULT_COLOR = '#10b981'; // emerald-500, matches the app's current default

function hexToRgb(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export function applyBrandColor(hex) {
  const color = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : DEFAULT_COLOR;
  const rgb = hexToRgb(color);

  document.documentElement.style.setProperty('--brand-primary', color);
  if (rgb) {
    document.documentElement.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
}

export { DEFAULT_COLOR };
