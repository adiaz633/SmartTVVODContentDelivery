const compiler = require("./compiler");

describe("when use hasTag", () => {
  const testCases = [
    {
      content: "// #IF",
      result: true,
    },
    {
      content: "// #if",
      result: true,
    },
    {
      content: "// # IF",
      result: false,
    },
    {
      content: "/// #IF",
      result: false,
    },
    {
      content: "",
      result: false,
    },
    {
      content: undefined,
      result: false,
    },
  ];

  for (const { content, result } of testCases) {
    it(`Must check if ${content} hasTags is ${result}`, () => {
      const value = compiler.hasTags(content);
      expect(value).toBe(result);
    });
  }
});

describe("when evaluateIf", () => {
  const env = {
    VARIABLE: true,
  };
  const testCases = [
    {
      content: "// IF",
      result: false,
      env: undefined,
    },
    {
      content: "// #IF",
      result: false,
      env: undefined,
    },
    {
      content: "texto // #IF VARIABLE",
      result: false,
      env,
    },
    {
      content: "// #IF VARIABLE",
      result: true,
      env: undefined,
    },
    {
      content: "\t  // #IF VARIABLE",
      result: true,
      env: undefined,
    },
    {
      content: "\t  // #if VARIABLE",
      result: true,
      env: undefined,
    },
    {
      content: "\t  // #IF VARIABLE",
      result: false,
      env,
    },
  ];

  for (const { content, result, env } of testCases) {
    it(`Must evaluate IF ${content} as ${result}`, () => {
      const value = compiler.evaluateIf(content, env);
      expect(value).toBe(result);
    });
  }
});

describe("when evaluateEndIf", () => {
  const testCases = [
    {
      content: "// ENDIF",
      result: false,
    },
    {
      content: "// #ENDIF",
      result: true,
    },
    {
      content: "texto // #ENDIF",
      result: false,
    },
    {
      content: "// #endif",
      result: true,
    },
  ];

  for (const { content, result } of testCases) {
    it(`Must evaluate endif ${content} as ${result}`, () => {
      const value = compiler.evaluateEndIf(content);
      expect(value).toBe(result);
    });
  }
});

describe("when use compiler", () => {
  const SOURCE = `
  START
  // #IF VARIABLE
  CONTENT
  // #ENDIF
  END
  `;

  it("must to clean if", () => {
    const result = compiler.compile(SOURCE);
    expect(result).toEqual(`
  START
  END
  `);
  });

  it("must to add code", () => {
    const result = compiler.compile(SOURCE, {
      VARIABLE: true,
    });
    expect(result).toEqual(SOURCE);
  });

  it("must fail with no closed if", () => {
    expect(() => {
      compiler.compile("// #IF VARIABLE");
    }).toThrow("Syntax error missing #ENDIF");
  });

  it("must fail with no closed if (lowercase)", () => {
    expect(() => {
      compiler.compile("// #if VARIABLE");
    }).toThrow("Syntax error missing #ENDIF");
  });
});
