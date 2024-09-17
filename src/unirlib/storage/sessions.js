import { AppStore } from "src/code/managers/store/app-store";
import { debug } from "@unirlib/utils/debug";

export const sessions = function () {
  this._fileName = "sessions.db";

  /* Manejo de sessions por usuario */
  this._index_ses = -1;

  this._col_sessions = new Array(); /* Es un array normal de json */
  this._json_sessions = null; /* Es el JSON de sessions */

  sessions.prototype.deleteSessions = function () {
    debug.alert("sessions.prototype.deleteSessions");
    AppStore.fileUtils.deleteJSON(this._fileName);
    this.readSessions();
  };

  sessions.prototype.readSessions = function () {
    this._json_sessions = AppStore.fileUtils.readJSON(this._fileName);
    debug.alert("sessions.prototype.readSessions: " + this._fileName + " " + JSON.stringify(this._json_sessions));

    if (this._json_sessions != null && this._json_sessions.Sessions != null) this.generarArraySessions();
    else {
      this._col_sessions = new Array();
      this.buildJSON();
    }
  };

  sessions.prototype.debug = function () {
    debug.alert("#");
    debug.alert("sessions.prototype.debug sessions= " + JSON.stringify(this._json_sessions));
    debug.alert("#");
  };

  sessions.prototype.debugSel = function () {
    debug.alert("sessions.prototype.debugSel User : " + this._json_sessions.User);
    debug.alert("sessions.prototype.debugSel Sess : " + this._json_sessions.Session);
  };

  sessions.prototype.getSessionUser = function (usuario) {
    debug.alert("sessions.prototype.getSessionUser usuario: " + usuario);
    this.cargarSessionUsuario(usuario);
    if (this._json_sessions == null) return null;
    return this._json_sessions.Session;
  };

  sessions.prototype.saveSessions = function () {
    debug.alert("sessions.prototype.saveSessions");
    this.buildJSON();
    AppStore.fileUtils.saveJSON(this._fileName, this._json_sessions);
  };

  sessions.prototype.generarArraySessions = function () {
    var prefs = this._json_sessions.Sessions;
    var nprefs = this._json_sessions.Sessions.length;
    for (var i = 0; i < nprefs; i++) this._col_sessions[i] = prefs[i];
  };

  sessions.prototype.buildJSON = function () {
    this._json_sessions = { Sessions: this._col_sessions };
  };

  sessions.prototype.newSession = function () {
    var session = { User: null, Session: null };
    return session;
  };

  sessions.prototype.getSession = function (usuario) {
    debug.alert("sessions.prototype.getSession usuario " + usuario);
    var index = 0;
    var exito = false;
    var nprefs = this._col_sessions.length;
    debug.alert("sessions.prototype.getSession this._col_sessions.length = " + this._col_sessions.length);
    if (nprefs != 0) {
      while (!exito && index < nprefs) {
        debug.alert(
          " --------------- sessions.prototype.getSession this._col_sessions[index] = " +
            JSON.stringify(this._col_sessions[index])
        );
        debug.alert(' --------------- sessions.prototype.getSession ["User"] = ' + this._col_sessions[index]["User"]);
        debug.alert(" --------------- sessions.prototype.getSession usuario = " + usuario);
        exito = this._col_sessions[index]["User"] == usuario;
        debug.alert(" --------------- sessions.prototype.getSession exito = " + exito);
        if (!exito) index++;
      }
      if (exito) {
        this._index_ses = index;
        this._json_sessions = this._col_sessions[index];
        debug.alert(" --------------- sessions.prototype.getSession this._index_ses = " + this._index_ses);
        debug.alert(
          " --------------- sessions.prototype.getSession this._json_sessions = " + JSON.stringify(this._json_sessions)
        );
      }
    }

    debug.alert("sessions.prototype.getSession exito = " + exito);
    return exito;
  };

  sessions.prototype.cargarSessionUsuario = function (user) {
    debug.alert("sessions.prototype.cargarSessionUsuario");
    var hay_usuario = this.getSession(user);
    if (!hay_usuario) {
      this.newSession();
      this.insertSession(user, null);
    }
    return hay_usuario;
  };

  sessions.prototype.insertSession = function (user, ses) {
    debug.alert("sessions.prototype.insertSession user: " + user + ", session: " + ses);
    var sesion = this.newSession();
    sesion.User = user;
    sesion.Session = ses;

    if (!this.getSession(user)) {
      this._col_sessions[this._col_sessions.length] = sesion;
      this._index_ses = this._col_sessions.length;
    } else {
      this._col_sessions[this._index_ses] = sesion;
    }
  };

  sessions.prototype.deleteSession = function (usuario) {
    debug.alert("sessions.prototype.deleteSession");
    var index = 0;
    var exito = false;
    if (this._col_sessions.length != 0) {
      while (!exito && index < this._col_sessions.length) {
        exito = this._col_sessions[index]["User"] == usuario;
        if (!exito) {
          index++;
        }
      }
      if (exito) {
        this._col_sessions.splice(index, 1);
      }
    }
  };

  sessions.prototype.setSession = function (data) {
    debug.alert("sessions.prototype.setSession");
    this._json_sessions.Session = data;
  };
};
