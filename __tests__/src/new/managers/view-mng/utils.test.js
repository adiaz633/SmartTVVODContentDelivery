import { patcher } from "@newPath/managers/view-mng/utils";

describe("when validatr arguments", () => {
  it("must fail with no this arg", async () => {
    await expect(async () => {
      patcher();
    }).rejects.toThrowError("thisArg is required");
  });

  it("must fail with no target", async () => {
    await expect(async () => {
      patcher({});
    }).rejects.toThrowError("target is required");
  });

  it("must fail with no methodName", async () => {
    await expect(async () => {
      patcher({}, {});
    }).rejects.toThrowError("methodName is required");
  });

  it("must fail with inexistent methodName", async () => {
    await expect(async () => {
      patcher({}, {}, "run");
    }).rejects.toThrowError("Method name run does not exist on target");
  });
});

describe("when use patch", () => {
  const methodName = "method";
  const originalMethodInTarget = jest.fn();

  const thisArg = {
    [methodName]() {
      this.other();
    },

    other: jest.fn(),
  };

  const target = {
    [methodName]: originalMethodInTarget,
  };

  it("must call the patched function when call it in target", () => {
    const spiedMethod = jest.spyOn(thisArg, methodName);

    patcher(thisArg, target, methodName);
    target[methodName](1, 2, 3);

    expect(spiedMethod).toHaveBeenCalledWith(target, expect.any(Function), 1, 2, 3);
    expect(originalMethodInTarget).toBeCalledTimes(0);
  });

  it("must call original function from patched one", () => {
    const spiedMethod = jest.spyOn(thisArg, methodName).mockImplementation((_, _originalMethod, ...rest) => {
      _originalMethod(...rest);
    });

    patcher(thisArg, target, methodName);
    target[methodName](1, 2, 3);

    expect(spiedMethod).toHaveBeenCalledWith(target, expect.any(Function), 1, 2, 3);
    expect(originalMethodInTarget).toBeCalledWith(1, 2, 3);
  });
});
