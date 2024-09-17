const { AddVoidView, IgnoreIfViewAnnotation } = require("@newPath/managers/view-mng/view-mng-utils");
const { ViewMng } = require("@newPath/managers/view-mng/view-mng");

let activate;
let deactivate;
/** @type {ViewMng} */
let viewMng;

describe("ViewMng instance", () => {
  it("must be defined", () => {
    const warn = jest.spyOn(console, "warn");
    expect(ViewMng.instance).toBeDefined();
    expect(ViewMng.instance).toBeDefined();
    expect(warn).toBeCalledTimes(1);
  });
});

beforeEach(() => {
  activate = jest.fn();
  deactivate = jest.fn();
  viewMng = new ViewMng();
});

it("must fail with bad type", async () => {
  await expect(viewMng.push({})).rejects.toThrow("ViewMng.push: Invalid view type");
});

it("must get default values", () => {
  expect(viewMng.player).toBeUndefined();
  expect(viewMng.isPlayerActive()).toBeFalsy();
  expect(viewMng.isPlayerOrigin()).toBeFalsy();
  expect(viewMng.isViewHome()).toBeFalsy();
});

it("must get default values", async () => {
  const setupView = (v) => {
    v.destroy = jest.fn();
    v.type = "slider";
    return v;
  };

  await AddVoidView(activate, deactivate, { viewMng, setupView });
  expect(viewMng.isViewHome()).toBeTruthy();
});

describe("when push", () => {
  it("must add a view", async () => {
    const pushListener = jest.fn();
    viewMng.on("push", pushListener);
    const view = await AddVoidView(deactivate, activate, { viewMng });

    expect(viewMng.lastView).toBe(view);
    expect(activate).toHaveBeenCalled();
    expect(deactivate).not.toHaveBeenCalled();
    expect(pushListener).toHaveBeenCalled();
    expect(viewMng.activeWrap).toBeDefined();
    expect(viewMng.hasViews()).toBeTruthy();
    expect(viewMng.getView(0)).toEqual(view);
    expect(viewMng.getWrap(0)).toBeDefined();
    expect(viewMng.isTypeLast("void")).toBeTruthy();

    // getViewBy
    expect(viewMng.getViewBy("")).toBeUndefined();
    expect(viewMng.getViewBy("unk")).toBeUndefined();
    expect(viewMng.getViewBy()).toBeUndefined();
    expect(viewMng.getViewBy("void")).toEqual(view);
  });

  it("must stack views", async () => {
    const activateView1 = jest.fn();
    const deactivateView1 = jest.fn();
    const view1 = await AddVoidView(deactivateView1, activateView1, { viewMng });

    const activateView2 = jest.fn();
    const deactivateView2 = jest.fn();
    const view2 = await AddVoidView(deactivateView2, activateView2, {
      viewMng,
      setupView: (v) => {
        v.type = "home";
        return v;
      },
    });

    expect(activateView1).toHaveBeenCalled();
    expect(deactivateView1).toHaveBeenCalled();
    expect(activateView2).toHaveBeenCalled();
    expect(deactivateView2).not.toHaveBeenCalled();
    expect(viewMng.lastView).toBe(view2);
    expect(viewMng).toHaveLength(2);
    expect(viewMng.views).toStrictEqual([view1, view2]);
    expect(viewMng.viewType("home")).toStrictEqual(view2);
    expect(viewMng.viewsType("void")).toStrictEqual([view1]);
  });

  it("must stack views with a modal one", async () => {
    const activateView1 = jest.fn();
    const deactivateView1 = jest.fn();
    const view1 = await AddVoidView(deactivateView1, activateView1, { viewMng });

    const activateView2 = jest.fn();
    const deactivateView2 = jest.fn();
    const view2 = await AddVoidView(deactivateView2, activateView2, {
      viewMng,
      setupView: (thisView) => {
        jest.spyOn(thisView, "isModal", "get").mockReturnValue(true);
        return thisView;
      },
    });

    expect(activateView1).toHaveBeenCalled();
    expect(deactivateView1).not.toHaveBeenCalled();
    expect(activateView2).toHaveBeenCalled();
    expect(deactivateView2).not.toHaveBeenCalled();
    expect(viewMng.lastView).toBe(view2);
    expect(viewMng).toHaveLength(2);
    expect(viewMng.views).toStrictEqual([view1, view2]);
  });

  it("must get active view", async () => {
    const view1 = await AddVoidView(undefined, undefined, { viewMng });
    jest.spyOn(view1, "isActive", "get").mockReturnValue(true);
    const view2 = await AddVoidView(undefined, undefined, { viewMng });
    jest.spyOn(view2, "isActive", "get").mockReturnValue(false);

    expect(viewMng).toHaveLength(2);
    expect(viewMng.active).toBe(view1);
    expect(viewMng.lastView).toBe(view2);
    expect(viewMng.isTypeActive("void")).toBeTruthy();
  });

  it("must return null for active cause nothing is active", async () => {
    const view1 = await AddVoidView(undefined, undefined, { viewMng });
    jest.spyOn(view1, "isActive", "get").mockReturnValue(false);
    const view2 = await AddVoidView(undefined, undefined, { viewMng });
    jest.spyOn(view2, "isActive", "get").mockReturnValue(false);

    expect(viewMng).toHaveLength(2);
    expect(viewMng.active).toBeUndefined();
    expect(viewMng.lastView).toBe(view2);
    expect(viewMng).toHaveLength(2);
  });

  it("must use uniqueness", async () => {
    const setupView = (v) => {
      jest.spyOn(v, "isUnique", "get").mockReturnValue(true);
      return v;
    };
    await AddVoidView(undefined, undefined, { viewMng, setupView });
    await AddVoidView(undefined, undefined, { viewMng, setupView });
    await AddVoidView(undefined, undefined, { viewMng, setupView });

    expect(viewMng).toHaveLength(1);
  });
});

describe("when pop / close", () => {
  it("must pop", async () => {
    const popListener = jest.fn();
    viewMng.on("pop", popListener);
    const activateView1 = jest.fn();
    const deactivateView1 = jest.fn();
    const activateView2 = jest.fn();
    const deactivateView2 = jest.fn();
    await AddVoidView(deactivateView1, activateView1, { viewMng });
    const view2 = await AddVoidView(deactivateView2, activateView2, { viewMng });
    const destroyView2 = jest.spyOn(view2, "destroy");

    const poppedView = await viewMng.pop();

    expect(activateView1).toHaveBeenCalledTimes(2);
    expect(deactivateView1).toHaveBeenCalledTimes(1);
    expect(activateView2).toHaveBeenCalledTimes(1);
    expect(deactivateView2).toHaveBeenCalledTimes(1);
    expect(poppedView).toBe(view2);
    expect(destroyView2).toHaveBeenCalled();
    expect(popListener).toHaveBeenCalled();
  });

  it("must pop modal", async () => {
    const activateView = jest.fn();
    const deactivateView = jest.fn();
    await AddVoidView(deactivateView, activateView, { viewMng });
    const activatePopup = jest.fn();
    const deactivatePopup = jest.fn();
    const popupView = await AddVoidView(deactivatePopup, activatePopup, {
      viewMng,
      setupView: (v) => {
        jest.spyOn(v, "isModal", "get").mockReturnValue(true);
        return v;
      },
    });
    const destroyPopupView = jest.spyOn(popupView, "destroy");

    const poppedView = await viewMng.pop();

    expect(activateView).toHaveBeenCalledTimes(1);
    expect(deactivateView).toHaveBeenCalledTimes(0);
    expect(activatePopup).toHaveBeenCalledTimes(1);
    expect(deactivatePopup).toHaveBeenCalledTimes(1);
    expect(poppedView).toBe(popupView);
    expect(destroyPopupView).toHaveBeenCalled();
  });

  it("must warn if stack is empty", async () => {
    const warn = jest.spyOn(console, "warn");

    expect(await viewMng.pop()).toBeNull();
    expect(warn).toBeCalledWith("viewMng.pop: Empty stack");
  });

  it("must warn if closing a null view", async () => {
    const warn = jest.spyOn(console, "warn");

    const response = await viewMng.close();

    expect(response).toBeNull();
    expect(warn).toBeCalledWith("viewMng.close: Empty stack");
  });

  it("must close a view", async () => {
    const cleanListener = jest.fn();
    viewMng.on("clean", cleanListener);

    const view = await AddVoidView(undefined, undefined, { viewMng });
    await viewMng.close(view);

    expect(cleanListener).toHaveBeenCalled();
  });

  it("must close a view without call event", async () => {
    const cleanListener = jest.fn();
    viewMng.on("clean", cleanListener);

    await AddVoidView(undefined, undefined, { viewMng });
    await AddVoidView(undefined, undefined, { viewMng });
    const view = await AddVoidView(undefined, undefined, { viewMng });

    const response = await viewMng.close(view);

    expect(response).toBe(view);
    expect(cleanListener).toBeCalledTimes(0);
  });
});

describe("when clean stack", () => {
  it("must clean view", async () => {
    const cleanListener = jest.fn();
    const destroy = jest.fn();
    const setupView = (v) => {
      v.destroy = destroy;
      return v;
    };

    viewMng.on("clean", cleanListener);
    await AddVoidView(activate, deactivate, { viewMng, setupView });
    await AddVoidView(activate, deactivate, { viewMng, setupView });
    await AddVoidView(activate, deactivate, { viewMng, setupView });
    await viewMng.clear();

    expect(deactivate).toHaveBeenCalledTimes(3);
    expect(cleanListener).toBeCalledTimes(1);
  });

  it("must clean by type", async () => {
    const setupView = (v) => {
      v.destroy = () => null;
      v.type = "other";
      return v;
    };
    await AddVoidView(activate, deactivate, {
      viewMng,
      setupView: (v) => {
        v.type = "home";
        v.destroy = () => null;
        return v;
      },
    });
    await AddVoidView(activate, deactivate, {
      viewMng,
      setupView: (v) => {
        v.type = "xx";
        v.destroy = () => null;
        return v;
      },
    });
    await AddVoidView(activate, deactivate, { viewMng, setupView });
    const response = await viewMng.cleanType("other");

    expect(response).toBeTruthy();
    expect(viewMng).toHaveLength(2);
    expect(viewMng.getView(0).type).toEqual("home");
  });

  it("must result false if clean empty stack", async () => {
    const response = await viewMng.cleanType("other");
    expect(response).toBeFalsy();
  });

  it("must use splice views", async () => {
    const setupView = (v) => {
      v.destroy = jest.fn();
      return v;
    };

    await AddVoidView(activate, deactivate, { viewMng, setupView });
    await AddVoidView(activate, deactivate, { viewMng, setupView });
    await AddVoidView(activate, deactivate, { viewMng, setupView });

    const splicedList = await viewMng.splice(1);

    expect(splicedList).toHaveLength(2);
    expect(viewMng).toHaveLength(1);
  });

  it("must use splice views with empty stack", async () => {
    const splicedList = await viewMng.splice(0);

    expect(splicedList).toHaveLength(0);
  });
});

describe("when navigate", () => {
  const FAKE_VIEW_NAME = "FAKE";
  let beforeNavigate;
  let navigate;

  beforeEach(() => {
    beforeNavigate = jest.fn();
    navigate = jest.fn();
    viewMng.on("beforeNavigate", beforeNavigate);
    viewMng.on("navigate", navigate);
  });

  it("must skip navigate", () => {
    viewMng.routes = {};
    viewMng.navigateTo(FAKE_VIEW_NAME);
    expect(beforeNavigate).toBeCalledTimes(1);
    expect(navigate).toBeCalledTimes(0);
  });

  it("must navigate with empty route", () => {
    viewMng.navigateTo(FAKE_VIEW_NAME);
    expect(beforeNavigate).toBeCalledTimes(0);
    expect(navigate).toBeCalledTimes(0);
  });

  it("must navigate to a route", () => {
    const route = jest.fn();
    viewMng.routes = {};
    viewMng.routes[FAKE_VIEW_NAME] = route;
    viewMng.navigateTo(FAKE_VIEW_NAME);
    expect(beforeNavigate).toHaveBeenCalledWith(FAKE_VIEW_NAME);
    expect(navigate).toHaveBeenCalledWith(FAKE_VIEW_NAME);
    expect(route).toBeCalledTimes(1);
  });

  it("must navigate to the OTHER route", () => {
    const route = jest.fn();
    viewMng.routes = {
      other: route,
    };
    viewMng.navigateTo(FAKE_VIEW_NAME);
    expect(beforeNavigate).toBeCalledTimes(1);
    expect(navigate).toBeCalledTimes(1);
    expect(route).toBeCalledTimes(1);
  });
});

describe("when use IgnoreIfViewAnnotation", () => {
  it("must ignore", async () => {
    const warn = jest.spyOn(console, "warn");
    const fn = jest.fn();
    const annotate = IgnoreIfViewAnnotation(fn, "void", viewMng);
    annotate();

    expect(warn).toHaveBeenCalledTimes(0);
  });

  it("must ignore", async () => {
    const warn = jest.spyOn(console, "warn");
    const fn = jest.fn();
    await AddVoidView(activate, deactivate, { viewMng });
    const annotate = IgnoreIfViewAnnotation(fn, "void", viewMng);

    annotate();

    expect(warn).toHaveBeenCalledTimes(1);
  });
});
