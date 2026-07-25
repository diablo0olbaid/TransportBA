import type { Theme } from '../../store/useTransitStore.js';

/**
 * Estilos base de CARTO (gratis, sin token). Dark-matter para tema oscuro,
 * Positron para claro (§3 / §9: el toggle de tema cambia el basemap).
 */
export const BASEMAP_STYLE: Record<Theme, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
