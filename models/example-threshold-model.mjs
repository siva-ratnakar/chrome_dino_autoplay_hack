// Simple baseline plug-in model.
// Export a function or object with predict(state).

export default function predict(state) {
  const nearest = state.obstacles[0]
  if (!nearest || !state.dino.canJump) {
    return { action: "none", confidence: 1 }
  }

  // Dynamic threshold based on speed and obstacle width.
  const speedFactor = Math.max(1, state.physics.obstacleSpeedPxPerMs * 0.8)
  const dynamicThreshold = 34 + nearest.widthPx * 0.55 + speedFactor * 14

  if (nearest.distancePx <= dynamicThreshold) {
    return { action: "jump", confidence: 0.86 }
  }

  return { action: "none", confidence: 0.88 }
}
