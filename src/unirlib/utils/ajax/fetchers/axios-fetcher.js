import "whatwg-fetch";

import axios from "axios";

/**
 * axios fetcher
 *
 * @param {import ("../server-request").serverRequest} requestSetting
 * @returns {import ("axios").AxiosPromise} request promise
 */
export function axiosFetcher(requestSetting) {
  return axios.request({
    url: requestSetting.url,
    method: requestSetting.method.toLowerCase(),
    headers: requestSetting.headers,
    timeout: requestSetting.timeout,
    data: requestSetting.data,
  });
}
