class TradeSession {

  constructor(actorA, actorB) {

    this.id = randomID();

    this.actorA = actorA;
    this.actorB = actorB;

    this.offerA = [];
    this.offerB = [];

    this.goldA = 0;
    this.goldB = 0;

    this.acceptA = false;
    this.acceptB = false;

  }

  open() {

    this.app = new game.simpleTrade.TradeApp(this);
    this.app.render(true);

    game.simpleTrade.sessions[this.id] = this;

  }

  resetAccept() {

    this.acceptA = false;
    this.acceptB = false;

  }

}

game.simpleTrade.TradeSession = TradeSession;
