const { StackList } = require("@newPath/managers/view-mng/stack-list");

describe("when use stack list", () => {
  const FAKE_ELEMENT_1 = 100;
  const FAKE_ELEMENT_2 = 101;
  const FAKE_ELEMENT_3 = 102;
  const FAKE_ELEMENT_ARRAY = [FAKE_ELEMENT_1, FAKE_ELEMENT_2, FAKE_ELEMENT_3];

  /** @type {StackList<number>} */
  let list;

  beforeEach(() => {
    list = new StackList();
  });

  it("must push", () => {
    list.push(FAKE_ELEMENT_1);
    expect(list.length).toBe(1);
    expect(list.toArray()).toHaveLength(1);
  });

  it("must pop", () => {
    list.push(FAKE_ELEMENT_1);
    const result = list.pop();
    expect(result).toEqual(FAKE_ELEMENT_1);
    expect(list.length).toBe(0);
  });

  it("must get item", () => {
    list.push(FAKE_ELEMENT_1);
    expect(list.item(0)).toEqual(FAKE_ELEMENT_1);
  });

  it("must set items", () => {
    const push = jest.spyOn(list, "push");

    list.setItems(FAKE_ELEMENT_ARRAY);
    expect(push).toBeCalledTimes(FAKE_ELEMENT_ARRAY.length);
    expect(list).toHaveLength(FAKE_ELEMENT_ARRAY.length);
    expect(list.toArray()).toEqual(FAKE_ELEMENT_ARRAY);
  });

  describe("when removing elements", () => {
    beforeEach(() => {
      list.setItems(FAKE_ELEMENT_ARRAY);
    });

    it("must slice", () => {
      const result = list.splice(1, 1);
      expect(result).toStrictEqual([FAKE_ELEMENT_2]);
      expect(list).toHaveLength(2);
      expect(list.toArray()).toStrictEqual([FAKE_ELEMENT_1, FAKE_ELEMENT_3]);
    });

    it("must slice without length parameter", () => {
      const result = list.splice(1);
      expect(result).toStrictEqual([FAKE_ELEMENT_2, FAKE_ELEMENT_3]);
      expect(list).toHaveLength(1);
      expect(list.toArray()).toStrictEqual([FAKE_ELEMENT_1]);
    });

    it("must use remove", () => {
      const result = list.remove(FAKE_ELEMENT_2);
      expect(result).toBeTruthy();
      expect(list).toHaveLength(2);
      expect(list.toArray()).toStrictEqual([FAKE_ELEMENT_1, FAKE_ELEMENT_3]);
    });

    it("must to remove a non existing element", () => {
      const FAKE_NOT_FOUND_ELEMENT = 999;
      const result = list.remove(FAKE_NOT_FOUND_ELEMENT);
      expect(result).toBeFalsy();
    });
  });
});
