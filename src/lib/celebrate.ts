import confetti from 'canvas-confetti'

/** Fire confetti from a point on screen (pixel coords). */
export function celebrate(point?: { x: number; y: number }) {
  const origin = point
    ? { x: point.x / window.innerWidth, y: point.y / window.innerHeight }
    : { x: 0.8, y: 0.3 }

  const shared = {
    origin,
    disableForReducedMotion: true,
    colors: ['#000000', '#6b6b6b', '#b0b0b0', '#dcdcdc'],
  }
  confetti({ ...shared, particleCount: 80, spread: 70, startVelocity: 35 })
  confetti({ ...shared, particleCount: 40, spread: 120, startVelocity: 25, scalar: 0.8 })
}
