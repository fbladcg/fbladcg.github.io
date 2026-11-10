// =============================================================
//  Fechas de eventos en español (lo usan la página y el panel).
//  Tipos de fecha de un evento (campo "tipo_fecha"):
//    "dia"       → inicio: "2026-12-11"
//    "rango"     → inicio: "2027-04-05", fin: "2027-04-07"
//    "mes"       → mes: "2027-01"
//    "pendiente" → fecha_texto: "Por anunciar" (texto libre)
//  No necesitas editar este archivo.
// =============================================================

(function (global) {
  "use strict";

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DIAS_CORTOS = ["D", "L", "M", "M", "J", "V", "S"];   // la semana empieza en domingo
  var DIA_MS = 86400000;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function aISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function deISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function deMes(s) {
    var m = /^(\d{4})-(\d{2})$/.exec(String(s || "").trim());
    return m && +m[2] >= 1 && +m[2] <= 12 ? { y: +m[1], m: +m[2] - 1 } : null;
  }

  function largo(d) { return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }
  function textoMes(o) { return mayus(MESES[o.m]) + " de " + o.y; }

  // ---------- Entender fechas escritas a mano (eventos viejos) ----------
  function numMes(nombre) {
    var n = String(nombre || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\.$/, "");
    if (n === "setiembre") n = "septiembre";
    for (var i = 0; i < 12; i++) if (MESES[i] === n || MESES_CORTOS[i] === n || (n.length >= 3 && MESES[i].indexOf(n) === 0)) return i;
    return -1;
  }

  function desdeTexto(texto) {
    var s = String(texto || "").trim().toLowerCase().replace(/\s+/g, " ");
    var M = "([a-záéíóúñ.]+)";
    var SEP = "\\s*(?:-|–|—|al|a)\\s*";
    var DE = "(?:\\s+de|,)?\\s+";
    var m, mi, mf;
    // 5 - 7 de abril de 2027
    if ((m = new RegExp("^(\\d{1,2})" + SEP + "(\\d{1,2})\\s+de\\s+" + M + DE + "(\\d{4})$").exec(s)) && (mi = numMes(m[3])) >= 0) {
      return { tipo_fecha: "rango", inicio: aISO(new Date(+m[4], mi, +m[1])), fin: aISO(new Date(+m[4], mi, +m[2])) };
    }
    // 28 de marzo - 2 de abril de 2027
    if ((m = new RegExp("^(\\d{1,2})\\s+de\\s+" + M + SEP + "(\\d{1,2})\\s+de\\s+" + M + DE + "(\\d{4})$").exec(s)) &&
        (mi = numMes(m[2])) >= 0 && (mf = numMes(m[4])) >= 0) {
      return { tipo_fecha: "rango", inicio: aISO(new Date(+m[5], mi, +m[1])), fin: aISO(new Date(+m[5], mf, +m[3])) };
    }
    // 11 de diciembre de 2026
    if ((m = new RegExp("^(\\d{1,2})\\s+de\\s+" + M + DE + "(\\d{4})$").exec(s)) && (mi = numMes(m[2])) >= 0) {
      return { tipo_fecha: "dia", inicio: aISO(new Date(+m[3], mi, +m[1])) };
    }
    // Enero 2027 / enero de 2027
    if ((m = new RegExp("^" + M + DE + "(\\d{4})$").exec(s)) && (mi = numMes(m[1])) >= 0) {
      return { tipo_fecha: "mes", mes: m[2] + "-" + pad(mi + 1) };
    }
    return { tipo_fecha: "pendiente", fecha_texto: String(texto || "").trim() || "Por anunciar" };
  }

  // Devuelve la fecha del evento ya interpretada.
  function leer(ev) {
    ev = ev || {};
    var tipo = ev.tipo_fecha;
    var datos = ev;
    if (["dia", "rango", "mes", "pendiente"].indexOf(tipo) < 0) { datos = desdeTexto(ev.fecha); tipo = datos.tipo_fecha; }
    var r = { tipo: tipo };
    if (tipo === "dia" || tipo === "rango") {
      r.inicio = deISO(datos.inicio);
      r.fin = tipo === "rango" ? deISO(datos.fin) : r.inicio;
      if (!r.inicio) return { tipo: "pendiente", texto: "Por anunciar" };
      if (!r.fin || r.fin < r.inicio) r.fin = r.inicio;
      if (tipo === "rango" && r.fin.getTime() === r.inicio.getTime()) r.tipo = "dia";
    } else if (tipo === "mes") {
      r.mes = deMes(datos.mes);
      if (!r.mes) return { tipo: "pendiente", texto: "Por anunciar" };
    } else {
      r.texto = String(datos.fecha_texto || "").trim() || "Por anunciar";
    }
    return r;
  }

  // Texto para mostrar: "5 – 7 de abril de 2027"
  function texto(ev) {
    var f = leer(ev);
    if (f.tipo === "dia") return largo(f.inicio);
    if (f.tipo === "rango") {
      var a = f.inicio, b = f.fin;
      if (a.getFullYear() !== b.getFullYear()) return largo(a) + " – " + largo(b);
      if (a.getMonth() !== b.getMonth()) return a.getDate() + " de " + MESES[a.getMonth()] + " – " + largo(b);
      return a.getDate() + " – " + largo(b);
    }
    if (f.tipo === "mes") return textoMes(f.mes);
    return f.texto;
  }

  // Lo que va en el recuadro de la fecha: { grande, chico }
  function caja(ev) {
    var f = leer(ev);
    if (f.tipo === "dia") return { grande: String(f.inicio.getDate()), chico: MESES_CORTOS[f.inicio.getMonth()] + " " + f.inicio.getFullYear() };
    if (f.tipo === "rango") {
      var a = f.inicio, b = f.fin;
      if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
        return { grande: a.getDate() + "–" + b.getDate(), chico: MESES_CORTOS[a.getMonth()] + " " + a.getFullYear() };
      }
      return { grande: a.getDate() + " " + MESES_CORTOS[a.getMonth()] + " – " + b.getDate() + " " + MESES_CORTOS[b.getMonth()], chico: String(b.getFullYear()), largo: true };
    }
    // Sin día exacto: el mes va abajo (dorado, como en los demás eventos) y arriba un calendario.
    if (f.tipo === "mes") return { grande: "📅", chico: MESES_CORTOS[f.mes.m] + " " + f.mes.y };
    return { grande: "📅", chico: f.texto };
  }

  // "9:00 am", "2:30 PM", "14:30" → { h, m }
  function leerHora(t) {
    var m = /(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?/i.exec(String(t || ""));
    if (!m) return null;
    var h = +m[1], min = +(m[2] || 0);
    if (m[3]) { var pm = m[3].toLowerCase() === "p"; if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; }
    return h < 24 && min < 60 ? { h: h, m: min } : null;
  }

  // Estado del evento respecto a hoy, para la cuenta regresiva.
  function estado(ev, ahora) {
    ahora = ahora || new Date();
    var f = leer(ev);
    var hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    if (f.tipo === "dia" || f.tipo === "rango") {
      var dias = Math.round((f.inicio - hoy) / DIA_MS);
      var finDias = Math.round((f.fin - hoy) / DIA_MS);
      var objetivo = new Date(f.inicio);
      var hora = leerHora(ev.hora);
      if (hora) objetivo.setHours(hora.h, hora.m, 0, 0);
      if (finDias < 0) return { tipo: "pasado" };
      if (dias <= 0) return f.tipo === "rango" ? { tipo: "encurso", fin: f.fin, ultimo: finDias === 0 } : { tipo: "hoy", objetivo: objetivo };
      return { tipo: dias === 1 ? "manana" : "futuro", dias: dias, objetivo: objetivo };
    }
    if (f.tipo === "mes") {
      var dif = (f.mes.y - ahora.getFullYear()) * 12 + (f.mes.m - ahora.getMonth());
      return { tipo: dif === 0 ? "estemes" : dif > 0 ? "mesfuturo" : "pasado" };
    }
    return { tipo: "pendiente" };
  }

  // ---------- Año académico (agosto a julio) ----------
  function anioAcademicoDe(fecha) {
    var y = fecha.getFullYear();
    return fecha.getMonth() >= 7 ? y + "-" + (y + 1) : (y - 1) + "-" + y;
  }
  function anioAcademicoActual() { return anioAcademicoDe(new Date()); }

  // Adivina el año académico de un logro por su texto ("2026-2027", "septiembre 2026", "2026").
  function anioAcademicoDeTexto(texto) {
    var s = String(texto || "").toLowerCase();
    var m = /(20\d{2})\s*[-–\/]\s*(20\d{2})/.exec(s);
    if (m && +m[2] === +m[1] + 1) return m[1] + "-" + m[2];
    var n = new RegExp("(" + MESES.join("|") + ")(?:\\s+de)?\\s+(20\\d{2})").exec(s.normalize("NFD").replace(/[̀-ͯ]/g, ""));
    if (n) return anioAcademicoDe(new Date(+n[2], MESES.indexOf(n[1]), 15));
    m = /\b(20\d{2})\b/.exec(s);
    if (m) {
      // Solo el año: si es el año calendario actual o el anterior, se usa el año académico que lo incluye en otoño.
      var y = +m[1];
      return y + "-" + (y + 1);
    }
    return "";
  }

  function aniosAcademicos(desde) {
    var actual = anioAcademicoActual();
    var fin = +actual.split("-")[1];
    var lista = [];
    for (var y = fin; y > (desde || 2015); y--) lista.push((y - 1) + "-" + y);
    return lista;
  }

  global.FechasFBLA = {
    anioAcademicoDe: anioAcademicoDe, anioAcademicoActual: anioAcademicoActual,
    anioAcademicoDeTexto: anioAcademicoDeTexto, aniosAcademicos: aniosAcademicos,
    MESES: MESES, MESES_CORTOS: MESES_CORTOS, DIAS_CORTOS: DIAS_CORTOS,
    aISO: aISO, deISO: deISO, deMes: deMes, largo: largo, textoMes: textoMes,
    desdeTexto: desdeTexto, leer: leer, texto: texto, caja: caja, estado: estado, leerHora: leerHora,
    corto: function (d) { return d.getDate() + " de " + MESES[d.getMonth()]; }
  };
})(window);
