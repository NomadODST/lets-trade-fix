Hooks.once("init", () => {

  const hookName = "tidy5e-sheet.renderActorSheet";

  // Delay slightly so other modules register their hooks first
  setTimeout(() => {

    const hooks = Hooks._hooks?.[hookName];
    if (!hooks) return;

    Hooks._hooks[hookName] = hooks.filter(h => {
      try {
        const fn = h.fn?.toString?.() ?? "";
        return !fn.includes("renderInjectionHook") &&
               !fn.includes("lets") &&
               !fn.includes("trade");
      } catch {
        return true;
      }
    });

    console.log("Lets Trade Fix | Removed incompatible Lets Trade sheet hook.");

  }, 0);

});
