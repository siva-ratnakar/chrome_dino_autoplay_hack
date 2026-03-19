# Chrome Dino Rebuild + Advanced Autoplay

This project recreates Chrome Dino and now includes a high-performance autoplay stack with:

- Manual play
- Built-in advanced autopilot (default)
- Plug-and-play custom model support
- In-game training data recording and export
- Lightweight trainer that generates loadable model files

## What Is New

### 1) Advanced Default Autoplay (MPC-style planner)

The default auto mode uses receding-horizon planning:

- Simulates the dino jump arc with game physics
- Simulates obstacle motion with current speed scaling
- Evaluates safe jump windows over a lookahead horizon
- Jumps at the latest safe deadline for stable survival
- Has emergency/failsafe handling for close obstacles

This is significantly stronger than fixed-distance jump heuristics and is now the default mode.

### 2) User-Selectable Modes

- `Auto (MPC Planner)` (default)
- `Auto (Custom Model)`
- `Manual`

You can switch in the UI dropdown or by keyboard.

### 3) Plug-and-Play Model API

You can integrate your own model in two ways:

- Load an ES module file (`.mjs/.js`) with the Model File picker
- Register from a browser script via `window.registerDinoModel(model, { name })`

Accepted model shapes:

- Function: `model(state) => decision`
- Object: `{ predict(state) => decision }`

Accepted `decision` formats:

- `"jump"` or `"none"`
- `true` / `false`
- `{ action: "jump" | "none", confidence?: number }`

### 4) Training Data Pipeline

The game can record per-frame labeled data:

- `Start Recording` / `Stop Recording`
- `Download Data` outputs `.jsonl` (NDJSON)

You can train a model and re-import it directly.

## Run The Game

### Prerequisites

- Python 3.x (or any static web server)
- Modern browser

### Start

```powershell
cd "path\to\chrome_dino_autoplay_hack"
python -m http.server 8000
```

Open:

```text
http://localhost:8000/index.html
```

## Controls

| Key | Action |
|---|---|
| Any Key | Start game / restart after game over |
| Space | Jump (manual mode only) |
| X | Toggle `Manual` <-> `Auto (MPC Planner)` |
| M | Toggle `Auto (Custom Model)` <-> `Auto (MPC Planner)` |
| R | Restart immediately |

## Plug In A Model

### Option A: File picker (recommended)

1. Set mode to `Auto (Custom Model)`.
2. Pick a file like `models/example-threshold-model.mjs`.
3. Model is loaded and used immediately.

### Option B: Browser global registration

Call:

```js
window.registerDinoModel(myModel, { name: "my-model" })
```

See `models/browser-plugin-template.js` for a ready example.

## Train Your Own Model

1. Run the game in `Auto (MPC Planner)`.
2. Record data and download `.jsonl`.
3. Train a model:

```powershell
node training/train-logistic-model.mjs <path-to-data.jsonl> models/trained-logistic-model.mjs
```

4. Load `models/trained-logistic-model.mjs` using the Model File picker.

More detail: `training/README.md`.

## Project Layout

```text
chrome_dino_autoplay_hack/
├── index.html
├── script.js
├── dino.js
├── cactus.js
├── ground.js
├── styles.css
├── updateCustomProperty.js
├── models/
│   ├── README.md
│   ├── example-threshold-model.mjs
│   └── browser-plugin-template.js
├── training/
│   ├── README.md
│   └── train-logistic-model.mjs
└── imgs/
```

## Notes

- If no custom model is loaded in `Auto (Custom Model)`, the game falls back to the built-in planner.
- Because obstacles are random, no policy can mathematically guarantee infinite life, but the default planner is designed for very strong long-run performance.
