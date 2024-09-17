// @ts-check

import { axiosFetcher } from "./fetchers";
import { ServerRequest } from "./server-request";
import { ServerResponse } from "./server-response";

/**
 * Execute ajax request
 *
 * @param {ServerRequest} request request settings
 * @param {object} options execute options
 * @param {(arg: ServerRequest) => Promise} options.fetcher Server fetch mechanism
 * @returns {ServerResponse} resolved
 */
export function executeRequest(request, options) {
  const serverRequest = new ServerRequest();

  const requestSetting = {
    ...serverRequest,
    ...request,
  };
  const opts = {
    fetcher: axiosFetcher,
    ...options,
  };

  requestSetting.setRequestHeader("Content-Type", requestSetting.contentType);
  const getRequest = async () => {
    //
    //  Before send method
    //
    await requestSetting.beforeSend.apply(requestSetting, [requestSetting]);

    //
    //  Execute concrete fetch
    //
    return opts.fetcher(/** @type {ServerRequest} */ (requestSetting));
  };

  return new ServerResponse(getRequest(), /** @type {ServerRequest} */ (requestSetting));
}
