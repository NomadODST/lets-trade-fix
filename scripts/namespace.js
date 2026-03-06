/* ----------------------------------------- */
/* GLOBAL NAMESPACE                          */
/* ----------------------------------------- */

globalThis.simpleTrade = globalThis.simpleTrade || {};

/* Foundry lädt Scripts bevor Hooks laufen,
   deshalb Namespace sofort registrieren */
if (!globalThis.game) globalThis.game = {};

game.simpleTrade = globalThis.simpleTrade;

/* Session Container */
game.simpleTrade.sessions = game.simpleTrade.sessions || {};

console.log("Simple Token Trade | Namespace initialized");
