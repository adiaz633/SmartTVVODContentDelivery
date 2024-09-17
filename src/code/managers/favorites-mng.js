import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";

let instance = null;

export class FavoritesMng {
  constructor() {
    this.opts = {};
  }

  static get instance() {
    if (instance) {
      return instance;
    }
    instance = new FavoritesMng();
    return instance;
  }

  add(family, id) {
    var self = this;
    const params = { family, id };
    return new Promise(function (resolve, reject) {
      const mylists = unirlib.getMyLists();
      mylists.setFavorites(params).then(
        function (response) {
          if (!mylists.esta_favorito(response.contentId, params.family)) {
            var content = {
              contentId: response.contentId,
              family: params.family,
            };
            mylists._myFavorites.push(content);
          }
          AppStore.home.refresh_endpoint("tfgunir/consultas", "favoritos");
          AppStore.home.refresh_focus();
          resolve();
        },
        function (error) {
          reject(error);
        }
      );
    });
  }

  delete(family, id) {
    var self = this;
    const params = { family, id };
    return new Promise(function (resolve, reject) {
      const mylists = unirlib.getMyLists();
      mylists.deleteFavorites(params).then(
        function (response) {
          if (mylists.esta_favorito(response.contentId, params.family)) {
            var index = mylists.indexOfFavorites(response.contentId, params.family);
            mylists._myFavorites.splice(index, 1);
          }
          AppStore.home.refresh_endpoint("tfgunir/consultas", "favoritos");
          AppStore.home.refresh_focus();
          resolve();
        },
        function (error) {
          reject(error);
        }
      );
    });
  }
}
