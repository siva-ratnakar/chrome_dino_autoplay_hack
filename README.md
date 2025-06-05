# Chrome Dino Game - Auto-Jump Edition

A modified version of the classic Chrome Dino game with auto-jump functionality and enhanced controls.

## 🎮 Features

- **Auto-Jump Mode**: The dino automatically jumps over obstacles (enabled by default)
- **Manual Mode**: Traditional gameplay where you control the jumps
- **Toggle Controls**: Switch between auto and manual modes during gameplay
- **Instant Restart**: Restart the game at any time
- **Visual Feedback**: Score color indicates current mode

## 🚀 How to Run the Game

### Prerequisites
- Python 3.x installed on your system
- A web browser (Chrome, Firefox, Safari, etc.)

### Setup Instructions

1. **Download/Clone the game files** to your local machine

2. **Open Command Prompt or PowerShell** and navigate to the game directory:
   ```powershell
   cd "path\to\chrome-dino-game-clone-main"
   ```

3. **Start a local HTTP server** (required for ES6 modules):
   ```powershell
   python -m http.server 8000
   ```

4. **Open your web browser** and go to:
   ```
   http://localhost:8000/index.html
   ```

5. **Start playing!** Press any key to begin the game.

## 🎯 How to Play

### Game Controls

| Key | Action | Description |
|-----|--------|-------------|
| **Any Key** | Start Game | Begin or restart after game over |
| **Spacebar** | Manual Jump | Jump over obstacles (only when auto-jump is OFF) |
| **X** | Toggle Auto-Jump | Switch between auto and manual modes |
| **R** | Restart Game | Instantly restart the game |

### Game Modes

#### 🟢 Auto-Jump Mode (Default)
- **Score Color**: Green
- **Behavior**: Dino automatically jumps over all obstacles
- **Outcome**: Game runs indefinitely - you never lose!
- **Use Case**: Perfect for watching the dino run automatically or testing high scores

#### 🔴 Manual Mode
- **Score Color**: Red  
- **Behavior**: You must manually jump over obstacles using spacebar
- **Outcome**: Traditional gameplay - hit an obstacle and you lose
- **Use Case**: Classic dino game experience with challenge

### Visual Indicators

- **Green Score**: Auto-jump is enabled
- **Red Score**: Auto-jump is disabled (manual mode)
- **Score Counter**: Displays current points in top-right corner

## 🎲 Gameplay Tips

1. **Start with Auto-Jump**: The game begins with auto-jump enabled - just press any key and watch!

2. **Test Manual Mode**: Press 'X' to disable auto-jump and try the traditional challenge

3. **Quick Restart**: Press 'R' anytime to instantly restart with auto-jump re-enabled

4. **Score Watching**: In auto-jump mode, see how high your score can get without intervention

5. **Mode Switching**: You can toggle between modes at any time during gameplay

## 🛠️ Technical Details

### File Structure
```
chrome-dino-game-clone-main/
├── index.html          # Main game page
├── script.js           # Main game logic and controls
├── dino.js            # Dino character controls
├── cactus.js          # Obstacle generation
├── ground.js          # Scrolling ground
├── styles.css         # Game styling
├── updateCustomProperty.js  # Utility functions
└── imgs/              # Game sprites
    ├── dino-stationary.png
    ├── dino-run-0.png
    ├── dino-run-1.png
    ├── dino-lose.png
    ├── cactus.png
    └── ground.png
```

### Auto-Jump Logic
- Detects obstacles within 180 pixels of the dino
- Automatically triggers jump when obstacle approaches
- Only jumps if dino is not already in the air
- Ensures successful clearance of all obstacles

## 🔧 Troubleshooting

### Blank Screen Issues
- **Cause**: ES6 modules require HTTP server (can't run from file://)
- **Solution**: Always use `python -m http.server 8000` and access via `http://localhost:8000`

### Game Not Responding
- **Check Console**: Press F12 and check browser console for errors
- **Restart Server**: Stop the Python server (Ctrl+C) and restart it
- **Clear Cache**: Refresh browser with Ctrl+F5

### Images Not Loading
- **Verify Path**: Ensure you're in the correct directory when starting the server
- **Check imgs/ Folder**: Confirm all PNG files are present in the imgs directory

## 🎮 Original Game Credit

Based on the classic Chrome Dino game (T-Rex Runner) that appears when Chrome is offline.

## 📝 Modifications Made

- Added auto-jump detection and triggering system
- Implemented toggle controls for switching modes  
- Added visual feedback with score color changes
- Added instant restart functionality
- Enhanced start screen with control instructions
- Improved collision detection for auto-jump timing

---

**Enjoy the game! 🦕**
