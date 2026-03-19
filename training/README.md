# Training Models

This folder contains a tiny training pipeline that turns recorded gameplay data into a plug-and-play model.

## 1) Record Data

1. Run the game.
2. Click **Start Recording**.
3. Let the built-in **Auto (MPC Planner)** play for a while.
4. Click **Stop Recording**.
5. Click **Download Data**.

The game downloads NDJSON (`.jsonl`) with one labeled sample per frame.

## 2) Train a Model

From the project root:

```powershell
node training/train-logistic-model.mjs <path-to-data.jsonl> models/trained-logistic-model.mjs
```

This script:

- Trains a logistic regression policy on your labels
- Prints train metrics
- Generates a ready-to-load model module

## 3) Plug It Into The Game

1. In the game UI, select **Auto (Custom Model)**.
2. Use the **Model File** picker and choose `models/trained-logistic-model.mjs`.
3. The game switches to your model immediately.

## Notes

- The generated model is lightweight and fast enough to run each frame in-browser.
- You can replace this script with TensorFlow/PyTorch training and still output the same model interface.
