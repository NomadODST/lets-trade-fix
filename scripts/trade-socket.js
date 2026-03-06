Hooks.once("ready", () => {

  const ST = game.simpleTrade;

  game.socket.on("module.simple-token-trade", data => {

    const session = ST.sessions[data.id];
    if (!session) return;

    Object.assign(session, data.state);

    if (session.app) session.app.render();

  });

  ST.sync = function(session) {

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
