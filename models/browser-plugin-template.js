// This file can be included with a regular <script> tag in index.html.
// It registers a model through the global API exposed by script.js.

(function registerTemplateModel() {
  const model = {
    predict(state) {
      const nearest = state.obstacles[0]
      if (!nearest || !state.dino.canJump) {
        return "none"
      }

      const jumpDistance = 52 + nearest.widthPx * 0.45
      return nearest.distancePx <= jumpDistance ? "jump" : "none"
    },
  }

  if (typeof window.registerDinoModel === "function") {
    window.registerDinoModel(model, { name: "browser-template-model" })
  }
})()
