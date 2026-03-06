globalThis.simpleTrade = globalThis.simpleTrade || {};

class TradeApp extends Application {

  constructor(session) {
    super();
    this.session = session;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "trade-window",
      template: "modules/simple-token-trade/templates/trade-window.html",
      width: 900,
      height: 600,
      resizable: true
    });
  }

  getInventory(actor) {

    const allowed = [
      "weapon",
      "equipment",
      "consumable",
      "tool",
      "loot",
      "container",
      "backpack"
    ];

    return actor.items.filter(i => allowed.includes(i.type));
  }

  getData() {

    const s = this.session;

    return {
      actorA: s.actorA,
      actorB: s.actorB,

      itemsA: this.getInventory(s.actorA),
      itemsB: this.getInventory(s.actorB),

      offerA: s.offerA,
      offerB: s.offerB,

      goldA: s.goldA,
      goldB: s.goldB,

      acceptA: s.acceptA,
      acceptB: s.acceptB
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
      game.simpleTrade.sync(s);
      this.checkTrade();

    });

    html.find(".accept-b").click(() => {

      s.acceptB = true;
      game.simpleTrade.sync(s);
      this.checkTrade();

    });

    html.find(".cancel").click(() => this.close());

  }

  async addItem(itemId, side) {

    const s = this.session;

    const actor = side === "A" ? s.actorA : s.actorB;
    const item = actor.items.get(itemId);

    if (!item) return;

    const max = item.system.quantity ?? 1;

    const qty = await Dialog.prompt({

      title: "Quantity",
      content: `<input type="number" value="1" min="1" max="${max}">`,
      callback: html => Number(html.find("input").val())

    });

    if (!qty || qty <= 0) return;

    if (side === "A") s.offerA.push({ id: itemId, qty });
    else s.offerB.push({ id: itemId, qty });

    s.resetAccept();

    game.simpleTrade.sync(s);

    this.render();

  }

  async checkTrade() {

    const s = this.session;

    if (!(s.acceptA && s.acceptB)) return;

    await this.executeTrade();

    ui.notifications.info("Trade completed.");

    this.close();

  }

  async executeTrade() {

    const s = this.session;

    await this.transferItems(s.actorA, s.actorB, s.offerA);
    await this.transferItems(s.actorB, s.actorA, s.offerB);

    await this.transferGold(s);

  }

  async transferItems(fromActor, toActor, offers) {

    for (let o of offers) {

      const item = fromActor.items.get(o.id);
      if (!item) continue;

      const qty = o.qty;
      const current = item.system.quantity ?? 1;

      const itemData = item.toObject();
      itemData.system.quantity = qty;

      await toActor.createEmbeddedDocuments("Item", [itemData]);

      if (current > qty) {

        await item.update({
          "system.quantity": current - qty
        });

      } else {

        await item.delete();

      }

    }

  }

  async transferGold(session) {

    const a = session.actorA;
    const b = session.actorB;

    const goldA = session.goldA;
    const goldB = session.goldB;

    if (goldA) {

      await a.update({
        "system.currency.gp": a.system.currency.gp - goldA
      });

      await b.update({
        "system.currency.gp": b.system.currency.gp + goldA
      });

    }

    if (goldB) {

      await b.update({
        "system.currency.gp": b.system.currency.gp - goldB
      });

      await a.update({
        "system.currency.gp": a.system.currency.gp + goldB
      });

    }

  }

}

globalThis.simpleTrade.TradeApp = TradeApp;
