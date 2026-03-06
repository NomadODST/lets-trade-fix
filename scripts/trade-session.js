/**
 * simple-token-trade | trade-session.js
 * Manages the state of a single trade between two actors.
 */

export class TradeSession {
  /**
   * @param {string} actorAId  - UUID or ID of the initiating actor
   * @param {string} actorBId  - UUID or ID of the target actor
   * @param {string} [id]      - Optional: reuse existing session ID (from socket)
   */
  constructor(actorAId, actorBId, id = null) {
    this.id      = id ?? foundry.utils.randomID(16);
    this.actorAId = actorAId;
    this.actorBId = actorBId;

    // Trade offers: array of { itemId, quantity }
    this.offerA = [];
    this.offerB = [];

    // Gold amounts
    this.goldA = 0;
    this.goldB = 0;

    // Accept states
    this.acceptA = false;
    this.acceptB = false;

    // Register in global store
    globalThis.simpleTrade.sessions[this.id] = this;
  }

  /** Convenience getters */
  get actorA() { return game.actors.get(this.actorAId); }
  get actorB() { return game.actors.get(this.actorBId); }

  /** Reset both accept states (called on any offer change) */
  resetAccept() {
    this.acceptA = false;
    this.acceptB = false;
  }

  /** Serialize for socket transmission */
  toJSON() {
    return {
      id:       this.id,
      actorAId: this.actorAId,
      actorBId: this.actorBId,
      offerA:   this.offerA,
      offerB:   this.offerB,
      goldA:    this.goldA,
      goldB:    this.goldB,
      acceptA:  this.acceptA,
      acceptB:  this.acceptB,
    };
  }

  /** Update local state from serialized socket data */
  updateFromJSON(data) {
    this.offerA  = data.offerA  ?? this.offerA;
    this.offerB  = data.offerB  ?? this.offerB;
    this.goldA   = data.goldA   ?? this.goldA;
    this.goldB   = data.goldB   ?? this.goldB;
    this.acceptA = data.acceptA ?? this.acceptA;
    this.acceptB = data.acceptB ?? this.acceptB;
  }

  /** Destroy this session */
  destroy() {
    delete globalThis.simpleTrade.sessions[this.id];
  }
}
