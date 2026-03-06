Hooks.once("ready", () => {

  Hooks.on("getActorSheetItemContextOptions", (app, options) => {

    options.push({

      name: "Trade",
      icon: '<i class="fas fa-handshake"></i>',

      condition: () => {

        return game.user.character != null;

      },

      callback: async (li) => {

        const actor = game.user.character;

        if (!actor) {

          ui.notifications.warn("You must have a character assigned to trade.");
          return;

        }

        const itemId = li.data("item-id");

        const item = actor.items.get(itemId);

        if (!item) return;

        const players = game.users.filter(u =>
          u.active &&
          u.character &&
          u.id !== game.user.id
        );

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
                id: item.id,
                qty: 1
              });

              if (session.app) session.app.render();

            }

          };

        }

        new Dialog({

          title: "Trade with Player",
          content: "<p>Select a player to trade with:</p>",
          buttons: buttons

        }).render(true);

      }

    });

  });

});
