const { AddVoidView } = require("@newPath/managers/view-mng/view-mng-utils");
const { ViewActivator } = require("@newPath/managers/view-mng/view-activator");

describe("when use bad arguments", () => {
  it("must fail with no baseview", async () => {
    await expect(async () => new ViewActivator()).rejects.toThrow("ViewActivator: null argument baseView");
  });
});

describe("when patch", () => {
  const activate = jest.fn();
  const deactivate = jest.fn();
  it("must patch elements", async () => {
    const view = await AddVoidView(deactivate, activate, {
      viewMng: [],
    });

    const activator = new ViewActivator(view);
    expect(activator).toBeDefined();

    await view.activate();
    await view.deactivate();

    expect(activate).toHaveBeenCalledTimes(1);
    expect(deactivate).toHaveBeenCalledTimes(1);
  });
});
