import { appConfig } from "@appConfig";
import { AppStore } from "src/code/managers/store/app-store";
import { Main } from "@tvlib/Main";
import { MitoAPI } from "@tvlib/MitoAPI";
import { timezone } from "@unirlib/server/timezone";
import i18next from "i18next";
import { fetch } from "whatwg-fetch";

import { executeRequest } from "./ajax";

export const Utils = {};

Utils.ajax = function (query, options) {

  const url2sign = query.url;

  query.beforeSend = async (xhr) => {
    if (query.need_token) {
      xhr.setRequestHeader("Authorization", await AppStore.wsData.getAuthorization({ ...query, url: url2sign }));
    }
    if (query.overrideMimeType) {
      xhr.overrideMimeType(query.overrideMimeType);
    }
    if (query.nocache) {
      xhr.setRequestHeader("Cache-Control", "no-store, max-age=0");
    }
  };
  // return $.ajax(query, options);
  return executeRequest(query);
};

Utils.fetch = async function (url, options) {
  return await fetch(url, options);
};

Utils.fetchWithTimeout = async function (url, timeoutService, options = {}) {
  const { timeout = timeoutService } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
};

Utils.b64EncodeUnicode = function (str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
      return String.fromCharCode("0x" + p1);
    })
  );
};

Utils.b64DecodeUnicode = function (str) {
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
};

Utils.parseURL = function (url) {
  var a = document.createElement("a");
  a.href = url || window.location;
  return {
    source: url,
    protocol: a.protocol.replace(":", ""),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (function () {
      var ret = {},
        seg = a.search.replace(/^\?/, "").split("&"),
        len = seg.length,
        i = 0,
        s;
      for (; i < len; i++) {
        if (!seg[i]) {
          continue;
        }
        s = seg[i].split("=");
        ret[s[0]] = s[1];
      }
      return ret;
    })(),
    file: (a.pathname.match(/\/([^/?#]+)$/i) || [undefined, ""])[1],
    hash: a.hash.replace("#", ""),
    path: a.pathname.replace(/^([^/])/, "/$1"),
    relative: (a.href.match(/tps?:\/\/[^/]+(.+)/) || [undefined, ""])[1],
    segments: a.pathname.replace(/^\//, "").split("/"),
  };
};

//Corta un string y agrega ...
Utils.trimString = function (str, nchars) {
  var res = str;
  var strlen = str ? str.length : 0;

  if (strlen > nchars) {
    res = str.substring(0, nchars - 1);
    res = res + "&#8230";
  } else {
    res = str;
  }

  return res;
};

Utils.trimStringSufix = function (str, nchars, sufix) {
  var res = str;
  var strlen = str ? str.length : 0;
  var longitud_total = nchars - (sufix.length + 1);

  if (strlen > longitud_total) {
    res = str.substring(0, longitud_total - 1);
    res = res + "&#8230" + " " + sufix;
  } else {
    res = str + " " + sufix;
  }

  return res;
};

//Corta un string para X filas y agrega ...
Utils.trimStringRows = function (str, nrows, charsXrow) {
  var res = "";
  var strlen = str != null ? str.length : 0;
  var irow = 0;
  if (strlen <= charsXrow) {
    res = str + "\n";
  } else {
    var istart = 0;
    while (irow < nrows) {
      var temp = str.substring(istart, istart + charsXrow - 1);
      var nlastw = temp.lastIndexOf(" ");

      var add_res;
      if (nlastw > 0) add_res = temp.substring(0, nlastw);
      else add_res = temp;

      res = res + add_res + "\n";
      istart = nlastw;
      //res = res + "...";
      irow++;
    }
    if (res.length < strlen) res = res + "&#8230";
  }

  return res;
};

Utils.trimStringRows2 = function (str, nrows, charsXrow) {
  var res = "";
  var words = str.split(" ");
  var end = false;
  var i = 0;

  var row_actual = 0;
  while (!end) {
    if (words[i].length > charsXrow) {
      if (row_actual < nrows) {
        const temp = words[i].substring(0, charsXrow - 1);
        res = res + temp + "&#8230";
      }
      end = true;
    } else {
      var row_length = 0;
      var linea_completa = false;
      while (!linea_completa && i < words.length) {
        var long_candidate = row_length + words[i].length;
        linea_completa = long_candidate > charsXrow;
        if (!linea_completa) {
          res = res + words[i] + " ";
          row_length = row_length + words[i].length + 1;
          i++;
        }
      }
      res = res.substring(0, res.length - 1);
      end = row_actual == nrows - 1 || i == words.length;
      if (i < words.length && !end) {
        row_actual++;
        res = res + "\n";
      } else {
        if (i != words.length) res = res + "&#8230";
      }
    }
  }

  return res;
};

Utils.trimStringRowsSufix = function (str, nrows, charsXrow, sufix) {
  var res = "";
  var words = str.split(" ");
  var end = false;
  var i = 0;

  if (!sufix || sufix.length == 0) return Utils.trimStringRows2(str, nrows, charsXrow);

  var row_actual = 0;
  while (!end) {
    // Si una palabra es tan larga que no entra ella sola en la linea...
    if (words[i].length > charsXrow) {
      if (row_actual == nrows - 1) {
        const temp = words[i].substring(0, charsXrow - 1);
        res = res + temp + "&#8230";
      } else {
        const temp = words[i].substring(0, charsXrow - 1);
        res = res + temp + "&#8230" + "\n" + sufix;
      }
      end = true;
    }
    // Si la palabra entra en la linea
    else {
      var row_length = 0;
      var linea_completa = false;
      // Se completan con palabras hasta que la linea este completa.
      while (!linea_completa && i < words.length) {
        var long_candidate = row_length + words[i].length;
        linea_completa = long_candidate > charsXrow;
        if (!linea_completa) {
          res = res + words[i] + " ";
          row_length = row_length + words[i].length + 1;
          i++;
        }
      }
      res = res.substring(0, res.length - 1);
      // final si es la ultima fila o no quedan mas palabras
      end = row_actual == nrows - 1 || i == words.length;
      if (!end) {
        row_actual++;
        res = res + "\n";
      } else {
        //Si no quedaban mas palabras pero hay una linea extra disponible... se inserta el sufijo
        if (row_actual != nrows - 1) {
          var with_sufix = res + sufix;
          var length_with_sufix = with_sufix.length + 1;
          if (length_with_sufix < charsXrow) {
            res = res + " " + sufix;
          } else {
            if (i == words.length) res = res + "\n" + sufix;
            else res = res + "&#8230" + "\n" + sufix;
          }
        }
        //Si no hay lineas disponibles... se acorta el string resultado, si no caben el resto de palabras.
        else {
          if (i < words.length) {
            res = res.substring(0, res.length - sufix.length) + "&#8230" + " " + sufix;
          } else {
            res = res + "&nbsp" + sufix;
          }
        }
      }
    }
  }

  return res;
};

Utils.addImageLocal = function (parent, imgpath, imgid, imgclass, imgdisplay) {
  var newImg = document.createElement("img");
  newImg.id = imgid;
  newImg.className = imgclass;
  newImg.src = imgpath;
  newImg.style.display = imgdisplay;

  var parent_dom = document.getElementById(parent);
  if (parent_dom != null) parent_dom.appendChild(newImg);
};

Utils.addImage = function (parent, imgpath, imgid, imgclass, imgdisplay) {
  var newImg = document.createElement("img");
  newImg.id = imgid;
  newImg.className = imgclass;
  newImg.src =
    AppStore.wsData && AppStore.wsData._SRV_RECURSOS
      ? AppStore.wsData._SRV_RECURSOS + imgpath
      : "images/server/" + imgpath;
  newImg.style.display = imgdisplay;

  var parent_dom = document.getElementById(parent);
  if (parent_dom != null) parent_dom.appendChild(newImg);
};

Utils.prependImage = function (parent, imgpath, imgid, imgclass, imgdisplay) {
  var newImg = document.createElement("img");
  newImg.id = imgid;
  newImg.className = imgclass;
  newImg.src =
    AppStore.wsData && AppStore.wsData._SRV_RECURSOS
      ? AppStore.wsData._SRV_RECURSOS + imgpath
      : "images/server/" + imgpath;
  newImg.style.display = imgdisplay;

  var parent_dom = document.getElementById(parent);
  if (parent_dom != null) parent_dom.insertBefore(newImg, parent_dom.firstChild);
};

Utils.addImageURL = function (parent, url, imgid, imgclass, imgdisplay) {
  var newImg = document.createElement("img");
  newImg.id = imgid;
  newImg.className = imgclass;
  newImg.src = url;
  newImg.style.display = imgdisplay;

  var parent_dom = document.getElementById(parent);
  if (parent_dom != null) parent_dom.appendChild(newImg);
};

Utils.formateDateTime = function (jdate2) {
  var d = jdate2.getUTCDate();
  var day = d < 10 ? "0" + d : d;
  var m = jdate2.getUTCMonth() + 1;
  var month = m < 10 ? "0" + m : m;
  var yy = jdate2.getUTCFullYear();
  var year = yy < 1000 ? yy + 1900 : yy;
  var minuto = jdate2.getUTCMinutes() < 10 ? "0" + jdate2.getUTCMinutes() : jdate2.getUTCMinutes();
  var hora = jdate2.getUTCHours() < 10 ? "0" + jdate2.getUTCHours() : jdate2.getUTCHours();

  var jdate = year + "-" + month + "-" + day + "T" + hora + ":" + minuto + ":00";

  return jdate + "Z";
};

Utils.formateDateTimeGMT = function (jdate2) {
  // Convertimos a hora en Madrid para hacer peticion al servidor
  const utcHour = jdate2.getUTCHours();
  const gmtMadrid = AppStore.serverTime.getMadridGMT();
  let tzhour = utcHour + gmtMadrid;
  let tzday = null;
  if (tzhour >= 24) {
    tzhour = tzhour - 24;
    tzday = new Date(jdate2.getUTCFullYear(), jdate2.getUTCMonth(), jdate2.getUTCDate() + 1);
  } else if (tzhour < 0) {
    tzhour = 24 - tzhour;
    tzday = new Date(jdate2.getUTCFullYear(), jdate2.getUTCMonth(), jdate2.getUTCDate() - 1);
  } else {
    tzday = new Date(jdate2.getUTCFullYear(), jdate2.getUTCMonth(), jdate2.getUTCDate());
  }

  var d = tzday.getDate();
  var day = d < 10 ? "0" + d : d;
  var m = tzday.getMonth() + 1;
  var month = m < 10 ? "0" + m : m;
  var yy = tzday.getFullYear();
  var year = yy < 1000 ? yy + 1900 : yy;
  var minuto = jdate2.getMinutes() < 10 ? "0" + jdate2.getMinutes() : jdate2.getMinutes();
  var hora = tzhour < 10 ? "0" + tzhour : tzhour;

  var jdate = year + "-" + month + "-" + day + "T" + hora + ":" + minuto + ":00";

  return jdate + "Z";
};

Utils.parseXML = function (strToParse, strStart, strFinish) {
  var str = strToParse.match(strStart + "(.*?)" + strFinish);
  var result = null;

  if (str != null) result = str[1];

  return result;
};

Utils.sleep = function (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

Utils.time2Text = function (time, showHour) {
  var timeHour = 0;
  var timeMinute = 0;
  var timeSecond = 0;

  timeHour = Math.floor(time / 3600000);
  timeMinute = Math.floor((time % 3600000) / 60000);
  timeSecond = Math.floor((time % 60000) / 1000);

  var timeTxt = "";
  if (showHour) {
    if (timeHour < 10) timeHour = "0" + timeHour;
    timeTxt += timeHour + ":";
  }

  if (timeMinute < 10) timeMinute = "0" + timeMinute;
  timeTxt += timeMinute + ":";

  if (timeSecond < 10) timeSecond = "0" + timeSecond;
  timeTxt += timeSecond;

  return timeTxt;
};

Utils.date2String = function (mls) {
  var date = new Date(mls / 1);

  var tz_date = new timezone();
  tz_date.initialize(date);

  var minuto = tz_date.getMinutes() < 10 ? "0" + tz_date.getMinutes() : tz_date.getMinutes();
  var hora = tz_date.getHours() < 10 ? "0" + tz_date.getHours() : tz_date.getHours();
  var str = hora + "." + minuto + "h";
  return str;
};

Utils.diffHours = function (fecha2, fecha1) {
  let diff = (fecha2.getTime() - fecha1.getTime()) / 1000;
  diff /= 60 * 60;
  return Math.abs(diff);
};

Utils.dateToString = function (fecha) {
  let dia, mes, horas, minutos, segundos;

  dia = fecha.getDate();
  mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();
  horas = fecha.getHours();
  minutos = fecha.getMinutes();
  segundos = fecha.getSeconds();

  dia = dia.toString().padStart(2, "0");
  mes = mes.toString().padStart(2, "0");
  horas = horas.toString().padStart(2, "0");
  minutos = minutos.toString().padStart(2, "0");
  segundos = segundos.toString().padStart(2, "0");

  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
};

Utils.convertFormatStringToDate = function (fechaString) {
  const formato = "dd/mm/yyyy hh:mm:ss";
  const delimitadorFecha = "/";
  const delimitadorHora = ":";
  let resultado = null;

  const goodDate =
    /^(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2]|1[0-2])\/[0-9]{4} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]*$/;

  if (goodDate.test(fechaString)) {
    const dateItems = fechaString.split(delimitadorFecha); //array de elementos de la fecha
    let yearHour = dateItems[2]; //Formato yyyy hh:mm:ss
    dateItems.pop(); // Quitamos el último elemento del array, que contiene el formato anterior y lo tratamos
    dateItems.push(yearHour.split(" ")[0]); //añadimos el primer elemento del formato yearHour dividido por espacio, que se corresponde al año

    // procesamos por delimitadorHora las horas, minutos, segundos
    yearHour = yearHour.split(" ")[1];
    yearHour = yearHour.split(delimitadorHora);
    dateItems.push(yearHour[0]); // añadir hora
    dateItems.push(yearHour[1]); // añadir minutos
    dateItems.push(yearHour[2]); //añadir segundos

    resultado = new Date(
      parseInt(dateItems[2], 10),
      parseInt(dateItems[1], 10) - 1,
      parseInt(dateItems[0], 10),
      parseInt(dateItems[3], 10),
      parseInt(dateItems[4], 10),
      parseInt(dateItems[5], 10)
    );
  }
  return resultado;
};

Utils.checkIsCorrectTimeStampOrDate = function (dateParam) {
  let result = dateParam instanceof Date;
  if (!result) {
    result = !isNaN(Date.parse(new Date(dateParam)));
  }
  return result;
};

Utils.generateUUID = function () {
  var d = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
};

Utils.ms2sec = function (time_ms) {
  return Math.floor(time_ms / 1000);
};

Utils.code2Letter = function (keyCode) {
  var result = null;

  if (keyCode >= 65 && keyCode <= 90) result = String.fromCharCode(keyCode);
  else if (keyCode >= 97 && keyCode <= 122) result = String.fromCharCode(keyCode);
  else if (keyCode == 186) result = "Ñ";

  return result;
};

Utils.borraParametroURL = function (url, parametro) {
  var url_result = "";
  var search_text = "?" + parametro + "=";
  var is_first_param = url.indexOf(search_text) > -1;
  if (is_first_param) {
    var first_index = url.indexOf("?");
    var last_index = url.indexOf("&");
    const url_replace = url.substring(first_index, last_index);
    url_result = url.replace(url_replace, "");
    if (url.indexOf("&") > -1) url_result = url_result.replace("&", "?");
  } else {
    var res = url.split("&");
    for (var i = 0; i < res.length; i++) {
      var es_parametro = res[i].toLowerCase().indexOf(parametro.toLowerCase() + "=") == 0;
      if (!es_parametro) {
        var amper = i == 0 ? "" : "&";
        url_result = url_result + amper + res[i];
      }
    }
  }
  return url_result;
};

Utils.borraParametroURLporNombre = function (url, nombre) {
  var url_result = "";
  var res = url.split("&");
  if (res[0].search(nombre) != -1) {
    var first_index = res[0].indexOf("?");
    res[0] = res[0].substring(0, first_index);
  }
  for (var i = 0; i < res.length; i++) {
    var tiene_nombre = res[i].toLowerCase().search(nombre.toLowerCase()) != -1;
    if (!tiene_nombre) {
      var amper = i == 0 ? "" : "&";
      url_result = url_result + amper + res[i];
    }
  }

  return url_result;
};

Utils.borraParametroURLporProxy = function (url, proxy) {
  var url_result = "";
  var res = url.split("&");
  if (res[0].search(proxy) != -1) {
    var first_index = url.indexOf("?");
    res[0] = res[0].substring(0, first_index);
  }
  for (var i = 0; i < res.length; i++) {
    var tiene_proxy = res[i].toLowerCase().search(proxy.toLowerCase()) != -1;
    if (!tiene_proxy) {
      var amper = i == 0 ? "" : "&";
      url_result = url_result + amper + res[i];
    }
  }

  return url_result;
};

Utils.getParametrosURL = function (url) {
  var parametros = url.split("&");
  if (parametros[0].search("?") != -1) {
    var first_index = parametros[0].indexOf("?");
    parametros[0] = parametros[0].substring(first_index, parametros[0].lenght);
  }

  return parametros;
};

Utils.getURLBase = function (url) {
  var first_index = url.indexOf("?");
  const url_base = url.substring(0, first_index);
  return url_base;
};

Utils.addParametroURL = function (parametros, name, value) {
  var length = parametros ? parametros.length : 0;
  for (var i = 0; i < length; i++) {
    if (parametros[i].search(name) != -1 && parametros[i].indexOf(name) == 0) parametros.splice(i, 1);
  }
  var parametro = name + "=" + value;
  parametros.push(parametro);
};

Utils.removeParametroURL = function (parametros, name) {
  var length = parametros ? parametros.length : 0;
  for (var i = 0; i < length; i++) {
    if (parametros[i].search(name) != -1 && parametros[i].indexOf(name) == 0) parametros.splice(i, 1);
  }
};

Utils.buildParametrosURL = function (url_base, parametros) {
  var url_result = url_base + "?";
  var length = parametros ? parametros.length : 0;
  for (var i = 0; i < length; i++) {
    url_result = url_result + "&" + parametros[i];
  }
  return url_result;
};

Utils.sanitizeURL = function (url) {
  var result = "";
  if (url) {
    if (url.indexOf("http:") == 0 || url.indexOf("https:") == 0) {
      result = url;
    } else {
      result = "http://" + url;
    }
  }
  return result;
};

Utils.trunc = function (n) {
  return n - (n % 1);
};

Utils.escapeURL = function (URL) {
  var url2 = URL;

  url2 = url2.replace("+", "%2B");

  return url2;
};

/*
 * Funcion que recorre las variables de las url obtenidas entre llaves {} y las regenera en mayuscula
 * */
Utils.urlvar2UpperString = function (url) {
  var url_result = "";

  /*
   * si queremos un check para llaves anidadas y que detecte llaves dentro de strings,
   * habra que implementarlo con pilas, pero de momoento asi nos vale
   * */
  var balanced = 0;
  for (var j = 0; j < url.length; j++) {
    if (url.charAt(j) == "{") balanced++;
    else if (url.charAt(j) == "}") balanced--;
  }

  if (balanced === 0) {
    var str_array = url.split("{");
    var updated_array = new Array();
    var i = 0;
    while (i < str_array.length) {
      var splitted_str = str_array[i];
      var index_of_cbrace = splitted_str.indexOf("}");
      var var_name = splitted_str.substring(0, index_of_cbrace);
      var uppercase_var_name = var_name.toUpperCase();
      splitted_str = splitted_str.substring(index_of_cbrace, splitted_str.length);
      var updated_str = i == 0 ? splitted_str : "{" + uppercase_var_name + splitted_str;
      updated_array[i] = updated_str;
      i++;
    }

    for (i = 0; i < str_array.length; i++) {
      url_result = url_result + updated_array[i];
    }
  } else url_result = url;

  return url_result;
};

Utils.ajustaTamañoFuenteElemento = function (elemento, max_height, tamaño_fuente) {
  var exito = false;
  var size = parseInt(tamaño_fuente);
  while (!exito) {
    var element_height = $(elemento).outerHeight();
    exito = element_height < max_height;
    if (!exito && size > 0) {
      size = size - 2;
      $(elemento).css("font-size", size + "px");
    }
  }
};

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}

Utils.esArrayJSON = function (json) {
  var json_str = JSON.stringify(json);
  var esArray = false;
  if (json_str[0] == "[") esArray = true;

  return esArray;
};

Utils.cloneJSON = function (json) {
  return JSON.parse(JSON.stringify(json));
};

Utils.difDays = function (date1, date2) {
  var dt1 = new Date(date1);
  var dt2 = new Date(date2);

  var days = 0;
  if (dt1.getDate() > dt2.getDate()) days = 1;
  else if (dt1.getDate() < dt2.getDate()) days = -1;
  return days;
};

Utils.hexEncode = function (str) {
  var values = str.split(".");
  var hex = "";
  for (var i = 0; i < values.length; i++) {
    hex += Number(values[i]).toString(16);
  }
  return hex;
};

var daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
Utils.formatDayOfWeek = function (time, useColloquial) {
  useColloquial = typeof useColloquial !== "undefined" ? useColloquial : true;
  if (!useColloquial) return daysOfWeek[time.getDay()] + " " + time.getDate();

  const today = new Date();
  const yesterday = new Date(new Date().setDate(today.getDate() - 1));
  const tomorrow = new Date(new Date().setDate(today.getDate() + 1));

  const miTime = time.toLocaleDateString("es-ES");
  if (miTime === today.toLocaleDateString("es-ES")) {
    return "Hoy";
  } else if (miTime === yesterday.toLocaleDateString("es-ES")) {
    return "Ayer";
  } else if (miTime === tomorrow.toLocaleDateString("es-ES")) {
    return "Mañana";
  } else {
    return daysOfWeek[time.getDay()] + " " + time.getDate();
  }
};

Utils.isEmpty = function (elemento) {
  return (
    elemento == null || elemento.length === 0 || (typeof elemento === "object" && Object.keys(elemento).length === 0)
  );
};

Utils.ms2String = function (time) {
  const timeHour = Math.floor(time / 3600000);
  let timeMinute = Math.floor((time % 3600000) / 60000);
  let timeSecs = Math.floor((time % 60000) / 1000);

  if (timeMinute < 10) timeMinute = "0" + timeMinute;
  if (timeSecs < 10) timeSecs = "0" + timeSecs;

  return timeHour + ":" + timeMinute + ":" + timeSecs;
};

Utils.format2decimals = function (number) {
  return Math.round(number * 100) / 100;
};

/* Verifica si es una URL válida que incluye el protocolo "http" o "https" al incio */
Utils.isValidHttpUrl = function (string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

Utils.replacePatternByRegex = function (pattern, regExpression, keyWords = {}) {
  let valor = pattern.search(regExpression);
  while (valor !== -1) {
    const result = pattern.match(regExpression);
    const titulo = i18next.t(result[1], keyWords);
    pattern = pattern.replace(result[0], titulo);
    valor = pattern.search(regExpression);
  }
  return pattern;
};

Utils.replaceStringPatternByRegex = function (pattern, regExpression, keyWords = {}) {
  let valor = pattern.search(regExpression);
  while (valor !== -1) {
    const result = pattern.match(regExpression);
    pattern = pattern.replace(result[0], keyWords[result[1]]);
    valor = pattern.search(regExpression);
  }
  return pattern;
};

Utils.equalUrls = function (url1, url2) {
  if (url1 === null || url1 === "" || url1 === undefined || url2 === null || url2 === "" || url2 === undefined)
    return false;
  url1 = url1.substring(url1.indexOf("//") + 2);
  url2 = url2.substring(url2.indexOf("//") + 2);
  return url1 === url2;
};

/* *************** ejemplo de uso: *********************
 * import { getSVGImagesUtils } from "@unirlib/utils/Utils";
 * const pathSvg = getSVGImagesUtils(); // getSVGImagesUtils("sprite_TOTAL.svg", "./images/svgs/");
 * ico_edit: "<svg class='ico_edit'>\
 *           <use href='" + pathSvg + "#ico_edit'></use>\
 *           </svg>",
 *
 ********************************************************* */
export const getSVGImagesUtils = (remoteFile, remotePath) => {
  const defaultPath = "./images/svgs/";
  const defaultFile = "sprite_TOTAL.svg";
  const path = remotePath ? remotePath : defaultPath;
  const file = remoteFile ? remoteFile : defaultFile;
  const svgPath = path + file;
  return svgPath;
};

Utils.getLicenseServer = function () {
  var server = "";
  if (!AppStore.appStaticInfo.isToken()) {
    server = AppStore.wsData._SRV_LICENSE_SERVER;

    var accNumber = AppStore.login.getAccountNumber();
    server = server.replace("{ORIGIN}", AppStore.login.getOrigin());
    server = server.replace("{ACCOUNTNUMBER}", accNumber);
    server = server.replace("{DUID}", AppStore.device.getDevUID());
  } else {
    server = AppStore.wsData._SRV_LICENSE_SERVER_PR;
  }
  return server;
};

Utils.getNativeLicenseServer = function () {
  var server = "";
  if (!AppStore.appStaticInfo.isToken()) {
    server = AppStore.wsData._SRV_LICENSE_SERVER;
    var accNumber = AppStore.login.getAccountNumber();
    server = server.replace("{ORIGIN}", AppStore.login.getOrigin());
    server = server.replace("{ACCOUNTNUMBER}", accNumber);
    server = server.replace("{DUID}", AppStore.device.getDevUID());
  } else {
    server = AppStore.wsData._SRV_LICENSE_SERVER_TK;
  }
  return server;
};

Utils.getEventEPG = async function (showId) {
  return await MitoAPI.instance.getEventEPG(showId);
};
