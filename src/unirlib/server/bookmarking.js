import { parseUrl } from "src/code/js/lib";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { Utils } from "@unirlib/utils/Utils";

export const bookmarking = function () {
  this.get_favoritos = function () {
    const query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "favoritos_list");
    if (query.need_hztoken && !query.x_hzid) {
      // Resolve promise
      return Promise.resolve();
    }
    query.url = parseUrl(query.url, true);
    const promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: "GET",
        url: query.url,
        first_401: true,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this.add_favorito = function (accountId, profileId, link, is_recording) {
    return this.exec_method_favorito(accountId, profileId, link, is_recording, "POST");
  };

  this.delete_favorito = function (accountId, profileId, link, is_recording) {
    return this.exec_method_favorito(accountId, profileId, link, is_recording, "DELETE");
  };

  this.exec_method_favorito = function (accountId, profileId, link, is_recording, method) {
    const query = this.get_link_query(link);
    if (!query) {
      const error = {
        status: 0,
        responseText: "No query from content link",
        contentId: accountId,
      };
      return Promise.reject(error);
    }
    const url_query = query.url
      .toLowerCase()
      .replace("{accountid}", accountId)
      .replace("{profileid}", profileId)
      .replace("{isrecording}", is_recording);
    query.url = parseUrl(url_query, true);
    const promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method,
        url: query.url,
        first_401: true,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        contentType: "application/json",
        success(data, status, xhr) {
          const resolve_data = { status: xhr.status, accountId: accountId, profileId, data };
          resolve(resolve_data);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                  contentId: accountId
                };
                reject(error);
              }
            );
          } else {
            var error = {
              status: xhr.status,
              responseText: xhr.responseText,
              contentId: accountId,
            };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this.get_link_query = function (link) {
    let query = null;
    if (link && link.hints && link.hints["auth-req"]) {
      query = {
        url: link.href,
        timeout: parseInt(AppStore.wsData._timeout),
        retries: parseInt(AppStore.wsData._retries),
        x_hzid: null,
        need_token: link.hints["auth-req"].find((element) => element.scheme == "Bearer") != null,
        need_hztoken: null,
        need_header_deviceid: false,
      };
    }
    return query;
  };

  /* PUNTOS DE REPRODUCCION */

  this.get_viewing_list = function () {
    const query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "bookmarks_list");
    if (query.need_hztoken && !query.x_hzid) {
      // Resolve promise
      return Promise.resolve();
    }
    query.url = parseUrl(query.url, true);
    const promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: "GET",
        url: query.url,
        first_401: true,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this.post_reproduccion = function (id, link, time_elapsed) {
    return this.exec_method_reproduccion(id, link, time_elapsed, "POST");
  };

  this.delete_reproduccion = function (id, link) {
    return this.exec_method_reproduccion(id, link, 0, "DELETE");
  };

  this.get_bookmark_form = function (link, time_elapsed) {
    const form = link && link.form ? link.form : "";
    if (form) {
      form.timeElapsed = time_elapsed;
    }
    return form;
  };

  this.exec_method_reproduccion = function (id, link, time_elapsed, method) {
    const query = this.get_link_query(link);
    if (!query) {
      const error = {
        status: 0,
        responseText: "No query from content link",
        contentId: id,
      };
      return Promise.reject(error);
    }
    const form = this.get_bookmark_form(link, time_elapsed);
    const is_recording = unirlib.getMyLists().estaRecordinglist(id);
    const url_query = query.url.toLowerCase().replace("{isrecording}", is_recording);
    query.url = parseUrl(url_query, true);
    const promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method,
        url: query.url,
        data: JSON.stringify(form),
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        contentType: "application/json",
        success(data, status, xhr) {
          resolve({ data, status: xhr.status });
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  /*  TRACKING DE SERIES */

  this.get_tracking_lists = function () {
    var query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "tracking_series");
    if (query.need_hztoken && !query.x_hzid) {
      // Resolve promise
      return Promise.resolve();
    }
    query.url = parseUrl(query.url, true);
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: "GET",
        url: query.url,
        first_401: true,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this.delete_tracked_serie = function (id) {
    var query = AppStore.wsData.getURLTkservice("tfgunir/cuenta", "dejardeseguir2");
    var URL = query.url.replace("{seriesId}", id);
    URL = parseUrl(URL, true);
    query.url = Utils.escapeURL(URL);
    query.method = "DELETE";
    var requestBody = "{" + "}";
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: query.method,
        url: query.url,
        data: requestBody,
        first_401: true,
        need_token: query.need_token,
        x_hzid: query.x_hzid,
        contentType: "application/json",
        success(data, status, xhr) {
          var resolve_data = { status: xhr.status, contentId: id };

          resolve(resolve_data);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                if (ajax_instance.x_hzid) ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: query.timeout,
      });
    });
    return promise;
  };

  this.get_linked_pr = function (url_query_video) {
    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        method: "GET",
        url: url_query_video,
        first_401: true,
        x_hzid: AppStore.profile.get_token(),
        success(data, status, xhr) {
          resolve(xhr.responseText);
        },
        error(xhr, textStatus, errorThrown) {
          if (xhr.responseText && xhr.responseText.search("40101") != -1 && this.first_401) {
            var ajax_instance = this;
            this.first_401 = false;
            AppStore.profile.refreshActiveInitDataElements().then(
              function (response) {
                ajax_instance.x_hzid = AppStore.profile.get_token();
                Utils.ajax(ajax_instance);
              },
              function (error) {
                var error = {
                  status: xhr.status,
                  responseText: xhr.responseText,
                };
                reject(error);
              }
            );
          } else {
            var error = { status: xhr.status, responseText: xhr.responseText };
            reject(error);
          }
        },
        timeout: 5000,
      });
    });
    return promise;
  };
};
