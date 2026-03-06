globalThis.simpleTrade = globalThis.simpleTrade || {};

Hooks.once("init", () => {

  game.simpleTrade = globalThis.simpleTrade;

  if (!game.simpleTrade.sessions) {
    game.simpleTrade.sessions = {};
  }

  console.log("Simple Token Trade | Namespace ready");

});
