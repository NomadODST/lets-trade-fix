class TradeApp extends Application {

  constructor(session) {
    super();
    this.session = session;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "trade-window",
      template: "modules/simple-token-trade/templates/trade-window.html",
      width: 900,
      height: 600,
      resizable: true
    });
  }

  getData() {

    const s = this.session;

    return {
      a: s.actorA,
      b: s.actorB,
      itemsA: s.actorA.items.contents,
      itemsB: s.actorB.items.contents,
      goldA: s.goldA,
      goldB: s.goldB
    };

  }

  activateListeners(html) {

    const s = this.session;

    html.find(".item").click(ev => {

      const id = ev.currentTarget.dataset.id;
      const side = ev.currentTarget.dataset.side;

      this.addItem(id, side);

    });

    html.find(".gold-a").change(ev => {

      s.goldA = Number(ev.target.value);
      s.resetAccept();
      game.simpleTrade.sync(s);

    });

    html.find(".gold-b").change(ev => {

      s.goldB = Number(ev.target.value);
      s.resetAccept();
      game.simpleTrade.sync(s);

    });

    html.find(".accept-a").click(() => {

      s.acceptA = true;
      this.checkTrade();
      game.simpleTrade.sync(s);

    });

    html.find(".accept-b").click(() => {

      s.acceptB = true;
      this.checkTrade();
      game.simpleTrade.sync(s);

    });

    html.find(".cancel").click(() => this.close());

  }

  async addItem(itemId, side) {

    const s = this.session;

    let item;

    if (side === "A") item = s.actorA.items.get(itemId);
    if (side === "B") item = s.actorB.items.get(itemId);

    if (!item) return;

    const qty = await Dialog.prompt({
      title: "Quantity",
      content: `<input type="number" value="1" min="1" max="${item.system.quantity || 1}">`,
      callback: html => Number(html.find("input").val())
    });

    if (side === "A") s.offerA.push({ id: itemId, qty });
    if (side === "B") s.offerB.push({ id: itemId, qty });

    s.resetAccept();

    game.simpleTrade.sync(s);

    this.render();

  }

  async checkTrade() {

    const s = this.session;

    if (!(s.acceptA && s.acceptB)) return;

    ui.notifications.info("Trade completed.");

    this.close();

  }

}

game.simpleTrade.TradeApp = TradeApp;
