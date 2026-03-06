/* ------------------------------------------------ */
/* GLOBAL NAMESPACE                                 */
/* ------------------------------------------------ */

globalThis.simpleTrade = globalThis.simpleTrade || {};

/* sofort verfügbar machen */
Hooks.once("init", () => {

  if (!game.simpleTrade) {
    game.simpleTrade = globalThis.simpleTrade;
  }

  if (!game.simpleTrade.sessions) {
    game.simpleTrade.sessions = {};
  }

  console.log("Simple Token Trade | Namespace ready");

});
