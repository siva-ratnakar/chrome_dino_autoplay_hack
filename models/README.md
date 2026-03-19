# Models Folder

This folder contains plug-and-play model examples for Dino Auto mode.

## Files

- `example-threshold-model.mjs`: ES module model you can load with the in-game file picker.
- `browser-plugin-template.js`: Global-script model that auto-registers via `window.registerDinoModel(...)`.

## Model Interface

A custom model must be one of:

- Function: `model(state) => decision`
- Object: `{ predict(state) => decision }`

`decision` can be:

- `"jump"` or `"none"`
- `true` / `false`
- `{ action: "jump" | "none", confidence?: number }`

The `state` payload includes:

- `state.dino`: current dino kinematics
- `state.obstacles`: upcoming obstacles sorted by distance
- `state.physics`: current speed and constants
- `state.world`: world dimensions
- `state.score` and `state.speedScale`

## Quick Start

1. Start the game.
2. Use the Mode dropdown and choose **Auto (Custom Model)**.
3. Pick `models/example-threshold-model.mjs` in the Model File picker.
4. The model is loaded and used immediately.
