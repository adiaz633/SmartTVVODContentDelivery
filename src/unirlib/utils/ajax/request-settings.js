let _instance = null;

export class RequestSettings {
  /**
   * Singleton on __RequestSettings__
   * @type {RequestSettings}
   */
  static get instance() {
    if (!_instance) {
      _instance = new RequestSettings();
      _instance.enableInterceptors = true;
    }
    return _instance;
  }
  enableInterceptors = true;
}
