const noiseSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>"

const noiseDataUri = `data:image/svg+xml,${encodeURIComponent(noiseSvg)}`

/**
 * gradientCss: any valid CSS gradient (e.g. "linear-gradient(135deg, #2a1a3d, #0a0a0a)").
 * Layers a low-opacity noise texture on top so the color reads as grain, not a flat fill —
 * kept subtle on purpose so it never competes with the card's icon or text.
 */
export function grainyGradientStyle(gradientCss) {
  return {
    backgroundImage: `${gradientCss}, url("${noiseDataUri}")`,
    backgroundBlendMode: 'normal, overlay',
    backgroundSize: 'cover, 140px 140px',
  }
}