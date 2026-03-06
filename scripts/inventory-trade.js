Hooks.once("ready", () => {

  Hooks.on("dnd5e.getItemContextOptions", (html, options) => {

    options.push({

      name: "Trade",
      icon: '<i class="fas fa-handshake"></i>',

      condition: li => {

        const item = game.items.get(li.data("item-id")) ||
          li.data("documentId");

        return game.user.character;

      },

      callback: async li => {

        const itemId = li.data("itemId");
        const actor = game.user.character;

        if (!actor) {
          ui.notifications.warn("You must have a character assigned.");
          return;
        }

        const players = game.users
          .filter(u => u.active && u.character && u.id !== game.user.id);

        if (!players.length) {
          ui.notifications.warn("No players available for trading.");
          return;
        }

        const buttons = {};

        for (let p of players) {

          buttons[p.id] = {

            label: p.name,

            callback: () => {

              const target = p.character;

              const session =
                new game.simpleTrade.TradeSession(actor, target);

              session.open();

              session.offerA.push({
                id: itemId,
                qty: 1
              });

            }

          };

        }

        new Dialog({

          title: "Trade with player",

          content: "<p>Select a player:</p>",

          buttons: buttons

        }).render(true);

      }

    });

  });

});
