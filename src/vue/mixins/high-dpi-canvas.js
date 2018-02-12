/**
 * Returns a canvas that takes the window pixel ratio into account.
 * This is very important on devices with ratios > 1 to get crisp drawings.
 * @param width: Width of the canvas.
 * @param height: Height of the canvas.
 * @returns {HTMLCanvasElement}
 */
export default function (width, height) {
  const scaleRatio = window.devicePixelRatio
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = width * scaleRatio
  canvas.height = height * scaleRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.setTransform(scaleRatio, 0, 0, scaleRatio, 0, 0)
  return canvas
}
