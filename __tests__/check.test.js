describe("Cundo se verifica el funcionamiento de jest", () => {
  it("Debe ejecutar el test usando los mocks de consola", () => {
    console.info("PRUEBA DEL SETUP NO SE DEBE VER");
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it("Debe estar definido las variables de entorno", () => {
    expect(CONFIG_ENV).toBeDefined();
  });
});
