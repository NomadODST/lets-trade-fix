/**
 * simple-token-trade | trade-app.js
 * The main trade window UI.
 */

import { TradeSession } from "./trade-session.js";

const TRADEABLE_TYPES = new Set([
  "weapon", "equipment", "consumable", "tool",
  "loot", "container", "backpack"
]);

export class TradeApp extends Application {
  constructor(session, initialItemId = null) {
    super();
    this.session       = session;
    this.initialItemId = initialItemId;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:          "simple-token-trade",
      title:       "Trade",
      template:    "modules/simple-token-trade/templates/trade-window.html",
      width:       640,
      height:      560,
      resizable:   true,
      classes:     ["simple-token-trade"],
      dragDrop:    [{ dropSelector: ".trade-offer-drop" }],
    });
  }

  // ─── Data ─────────────────────────────────────────────────────────────────

  _mySide() {
    const myActors = new Set(
      game.actors.filter(a => a.isOwner).map(a => a.id)
    );
    if (myActors.has(this.session.actorAId)) return "A";
    if (myActors.has(this.session.actorBId)) return "B";
    return null;
  }

  _getInventory(actor) {
    if (!actor) return [];
    return actor.items
      .filter(i => TRADEABLE_TYPES.has(i.type))
      .map(i => ({
        id:       i.id,
        name:     i.name,
        img:      i.img,
        quantity: i.system?.quantity ?? 1,
        price:    i.system?.price?.value ?? i.system?.price ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  _resolveOffer(actor, offer) {
    if (!actor) return [];
    return offer.flatMap(({ itemId, quantity }) => {
      const item = actor.items.get(itemId);
      if (!item) return [];
      return [{ id: item.id, name: item.name, img: item.img, quantity }];
    });
  }

  getData() {
    const { actorA, actorB, offerA, offerB, goldA, goldB, acceptA, acceptB } = this.session;
    const side = this._mySide();

    return {
      actorA,
      actorB,
      inventoryA:   this._getInventory(actorA),
      inventoryB:   this._getInventory(actorB),
      offerA:       this._resolveOffer(actorA, offerA),
      offerB:       this._resolveOffer(actorB, offerB),
      goldA,
      goldB,
      acceptA,
      acceptB,
      side,
      isA:          side === "A",
      isB:          side === "B",
      bothAccepted: acceptA && acceptB,
      canExecute:   acceptA && acceptB && (side === "A"),
    };
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  async _render(force, options) {
    await super._render(force, options);
    if (this.initialItemId) {
      const id = this.initialItemId;
      this.initialItemId = null;
      this._addItem(id);
    }
  }

  // ─── Listeners ────────────────────────────────────────────────────────────

  activateListeners(html) {
    super.activateListeners(html);
    const side = this._mySide();

    html.find(".inv-item[data-item-id]").on("click", ev => {
      this._addItem(ev.currentTarget.dataset.itemId);
    });

    html.find(".offer-item .remove-btn").on("click", ev => {
      this._removeItem(ev.currentTarget.closest("[data-item-id]").dataset.itemId);
    });

    html.find(".offer-item .qty-input").on("change", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this._setItemQty(itemId, Math.max(1, parseInt(ev.currentTarget.value) || 1));
    });

    const goldSelector = side === "A" ? "#goldA" : "#goldB";
    html.find(goldSelector).on("change", ev => {
      this._setGold(Math.max(0, parseInt(ev.currentTarget.value) || 0));
    });

    html.find(".accept-btn").on("click", () => this._toggleAccept());
    html.find(".execute-btn").on("click", () => this._executeTrade());
    html.find(".cancel-btn").on("click", () => this._cancelTrade());
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data?.type !== "Item") return;

    let item;
    try { item = await fromUuid(data.uuid); } catch { return; }
    if (!item || !TRADEABLE_TYPES.has(item.type)) return;

    const actor = item.parent;
    const side  = this._mySide();
    const myActorId = side === "A" ? this.session.actorAId : this.session.actorBId;
    if (!actor || actor.id !== myActorId) return;

    this._addItem(item.id);
  }

  // ─── State Mutations ──────────────────────────────────────────────────────

  _myOffer() {
    return this._mySide() === "A" ? this.session.offerA : this.session.offerB;
  }

  _myActor() {
    return this._mySide() === "A" ? this.session.actorA : this.session.actorB;
  }

  _addItem(itemId) {
    const side = this._mySide();
    if (!side) return;

    const actor = this._myActor();
    if (!actor) return;

    const item = actor.items.get(itemId);
    if (!item || !TRADEABLE_TYPES.has(item.type)) return;

    const offer    = this._myOffer();
    const existing = offer.find(e => e.itemId === itemId);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + 1, item.system?.quantity ?? 1);
    } else {
      offer.push({ itemId, quantity: 1 });
    }

    this.session.resetAccept();
    this._syncAndRender();
  }

  _removeItem(itemId) {
    if (!this._mySide()) return;
    const offer = this._myOffer();
    const idx   = offer.findIndex(e => e.itemId === itemId);
    if (idx !== -1) offer.splice(idx, 1);
    this.session.resetAccept();
    this._syncAndRender();
  }

  _setItemQty(itemId, quantity) {
    if (!this._mySide()) return;
    const actor  = this._myActor();
    const maxQty = actor?.items.get(itemId)?.system?.quantity ?? 1;
    const entry  = this._myOffer().find(e => e.itemId === itemId);
    if (entry) entry.quantity = Math.min(Math.max(1, quantity), maxQty);
    this.session.resetAccept();
    this._syncAndRender();
  }

  _setGold(amount) {
    const side = this._mySide();
    if (!side) return;
    const maxGp  = this._myActor()?.system?.currency?.gp ?? 0;
    const capped = Math.min(amount, maxGp);
    if (side === "A") this.session.goldA = capped;
    else              this.session.goldB = capped;
    this.session.resetAccept();
    this._syncAndRender();
  }

  _toggleAccept() {
    const side = this._mySide();
    if (!side) return;
    if (side === "A") this.session.acceptA = !this.session.acceptA;
    else              this.session.acceptB = !this.session.acceptB;
    globalThis.simpleTrade.socket.sendAcceptUpdate(this.session);
    this.render(false);
  }

  _syncAndRender() {
    globalThis.simpleTrade.socket.sendTradeUpdate(this.session);
    this.render(false);
  }

  // ─── Trade Execution ──────────────────────────────────────────────────────

  async _executeTrade() {
    const { session } = this;
    if (!session.acceptA || !session.acceptB) return;

    const actorA = session.actorA;
    const actorB = session.actorB;
    if (!actorA || !actorB) {
      ui.notifications.error("One or both actors not found.");
      return;
    }

    try {
      await this._transferItems(actorA, actorB, session.offerA);
      await this._transferItems(actorB, actorA, session.offerB);
      await this._transferGold(actorA, actorB, session.goldA, session.goldB);
      await this._postTradeMessage(actorA, actorB, session);
    } catch (err) {
      ui.notifications.error("Trade failed: " + err.message);
      console.error("simple-token-trade | Trade error:", err);
      return;
    }

    globalThis.simpleTrade.socket.sendTradeExecuted(session.id);
    session.destroy();
    this.close({ noSocket: true });
  }

  async _transferItems(from, to, offer) {
    for (const { itemId, quantity } of offer) {
      const item     = from.items.get(itemId);
      if (!item) continue;
      const totalQty = item.system?.quantity ?? 1;

      if (quantity >= totalQty) {
        await to.createEmbeddedDocuments("Item", [this._itemCreateData(item, quantity)]);
        await from.deleteEmbeddedDocuments("Item", [itemId]);
      } else {
        const existing = to.items.find(i => i.name === item.name && i.type === item.type);
        if (existing) {
          await existing.update({ "system.quantity": (existing.system?.quantity ?? 0) + quantity });
        } else {
          await to.createEmbeddedDocuments("Item", [this._itemCreateData(item, quantity)]);
        }
        await item.update({ "system.quantity": totalQty - quantity });
      }
    }
  }

  _itemCreateData(item, quantity) {
    const data = item.toObject();
    data.system.quantity = quantity;
    return data;
  }

  async _transferGold(actorA, actorB, goldA, goldB) {
    const gpA = actorA.system?.currency?.gp ?? 0;
    const gpB = actorB.system?.currency?.gp ?? 0;
    await actorA.update({ "system.currency.gp": gpA - goldA + goldB });
    await actorB.update({ "system.currency.gp": gpB - goldB + goldA });
  }

  async _postTradeMessage(actorA, actorB, session) {
    const { offerA, offerB, goldA, goldB } = session;

    const formatOffer = (actor, offer, gold) => {
      const lines = offer.flatMap(({ itemId, quantity }) => {
        const item = actor.items.get(itemId);
        return item ? [`<li>${item.name} ×${quantity}</li>`] : [];
      });
      if (gold > 0) lines.push(`<li>${gold} gp</li>`);
      return lines.length ? `<ul>${lines.join("")}</ul>` : "<em>(nothing)</em>";
    };

    const content = `
      <div class="simple-token-trade-chat">
        <h3>⚖️ Trade Completed</h3>
        <div class="trade-summary">
          <div class="trade-side">
            <strong>${actorA.name}</strong> traded to <strong>${actorB.name}</strong>:
            ${formatOffer(actorA, offerA, goldA)}
          </div>
          <div class="trade-side">
            <strong>${actorB.name}</strong> traded to <strong>${actorA.name}</strong>:
            ${formatOffer(actorB, offerB, goldB)}
          </div>
        </div>
      </div>`;

    await ChatMessage.create({ content, type: CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0 });
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  _cancelTrade() {
    globalThis.simpleTrade.socket.sendTradeCancel(this.session.id);
    this.session.destroy();
    this.close({ noSocket: true });
  }

  async close(options = {}) {
    if (!options.noSocket) {
      globalThis.simpleTrade.socket?.sendTradeCancel(this.session?.id);
      this.session?.destroy();
    }
    return super.close(options);
  }
}
