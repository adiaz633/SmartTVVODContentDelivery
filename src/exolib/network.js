import { AppStore } from "src/code/managers/store/app-store";

export const network = function () {
  this._ip = "";

  network.prototype.checkNetworkConnection = function () {
    if (AppStore.appStaticInfo.isEmulator) return true;

    var networkState = navigator.connection.type;

    var isConnected = true;
    if (networkState == navigator.connection.NONE) isConnected = false;

    return isConnected;
  };

  network.prototype.getIP = function () {
    this.calculateIP();
    return this._ip;
  };

  network.prototype.calculateIP = function () {
    var ip = "";
    /*
		if (AppStore.appStaticInfo.isEmulator)
			ip = '192.168.1.1';
		else
		{
			var self = this;
			xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET","http://jsonip.appspot.com/?asp.net", false);
			xmlhttp.onreadystatechange = function (){
				if (xmlhttp.readyState == 4)
				{
					if (xmlhttp.status == 200)
					{
						var hostipInfo = xmlhttp.responseText;
						var obj = JSON.parse(hostipInfo);
						self._ip = obj.ip;
					}
				}
			};
			xmlhttp.send();
		};
		*/
    ip = "192.168.1.1";

    return ip;
  };

  network.prototype.getRouterIP = function () {
    return "192.168.1.1";
  };
};
