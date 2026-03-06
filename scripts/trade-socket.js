Hooks.once("ready", () => {

  game.socket.on("module.simple-token-trade", data => {

    const session = game.simpleTrade.sessions[data.id];
    if (!session) return;

    Object.assign(session, data.state);

    session.app.render();

  });

  game.simpleTrade.sync = function(session) {

    game.socket.emit("module.simple-token-trade", {
      id: session.id,
      state: {
        offerA: session.offerA,
        offerB: session.offerB,
        goldA: session.goldA,
        goldB: session.goldB,
        acceptA: session.acceptA,
        acceptB: session.acceptB
      }
    });

  };

});
