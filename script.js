import { updateGround, setupGround } from "./ground.js"
import {
  updateDino,
  setupDino,
  getDinoRect,
  setDinoLose,
  requestJump,
  setManualJumpEnabled,
  getDinoState,
  DINO_GRAVITY,
  DINO_JUMP_SPEED,
} from "./dino.js"
import {
  updateCactus,
  setupCactus,
  getCactusRects,
  getCactusStates,
  CACTUS_SPEED,
} from "./cactus.js"

const WORLD_WIDTH = 100
const WORLD_HEIGHT = 30
const SPEED_SCALE_INCREASE = 0.00001
const GAME_MODE = {
  MANUAL: "manual",
  AUTO_PLANNER: "auto-planner",
  AUTO_MODEL: "auto-model",
}
const DEFAULT_MODE = GAME_MODE.AUTO_PLANNER
const AUTO_JUMP_TRIGGER_DISTANCE_PX = 115
const AUTO_JUMP_MIN_DISTANCE_PX = 8
const AUTO_JUMP_SPEED_BONUS_PX = 40

const worldElem = document.querySelector("[data-world]")
const scoreElem = document.querySelector("[data-score]")
const startScreenElem = document.querySelector("[data-start-screen]")
const modeSelectElem = document.querySelector("[data-mode-select]")
const modeIndicatorElem = document.querySelector("[data-mode-indicator]")
const modelFileElem = document.querySelector("[data-model-file]")
const modelStatusElem = document.querySelector("[data-model-status]")
const recordToggleElem = document.querySelector("[data-record-toggle]")
const downloadDataElem = document.querySelector("[data-download-data]")

let currentMode = DEFAULT_MODE
let loadedModel = null
let loadedModelName = ""
let lastModelError = ""

let isRecordingData = false
let trainingDataset = []

let isGameOver = false

setPixelToWorldScale()
window.addEventListener("resize", setPixelToWorldScale)
document.addEventListener("keydown", handleStart, { once: true })
document.addEventListener("keydown", handleGlobalKeybinds)
initializeControls()
registerModelApi()
setMode(DEFAULT_MODE)

let lastTime
let speedScale
let score

function update(time) {
  if (lastTime == null) {
    lastTime = time
    window.requestAnimationFrame(update)
    return
  }
  const delta = time - lastTime

  updateGround(delta, speedScale)
  updateDino(delta, speedScale)
  updateCactus(delta, speedScale)
  updateSpeedScale(delta)
  updateScore(delta)

  const gameState = buildGameState(delta)
  const controllerResult = resolveControllerAction(gameState)
  if (controllerResult.jump) {
    requestJump()
  }

  if (isRecordingData) {
    recordTrainingSample(gameState, controllerResult)
  }

  if (checkLose()) return handleLose()

  lastTime = time
  window.requestAnimationFrame(update)
}

function resolveControllerAction(gameState) {
  if (currentMode === GAME_MODE.MANUAL) {
    return {
      jump: false,
      source: "manual",
    }
  }

  if (currentMode === GAME_MODE.AUTO_MODEL) {
    const modelDecision = getModelDecision(gameState)
    if (modelDecision.jump != null) {
      return modelDecision
    }
  }

  return getPlannerDecision(gameState)
}

function getPlannerDecision(gameState) {
  const upcomingObstacles = gameState.obstacles.filter(obstacle => obstacle.distancePx >= 0)

  if (!gameState.dino.canJump || upcomingObstacles.length === 0) {
    return {
      jump: false,
      source: "planner",
      reason: "waiting",
    }
  }

  const nearest = upcomingObstacles[0]
  
  // Group cacti that are clustered together to calculate their total effective width.
  // This causes the dino to jump earlier when 2 or 3 cacti appear back-to-back.
  let effectiveWidth = nearest.widthPx
  let groupedCactiCount = 1
  for (let i = 1; i < upcomingObstacles.length; i++) {
    const next = upcomingObstacles[i]
    // If the next obstacle is very close to the current cluster, merge them.
    const gap = next.distancePx - (nearest.distancePx + effectiveWidth)
    if (gap < 45) {
      effectiveWidth = (next.distancePx + next.widthPx) - nearest.distancePx
      groupedCactiCount++
    } else {
      break
    }
  }

  // Adjust jump timing based on speed and how many cacti are grouped
  const speedBonus = Math.min(AUTO_JUMP_SPEED_BONUS_PX, Math.max(0, (gameState.speedScale - 1) * 20))
  
  // Base bonus is just the width, but we aggressively push the jump point backwards for clusters
  // to ensure peak height happens right in the middle of the cluster.
  const clusterPushback = groupedCactiCount > 1 ? (effectiveWidth * 0.9 + 25) : (effectiveWidth * 0.4)
  const jumpTriggerDistance = AUTO_JUMP_TRIGGER_DISTANCE_PX + speedBonus + clusterPushback

  if (nearest.distancePx > jumpTriggerDistance) {
    return {
      jump: false,
      source: "planner",
      reason: "far",
    }
  }

  if (nearest.distancePx <= AUTO_JUMP_MIN_DISTANCE_PX) {
    return {
      jump: true,
      source: "planner",
      reason: "emergency",
    }
  }

  return {
    jump: true,
    source: "planner",
    reason: "distance-threshold",
  }
}

function checkLose() {
  const dinoRect = getDinoRect()
  return getCactusRects().some(rect => isCollision(rect, dinoRect))
}

function isCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  )
}

function updateSpeedScale(delta) {
  speedScale += delta * SPEED_SCALE_INCREASE
}

function updateScore(delta) {
  score += delta * 0.01
  scoreElem.textContent = Math.floor(score)
}

function handleStart() {
  resetGameState()
  isGameOver = false
  setupGround()
  setupDino()
  setManualJumpEnabled(currentMode === GAME_MODE.MANUAL)
  setupCactus()
  startScreenElem.classList.add("hide")
  window.requestAnimationFrame(update)
}

function handleLose() {
  isGameOver = true
  setDinoLose()
  setTimeout(() => {
    document.addEventListener("keydown", handleStart, { once: true })
    startScreenElem.classList.remove("hide")
  }, 100)
}

function handleGlobalKeybinds(e) {
  if (e.code === "KeyR") {
    handleRestart()
    return
  }

  if (e.code === "KeyX") {
    const nextMode = currentMode === GAME_MODE.MANUAL ? GAME_MODE.AUTO_PLANNER : GAME_MODE.MANUAL
    setMode(nextMode)
    return
  }

  if (e.code === "KeyM") {
    const nextMode =
      currentMode === GAME_MODE.AUTO_MODEL ? GAME_MODE.AUTO_PLANNER : GAME_MODE.AUTO_MODEL
    setMode(nextMode)
  }
}

function handleRestart() {
  if (!isGameOver && lastTime == null) return
  resetGameState()
  isGameOver = false
  setupGround()
  setupDino()
  setManualJumpEnabled(currentMode === GAME_MODE.MANUAL)
  setupCactus()
  startScreenElem.classList.add("hide")
  window.requestAnimationFrame(update)
}

function resetGameState() {
  lastTime = null
  speedScale = 1
  score = 0
  scoreElem.textContent = "0"
  updateModeBadge()
}

function initializeControls() {
  if (modeSelectElem) {
    modeSelectElem.value = DEFAULT_MODE
    modeSelectElem.addEventListener("change", event => {
      setMode(event.target.value)
    })
  }

  if (modelFileElem) {
    modelFileElem.addEventListener("change", async event => {
      const [file] = event.target.files || []
      if (!file) return
      await loadModelFromFile(file)
    })
  }

  if (recordToggleElem) {
    recordToggleElem.addEventListener("click", () => {
      isRecordingData = !isRecordingData
      recordToggleElem.textContent = isRecordingData ? "Stop Recording" : "Start Recording"
    })
  }

  if (downloadDataElem) {
    downloadDataElem.addEventListener("click", downloadTrainingData)
    downloadDataElem.disabled = true
  }
}

function setMode(mode) {
  const normalizedMode = Object.values(GAME_MODE).includes(mode) ? mode : DEFAULT_MODE
  currentMode = normalizedMode
  setManualJumpEnabled(currentMode === GAME_MODE.MANUAL)

  if (modeSelectElem && modeSelectElem.value !== normalizedMode) {
    modeSelectElem.value = normalizedMode
  }

  if (normalizedMode === GAME_MODE.AUTO_MODEL && !loadedModel) {
    lastModelError = "No model loaded; using planner fallback."
  }

  updateModeBadge()
  updateModelStatusText()
}

function updateModeBadge() {
  if (currentMode === GAME_MODE.MANUAL) {
    scoreElem.style.color = "#b91c1c"
    modeIndicatorElem.textContent = "MODE: MANUAL"
    return
  }

  if (currentMode === GAME_MODE.AUTO_MODEL) {
    scoreElem.style.color = "#1e3a8a"
    modeIndicatorElem.textContent = loadedModel
      ? "MODE: AUTO (CUSTOM MODEL)"
      : "MODE: AUTO (CUSTOM MODEL, FALLBACK PLANNER)"
    return
  }

  scoreElem.style.color = "#166534"
  modeIndicatorElem.textContent = "MODE: AUTO (MPC)"
}

function updateModelStatusText() {
  if (!modelStatusElem) return

  if (loadedModel) {
    modelStatusElem.textContent = `Loaded model: ${loadedModelName}`
    return
  }

  if (lastModelError) {
    modelStatusElem.textContent = lastModelError
    return
  }

  modelStatusElem.textContent = "No custom model loaded. Using built-in planner."
}

async function loadModelFromFile(file) {
  try {
    const moduleUrl = URL.createObjectURL(file)
    const importedModule = await import(moduleUrl)
    URL.revokeObjectURL(moduleUrl)

    const modelCandidate =
      importedModule.default ?? importedModule.model ?? importedModule.createModel?.()

    if (!modelCandidate) {
      throw new Error("No model export found. Expected default export, model, or createModel().")
    }

    registerCustomModel(modelCandidate, file.name)
    setMode(GAME_MODE.AUTO_MODEL)
  } catch (error) {
    loadedModel = null
    loadedModelName = ""
    lastModelError = `Model load failed: ${error.message}`
    updateModeBadge()
    updateModelStatusText()
  }
}

function registerCustomModel(model, name = "custom-model") {
  const hasPredict = typeof model === "function" || typeof model.predict === "function"
  if (!hasPredict) {
    throw new Error("Model must be a function or expose a predict(state) method.")
  }

  loadedModel = model
  loadedModelName = name
  lastModelError = ""
  updateModeBadge()
  updateModelStatusText()
}

function registerModelApi() {
  window.registerDinoModel = (model, metadata = {}) => {
    const name = metadata.name || "window-registered-model"
    registerCustomModel(model, name)
    setMode(GAME_MODE.AUTO_MODEL)
  }
}

function getModelDecision(gameState) {
  if (!loadedModel) {
    return {
      jump: null,
      source: "model",
      reason: "missing-model",
    }
  }

  try {
    const prediction =
      typeof loadedModel === "function"
        ? loadedModel(gameState)
        : loadedModel.predict(gameState)

    const normalized = normalizeModelDecision(prediction)
    return {
      ...normalized,
      source: "model",
    }
  } catch (error) {
    lastModelError = `Model runtime error: ${error.message}`
    updateModelStatusText()
    return {
      jump: null,
      source: "model",
      reason: "model-error",
    }
  }
}

function normalizeModelDecision(prediction) {
  if (typeof prediction === "boolean") {
    return { jump: prediction, reason: "boolean" }
  }

  if (typeof prediction === "string") {
    const action = prediction.toLowerCase()
    return {
      jump: action === "jump",
      reason: "string",
    }
  }

  if (prediction && typeof prediction === "object") {
    const action = (prediction.action || prediction.decision || "none").toLowerCase()
    if (action === "jump" || action === "none") {
      return {
        jump: action === "jump",
        confidence: prediction.confidence,
        reason: "object",
      }
    }

    if (typeof prediction.jump === "boolean") {
      return {
        jump: prediction.jump,
        confidence: prediction.confidence,
        reason: "object-boolean",
      }
    }
  }

  return {
    jump: false,
    reason: "invalid",
  }
}

function buildGameState(deltaMs) {
  const worldRect = worldElem.getBoundingClientRect()
  const dinoRect = getDinoRect()
  const dinoPhysics = getDinoState()
  const obstacleSpeedPxPerMs = (speedScale * CACTUS_SPEED * worldRect.width) / 100
  const dinoBottomPx = (dinoPhysics.bottomPercent * worldRect.height) / 100

  const obstacles = getCactusStates()
    .map(obstacle => {
      const distancePx = obstacle.leftPx - dinoRect.right
      const timeToImpactMs = obstacleSpeedPxPerMs > 0 ? distancePx / obstacleSpeedPxPerMs : Infinity
      return {
        leftPx: obstacle.leftPx,
        rightPx: obstacle.rightPx,
        widthPx: obstacle.widthPx,
        heightPx: obstacle.heightPx,
        leftRelPx: obstacle.leftPx - worldRect.left,
        rightRelPx: obstacle.rightPx - worldRect.left,
        distancePx,
        timeToImpactMs,
      }
    })
    .filter(obstacle => obstacle.rightPx >= dinoRect.left - 5)
    .sort((a, b) => a.distancePx - b.distancePx)

  return {
    timestampMs: performance.now(),
    deltaMs,
    score,
    speedScale,
    world: {
      widthPx: worldRect.width,
      heightPx: worldRect.height,
    },
    dino: {
      leftPx: dinoRect.left,
      rightPx: dinoRect.right,
      widthPx: dinoRect.width,
      heightPx: dinoRect.height,
      leftRelPx: dinoRect.left - worldRect.left,
      rightRelPx: dinoRect.right - worldRect.left,
      bottomPx: dinoBottomPx,
      bottomPercent: dinoPhysics.bottomPercent,
      canJump: dinoPhysics.canJump,
      isJumping: dinoPhysics.isJumping,
      yVelocity: dinoPhysics.yVelocity,
      yVelocityPxPerMs: (dinoPhysics.yVelocity * worldRect.height) / 100,
    },
    obstacles,
    physics: {
      obstacleSpeedPxPerMs,
      dinoJumpSpeed: DINO_JUMP_SPEED,
      dinoGravity: DINO_GRAVITY,
    },
    mode: currentMode,
  }
}

function recordTrainingSample(gameState, controllerResult) {
  const nearest = gameState.obstacles[0]
  const sample = {
    t: Math.floor(gameState.timestampMs),
    mode: gameState.mode,
    speedScale: Number(gameState.speedScale.toFixed(6)),
    score: Number(gameState.score.toFixed(2)),
    dinoBottomPx: Number(gameState.dino.bottomPx.toFixed(2)),
    dinoVelocityPxPerMs: Number(gameState.dino.yVelocityPxPerMs.toFixed(4)),
    nearestDistancePx: nearest ? Number(nearest.distancePx.toFixed(2)) : null,
    nearestWidthPx: nearest ? Number(nearest.widthPx.toFixed(2)) : null,
    nearestHeightPx: nearest ? Number(nearest.heightPx.toFixed(2)) : null,
    nearestTimeToImpactMs: nearest ? Number(nearest.timeToImpactMs.toFixed(2)) : null,
    label: controllerResult.jump ? "jump" : "none",
    source: controllerResult.source,
    reason: controllerResult.reason,
  }

  trainingDataset.push(sample)
  if (downloadDataElem) {
    downloadDataElem.disabled = trainingDataset.length === 0
  }
}

function downloadTrainingData() {
  if (trainingDataset.length === 0) return

  const jsonl = trainingDataset.map(row => JSON.stringify(row)).join("\n")
  const blob = new Blob([jsonl], { type: "application/x-ndjson" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const ts = new Date().toISOString().replace(/[.:]/g, "-")
  anchor.href = url
  anchor.download = `dino_training_data_${ts}.jsonl`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function setPixelToWorldScale() {
  let worldToPixelScale
  if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
    worldToPixelScale = window.innerWidth / WORLD_WIDTH
  } else {
    worldToPixelScale = window.innerHeight / WORLD_HEIGHT
  }

  const worldWidth = `${WORLD_WIDTH * worldToPixelScale}px`
  const worldHeight = `${WORLD_HEIGHT * worldToPixelScale}px`

  worldElem.style.width = worldWidth
  worldElem.style.height = worldHeight
}
