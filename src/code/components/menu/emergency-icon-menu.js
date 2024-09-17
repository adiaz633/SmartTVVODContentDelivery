import { ProfilesView } from "@newPath/views/userprofiles/userprofiles";

export const profileEmergencyIconMenu = () => {
  const imagenProfileMenu = document.querySelector(".user-img");
  if (imagenProfileMenu) {
    imagenProfileMenu.addEventListener("error", () => {
      //obtener la referencia de la imagen de emergencia en userProfiles
      const userProfiles = new ProfilesView();
      const imgEmergencia = userProfiles.opts.imagenEmergencia;
      imagenProfileMenu.classList.add("error");
      imagenProfileMenu.setAttribute("src", imgEmergencia);
    });
  }
};
