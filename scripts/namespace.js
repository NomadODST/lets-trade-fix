// Create global namespace immediately
globalThis.simpleTrade = globalThis.simpleTrade || {};

// Ensure game namespace exists as soon as possible
Hooks.once("init", () => {

  game.simpleTrade = globalThis.simpleTrade;

  if (!game.simpleTrade.sessions) {
    game.simpleTrade.sessions = {};
  }

  console.log("Simple Token Trade | Namespace ready");
});
