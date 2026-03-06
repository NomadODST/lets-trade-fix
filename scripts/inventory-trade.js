/**
 * simple-token-trade | inventory-trade.js
 * Hooks into the character sheet item context menu to offer a "Trade" option.
 * Compatible with: dnd5e default sheet, Tidy5e Sheet (tidy5e-sheet),
 *                  Character Sheet Plus, and other dnd5e-based sheets.
 */

import { TradeSession } from "./trade-session.js";
import { TradeApp }     from "./trade-app.js";

// ─── Item ID resolution (multi-sheet compatible) ──────────────────────────────

/**
 * Extract an item ID from a context-menu list element.
 *
 * Different sheets store the item ID in different places:
 *   - dnd5e default:  data-item-id  (jQuery .data() or dataset)
 *   - Tidy5e v0.x:    data-item-id  (same, but wrapped in a deeper element)
 *   - Tidy5e v1.x+:   data-tidy-item-id  OR  closest [data-item-id]
 *   - fallback:       walk up the DOM looking for any known attribute
 *
 * @param {jQuery|HTMLElement} li
 * @returns {string|null}
 */
function _resolveItemId(li) {
  // Normalise: accept both jQuery objects and raw HTMLElements
  const el = li instanceof jQuery ? li[0] : li;

  // 1) Standard dnd5e attribute on the element itself
  if (el.dataset?.itemId)      return el.dataset.itemId;

  // 2) Tidy5e v1.x dedicated attribute
  if (el.dataset?.tidyItemId)  return el.dataset.tidyItemId;

  // 3) jQuery .data() cache (may differ from dataset after dynamic updates)
  if (li instanceof jQuery) {
    const jqId = li.data("item-id") ?? li.data("tidy-item-id");
    if (jqId) return String(jqId);
  }

  // 4) Walk up the DOM – Tidy5e sometimes puts the attribute on a parent row
  const ancestor = el.closest(
    "[data-item-id], [data-tidy-item-id], [data-entry-id]"
  );
  if (ancestor) {
    return (
      ancestor.dataset.itemId     ??
      ancestor.dataset.tidyItemId ??
      ancestor.dataset.entryId    ??
      null
    );
  }

  return null;
}

// ─── Context Menu Hook ───────────────────────────────────────────────────────

Hooks.on("getActorSheetItemContextOptions", (sheet, options) => {
  options.push({
    name: "Trade",
    icon: '<i class="fas fa-exchange-alt"></i>',
    condition: (li) => {
      const itemId = _resolveItemId(li);
      if (!itemId) return false;
      const item = sheet.actor?.items?.get(itemId);
      if (!item) return false;
      const TRADEABLE = new Set([
        "weapon","equipment","consumable","tool","loot","container","backpack"
      ]);
      return TRADEABLE.has(item.type) && sheet.actor.isOwner;
    },
    callback: (li) => {
      const itemId = _resolveItemId(li);
      if (!itemId) return;
      _openTradeDialog(sheet.actor, itemId);
    },
  });
});

// ─── Player / Actor Selection ─────────────────────────────────────────────────

async function _openTradeDialog(actorA, initialItemId = null) {
  const candidates = _buildCandidates(actorA);

  if (!candidates.length) {
    ui.notifications.warn("No other actors available to trade with.");
    return;
  }

  const optionsHTML = candidates
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join("");

  const content = `
    <form>
      <div class="form-group">
        <label>Trade with:</label>
        <div class="form-fields">
          <select name="actorId">${optionsHTML}</select>
        </div>
      </div>
    </form>`;

  let actorBId;
  try {
    actorBId = await Dialog.prompt({
      title:    "Start Trade",
      content,
      label:    "Open Trade",
      callback: (html) => html.find('[name="actorId"]').val(),
    });
  } catch {
    return;
  }

  if (!actorBId) return;
  const actorB = game.actors.get(actorBId);
  if (!actorB) return;

  const session = new TradeSession(actorA.id, actorB.id);
  const app     = new TradeApp(session, initialItemId);
  app.render(true);

  globalThis.simpleTrade.socket.sendTradeRequest(session, initialItemId);
}

// ─── Candidate Building ───────────────────────────────────────────────────────

function _buildCandidates(actorA) {
  const result = [];
  const seen   = new Set();

  for (const user of game.users) {
    if (user.id === game.user.id || !user.character) continue;
    if (user.character.id === actorA.id || seen.has(user.character.id)) continue;
    seen.add(user.character.id);
    result.push(user.character);
  }

  for (const tokenDoc of game.scenes?.active?.tokens ?? []) {
    const actor = tokenDoc.actor;
    if (!actor || actor.id === actorA.id || seen.has(actor.id)) continue;
    if (!["character", "npc"].includes(actor.type)) continue;
    seen.add(actor.id);
    result.push(actor);
  }

  return result;
}
