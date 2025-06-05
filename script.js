import { updateGround, setupGround } from "./ground.js"
import { updateDino, setupDino, getDinoRect, setDinoLose, triggerAutoJump } from "./dino.js"
import { updateCactus, setupCactus, getCactusRects } from "./cactus.js"

const WORLD_WIDTH = 100
const WORLD_HEIGHT = 30
const SPEED_SCALE_INCREASE = 0.00001

const worldElem = document.querySelector("[data-world]")
const scoreElem = document.querySelector("[data-score]")
const startScreenElem = document.querySelector("[data-start-screen]")

console.log("Script loaded successfully!")
console.log("World element:", worldElem)
console.log("Score element:", scoreElem)
console.log("Start screen element:", startScreenElem)

let autoJumpEnabled = true // Auto-jump is enabled by default

setPixelToWorldScale()
window.addEventListener("resize", setPixelToWorldScale)
document.addEventListener("keydown", handleStart, { once: true })
document.addEventListener("keydown", handleToggleAutoJump)

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
  if (autoJumpEnabled) {
    checkForAutoJump()
  } else {
    // Check for collision only when auto-jump is disabled
    if (checkLose()) return handleLose()
  }

  lastTime = time
  window.requestAnimationFrame(update)
}

function checkForAutoJump() {
  const dinoRect = getDinoRect()
  const cactusRects = getCactusRects()
  
  // Check if any cactus is approaching (within jump distance)
  const jumpDistance = 180 // Adjust this value to control when to jump
  
  for (let cactusRect of cactusRects) {
    const distanceFromDino = cactusRect.left - dinoRect.right
    
    // If cactus is approaching within jump distance, trigger auto jump
    if (distanceFromDino > 0 && distanceFromDino < jumpDistance) {
      triggerAutoJump()
      break // Only need to jump once
    }
  }
}

function handleToggleAutoJump(e) {
  if (e.code === "KeyX") {
    autoJumpEnabled = !autoJumpEnabled
    
    // Visual feedback - change the score color to indicate mode
    if (autoJumpEnabled) {
      scoreElem.style.color = "green"
      console.log("Auto-jump ENABLED")
    } else {
      scoreElem.style.color = "red"
      console.log("Auto-jump DISABLED")
    }
  } else if (e.code === "KeyR") {
    // Restart the game
    handleRestart()
  }
}

function handleRestart() {
  console.log("Restarting game...")
  
  // Reset game state
  lastTime = null
  speedScale = 1
  score = 0
  autoJumpEnabled = true // Reset to auto-jump enabled
  
  // Reset visual elements
  scoreElem.style.color = "green" // Show auto-jump is enabled
  scoreElem.textContent = "0"
  
  // Setup game components
  setupGround()
  setupDino()
  setupCactus()
  
  // Hide start screen and restart game loop
  startScreenElem.classList.add("hide")
  window.requestAnimationFrame(update)
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
  lastTime = null
  speedScale = 1
  score = 0
  autoJumpEnabled = true // Ensure auto-jump is enabled by default
  scoreElem.style.color = "green" // Set initial color
  setupGround()
  setupDino()
  setupCactus()
  startScreenElem.classList.add("hide")
  window.requestAnimationFrame(update)
}

function handleLose() {
  setDinoLose()
  setTimeout(() => {
    document.addEventListener("keydown", handleStart, { once: true })
    startScreenElem.classList.remove("hide")
  }, 100)
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
  
  console.log("Setting world dimensions:", worldWidth, "x", worldHeight)
  
  worldElem.style.width = worldWidth
  worldElem.style.height = worldHeight
}
