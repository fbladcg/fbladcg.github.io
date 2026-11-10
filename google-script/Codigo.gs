/**
 * =============================================================
 *  FBLA 3281 — Fotos de miembros, conteo de visitas y
 *  sugerencias de eventos/logros desde Instagram
 *  Este script vive en Google Apps Script (script.google.com).
 *  Guarda las fotos que envían los miembros en una carpeta
 *  PRIVADA de Google Drive hasta que el admin las aprueba en el
 *  Panel de edición.
 *
 *  INSTALACIÓN (una sola vez): ver GUIA.md, parte D.
 *
 *  ¿Quién puede aprobar? Solo quien entre al panel con un token de
 *  GitHub que tenga permiso para escribir en el repositorio de la
 *  página. El script se lo pregunta a GitHub; no hay claves extra.
 *
 *  Opcional (Configuración del proyecto ⚙ → Propiedades de la
 *  secuencia de comandos):
 *    CODIGO_MIEMBROS = código que los miembros deben escribir para
 *                      enviar fotos. Si no existe, no se pide código.
 * =============================================================
 */

var REPO = 'fbladcg/fbladcg.github.io';       // repositorio de la página
var NOMBRE_CARPETA = 'FBLA 3281 - Fotos de miembros';
var MAX_PENDIENTES = 300;                     // límite de fotos esperando aprobación

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.accion === 'visita') {
    registrarVisita(p.p);
    // Aprovecha las visitas para revisar Instagram una vez al día.
    try { revisarInstagramSiToca(false); } catch (err) {}
    return salida({ ok: true });
  }
  var codigo = PropertiesService.getScriptProperties().getProperty('CODIGO_MIEMBROS');
  return salida({ ok: true, servicio: 'Fotos de FBLA 3281', pideCodigo: !!(codigo && codigo.trim()) });
}

// ---------- Conteo de visitas (sin cookies ni datos personales) ----------
// Se guarda: total, visitas por día (último año) y visitas por página.
function registrarVisita(pagina) {
  pagina = String(pagina || 'inicio').replace(/[^\w:\-]/g, '').slice(0, 60) || 'inicio';
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var v = leerVisitas(props);
    var hoy = Utilities.formatDate(new Date(), 'America/Puerto_Rico', 'yyyy-MM-dd');
    if (pagina === 'inicio') {
      v.total = (v.total || 0) + 1;
      v.dias[hoy] = (v.dias[hoy] || 0) + 1;
    }
    v.paginas[pagina] = (v.paginas[pagina] || 0) + 1;
    // Guardar solo los últimos 400 días y las 60 páginas más vistas
    var dias = Object.keys(v.dias).sort();
    while (dias.length > 400) delete v.dias[dias.shift()];
    var pags = Object.keys(v.paginas).sort(function (a, b) { return v.paginas[b] - v.paginas[a]; });
    pags.slice(60).forEach(function (k) { delete v.paginas[k]; });
    props.setProperty('VISITAS', JSON.stringify(v));
  } finally {
    lock.releaseLock();
  }
}

function leerVisitas(props) {
  var v = {};
  try { v = JSON.parse(props.getProperty('VISITAS') || '{}'); } catch (e) {}
  v.total = v.total || 0; v.dias = v.dias || {}; v.paginas = v.paginas || {};
  return v;
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var r;
    if (d.accion === 'subir') {
      r = subir(d);
    } else {
      verificarAdmin(d.token);
      if (d.accion === 'pendientes') r = pendientes();
      else if (d.accion === 'foto') r = foto(d.id);
      else if (d.accion === 'vista') r = vista(d.id, d.lado);
      else if (d.accion === 'resolver') r = resolver(d.id, d.aprobar === true);
      else if (d.accion === 'visitas') r = { visitas: leerVisitas(PropertiesService.getScriptProperties()),
        hoy: Utilities.formatDate(new Date(), 'America/Puerto_Rico', 'yyyy-MM-dd') };
      else if (d.accion === 'sugerencias') r = listarSugerencias(d.forzar === true);
      else if (d.accion === 'resolverSugerencia') r = resolverSugerencia(d.id);
      else throw new Error('Acción desconocida.');
    }
    r = r || {};
    r.ok = true;
    return salida(r);
  } catch (err) {
    return salida({ ok: false, error: String((err && err.message) || err) });
  }
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Le pregunta a GitHub si el token puede escribir en el repositorio de la página.
// El resultado se recuerda 10 minutos para no preguntar en cada foto.
function verificarAdmin(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('No autorizado: entra al panel con tu token de GitHub.');
  var huella = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var cache = CacheService.getScriptCache();
  if (cache.get('ok_' + huella)) return;

  var r = UrlFetchApp.fetch('https://api.github.com/repos/' + REPO, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  });
  var permisos = null;
  if (r.getResponseCode() === 200) {
    try { permisos = JSON.parse(r.getContentText()).permissions; } catch (e) {}
  }
  if (!permisos || !(permisos.push || permisos.maintain || permisos.admin)) {
    throw new Error('No autorizado: tu token de GitHub no tiene permiso para editar la página.');
  }
  cache.put('ok_' + huella, '1', 600);
}

function carpeta(nombre) {
  var raiz = obtener(DriveApp.getRootFolder(), NOMBRE_CARPETA);
  return nombre ? obtener(raiz, nombre) : raiz;
}

function obtener(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

function limpio(texto, max) {
  return String(texto || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function subir(d) {
  var codigo = PropertiesService.getScriptProperties().getProperty('CODIGO_MIEMBROS');
  if (codigo && codigo.trim() && limpio(d.codigo, 100).toLowerCase() !== codigo.trim().toLowerCase()) {
    throw new Error('El código del capítulo no es correcto.');
  }
  if (!/^image\/(jpeg|png)$/.test(String(d.tipo))) throw new Error('Solo se aceptan fotos JPG o PNG.');
  if (!limpio(d.nombre, 80)) throw new Error('Escribe tu nombre.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var dest = carpeta('Pendientes');
    var n = 0, it = dest.getFiles();
    while (it.hasNext()) { it.next(); n++; }
    if (n >= MAX_PENDIENTES) throw new Error('Hay demasiadas fotos esperando aprobación. Inténtalo más tarde.');

    var bytes = Utilities.base64Decode(String(d.datos || ''));
    if (!bytes.length) throw new Error('La foto llegó vacía.');

    var nombre = Utilities.formatDate(new Date(), 'America/Puerto_Rico', 'yyyyMMdd-HHmmss') + '-' +
      limpio(d.archivo, 60).replace(/[^\w.\-]/g, '_');
    var archivo = dest.createFile(Utilities.newBlob(bytes, d.tipo, nombre));
    archivo.setDescription(JSON.stringify({
      album: limpio(d.album, 80),
      albumTitulo: limpio(d.albumTitulo, 120),
      nombre: limpio(d.nombre, 80),
      nota: limpio(d.nota, 300),
      archivo: limpio(d.archivo, 80),
      fecha: new Date().toISOString()
    }));
  } finally {
    lock.releaseLock();
  }
  return {};
}

function pendientes() {
  var fotos = [];
  var it = carpeta('Pendientes').getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var meta = {};
    try { meta = JSON.parse(f.getDescription() || '{}'); } catch (e) {}
    meta.id = f.getId();
    meta.tamano = f.getSize();
    fotos.push(meta);
  }
  fotos.sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
  return { fotos: fotos };
}

function archivoPendiente(id) {
  var f = DriveApp.getFileById(String(id));
  var padres = f.getParents();
  var pend = carpeta('Pendientes').getId();
  while (padres.hasNext()) if (padres.next().getId() === pend) return f;
  throw new Error('Esa foto ya no está pendiente.');
}

function foto(id) {
  var f = archivoPendiente(id);
  var blob = f.getBlob();
  return { tipo: blob.getContentType(), datos: Utilities.base64Encode(blob.getBytes()) };
}

// Vista previa más liviana (para el panel): la miniatura de Drive en el tamaño pedido.
// Si Drive todavía no la tiene lista, se manda la foto original.
function vista(id, lado) {
  var f = archivoPendiente(id);
  lado = Math.max(200, Math.min(1200, Number(lado) || 600));
  try {
    var token = ScriptApp.getOAuthToken();
    var opciones = { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true };
    var meta = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + f.getId() + '?fields=thumbnailLink', opciones).getContentText());
    if (meta.thumbnailLink) {
      var r = UrlFetchApp.fetch(meta.thumbnailLink.replace(/=s\d+[^=]*$/, '') + '=s' + lado, opciones);
      if (r.getResponseCode() === 200) {
        var b = r.getBlob();
        return { tipo: b.getContentType() || 'image/jpeg', datos: Utilities.base64Encode(b.getBytes()), vista: true };
      }
    }
  } catch (e) {}
  return foto(id);
}

// Aprobada o rechazada, la foto sale de Drive (va a la papelera; Google la borra a los 30 días).
// Las aprobadas ya quedaron guardadas en la página, así que no hace falta conservarlas aquí.
function resolver(id, aprobar) {
  var f = archivoPendiente(id);
  f.setTrashed(true);
  return { aprobada: aprobar };
}

// =============================================================
//  Sugerencias desde Instagram (eventos y logros)
//  Una vez al día lee las publicaciones nuevas del feed de Behold
//  (el mismo que usa la página) y propone eventos y logros.
//  El admin las revisa, edita y aprueba en el panel.
// =============================================================
var PAGINA = 'https://fbladcg.github.io/';
var ARCHIVO_SUGERENCIAS = 'sugerencias-instagram.json';
var MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function leerSugerencias() {
  var it = carpeta().getFilesByName(ARCHIVO_SUGERENCIAS);
  var estado = { vistos: {}, pendientes: [], ultima: 0 };
  if (it.hasNext()) {
    try { estado = JSON.parse(it.next().getBlob().getDataAsString('UTF-8')); } catch (e) {}
  }
  estado.vistos = estado.vistos || {}; estado.pendientes = estado.pendientes || []; estado.ultima = estado.ultima || 0;
  return estado;
}

function guardarSugerencias(estado) {
  // Solo se recuerdan las últimas 300 publicaciones vistas y 40 sugerencias pendientes.
  var ids = Object.keys(estado.vistos).sort(function (a, b) { return estado.vistos[a] - estado.vistos[b]; });
  while (ids.length > 300) delete estado.vistos[ids.shift()];
  estado.pendientes = estado.pendientes.slice(-40);
  var texto = JSON.stringify(estado);
  var it = carpeta().getFilesByName(ARCHIVO_SUGERENCIAS);
  if (it.hasNext()) it.next().setContent(texto);
  else carpeta().createFile(ARCHIVO_SUGERENCIAS, texto, 'application/json');
}

function revisarInstagramSiToca(forzar) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { revisado: false };
  try {
    var estado = leerSugerencias();
    if (!forzar && Date.now() - estado.ultima < 20 * 3600 * 1000) return { revisado: false };
    estado.ultima = Date.now();
    var r = revisarInstagram(estado);
    guardarSugerencias(estado);
    return r;
  } finally {
    lock.releaseLock();
  }
}

function revisarInstagram(estado) {
  var yml = UrlFetchApp.fetch(PAGINA + 'contenido.yml?x=' + Date.now(), { muteHttpExceptions: true }).getContentText('UTF-8');
  var m = /behold:\s*"?(https:\/\/feeds\.behold\.so\/[\w-]+)/.exec(yml);
  if (!m) return { revisado: true, nuevas: 0, aviso: 'No hay feed de Behold configurado en el panel (📷 Instagram).' };
  var feed = JSON.parse(UrlFetchApp.fetch(m[1], { muteHttpExceptions: true }).getContentText('UTF-8'));
  var posts = Array.isArray(feed) ? feed : (feed.posts || []);
  var existente = normalizar(yml);
  var nuevas = 0;
  posts.forEach(function (p) {
    if (!p || !p.id || estado.vistos[p.id]) return;
    estado.vistos[p.id] = Date.now();
    analizarPublicacion(p, existente).forEach(function (s) { estado.pendientes.push(s); nuevas++; });
  });
  return { revisado: true, nuevas: nuevas };
}

function normalizar(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function sinAdornos(t) {
  return String(t || '')
    .replace(/[\p{Extended_Pictographic}️‍⃣]/gu, '')
    .replace(/[#@][\w.áéíóúñÁÉÍÓÚÑ]+/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Primera línea con texto, limpia y corta.
function tituloDe(texto) {
  var lineas = sinAdornos(texto).split(/\n+/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 3; });
  var t = lineas[0] || 'Publicación de Instagram';
  t = t.replace(/^[¡!.,:\-–\s]+/, '¡').replace(/^¡(?=[^!]*$)/, '');
  if (t.length > 110) t = t.slice(0, 107).replace(/\s+\S*$/, '') + '…';
  return t;
}

function iso(d) { return Utilities.formatDate(d, 'America/Puerto_Rico', 'yyyy-MM-dd'); }

// Busca la fecha de un evento en el texto (relativa a la fecha de la publicación).
function buscarFecha(texto, base) {
  var t = normalizar(texto);
  var M = '(' + MESES_ES.join('|') + ')';
  var y0 = base.getFullYear();
  function armar(d, mes, y) {
    var anio = y ? +y : y0;
    var f = new Date(anio, mes, d);
    if (!y && f < new Date(base.getFullYear(), base.getMonth(), base.getDate() - 2)) f = new Date(anio + 1, mes, d);
    return f;
  }
  var m;
  if ((m = new RegExp('(\\d{1,2}) (?:al|a|y) (\\d{1,2}) de ' + M + '(?: de (\\d{4}))?').exec(t))) {
    var mi = MESES_ES.indexOf(m[3]);
    var a = armar(+m[1], mi, m[4]), b = new Date(a.getFullYear(), mi, +m[2]);
    return { tipo_fecha: 'rango', inicio: iso(a), fin: iso(b), fecha: a };
  }
  if ((m = new RegExp('(\\d{1,2}) de ' + M + '(?: de (\\d{4}))?').exec(t))) {
    var f = armar(+m[1], MESES_ES.indexOf(m[2]), m[3]);
    return { tipo_fecha: 'dia', inicio: iso(f), fecha: f };
  }
  if ((m = new RegExp('(?:en|durante|mes de) ' + M + '(?: de (\\d{4}))?').exec(t))) {
    var mes = MESES_ES.indexOf(m[1]);
    var y = m[2] ? +m[2] : (mes < base.getMonth() ? y0 + 1 : y0);
    return { tipo_fecha: 'mes', mes: y + '-' + ('0' + (mes + 1)).slice(-2), fecha: new Date(y, mes, 28) };
  }
  return null;
}

function analizarPublicacion(p, existente) {
  var texto = String(p.caption || '');
  if (!texto.trim()) return [];
  var base = new Date(p.timestamp || Date.now());
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var titulo = tituloDe(texto);
  var imagen = (p.sizes && p.sizes.small && p.sizes.small.mediaUrl) || p.thumbnailUrl || p.mediaUrl || '';
  var post = { permalink: p.permalink || '', fecha: p.timestamp || '', texto: texto.slice(0, 700), imagen: imagen };
  var res = [];

  var norm = normalizar(texto);
  // FBLA premia hasta el Top 10: 1er..10mo lugar, en número o en palabra.
  var LUGAR = '(?:(?:[1-9]|10) ?(?:er|ro|do|to|vo|mo|no|o)?|primer|primero|segundo|tercer|tercero|cuarto|quinto|sexto|septimo|octavo|noveno|decimo) lugar';
  var esLogro = new RegExp('(felicit|reconoc|premi|ganador|ganamos|gano|ganaron|' + LUGAR + '|top ?10|top ?diez|champion|campeon|medalla|trofeo|member of the month|miembro del mes|distincion|honor|se destaca|nos destacamos|logramos|clasific|finalista)').test(norm);
  var competencia = buscarCompetencia(norm);
  if ((esLogro || competencia) && existente.indexOf(normalizar(titulo).slice(0, 30)) < 0) {
    var cuando = MESES_ES[base.getMonth()];
    var lugar = new RegExp(LUGAR).exec(norm);
    res.push({ id: p.id + '-logro', tipo: 'logro', titulo: titulo, competencia: competencia,
      detalle: (lugar ? lugar[0].replace(/\b\w/, function (c) { return c.toUpperCase(); }) + ' · ' : '') +
        cuando.charAt(0).toUpperCase() + cuando.slice(1) + ' ' + base.getFullYear(),
      anio_academico: base.getMonth() >= 7 ? base.getFullYear() + '-' + (base.getFullYear() + 1) : (base.getFullYear() - 1) + '-' + base.getFullYear(),
      post: post });
  }

  var f = buscarFecha(texto, base);
  var pareceEvento = /(nos vemos|se acerca|proxim|invit|particip|reunion|actividad|evento|conferencia|competenc|taller|venta|feria|celebr|day|semana|casa abierta|registr|ponte|no faltes|te esperamos|acompan|fecha)/.test(normalizar(texto));
  if (f && pareceEvento && f.fecha >= hoy) {
    var hora = /(\d{1,2}(?::\d{2})?\s*(?:a\.?\s?m\.?|p\.?\s?m\.?))/i.exec(texto);
    var ev = { id: p.id + '-evento', tipo: 'evento', nombre: titulo, tipo_fecha: f.tipo_fecha,
      hora: hora ? hora[1].replace(/\s+/g, ' ').toUpperCase().replace(/\./g, '') : '', lugar: '', descripcion: '', post: post };
    if (f.inicio) ev.inicio = f.inicio;
    if (f.fin) ev.fin = f.fin;
    if (f.mes) ev.mes = f.mes;
    res.push(ev);
  }
  return res;
}

// Eventos competitivos oficiales de FBLA (High School 2026-2027). Igual que competencias.js.
var COMPETENCIAS = ["Accounting", "Advanced Accounting", "Advertising", "Agribusiness", "Banking & Financial Systems",
  "Broadcast Journalism", "Business Communication", "Business Ethics", "Business Law", "Business Management",
  "Business Plan", "Career Portfolio", "Coding & Programming", "Community Service Project", "Computer Applications",
  "Computer Game & Simulation Programming", "Computer Problem Solving", "Customer Service", "Cybersecurity",
  "Data Analysis", "Data Science & AI", "Digital Animation", "Digital Video Production", "Economics",
  "Entrepreneurship", "Event Planning", "Financial Planning", "Financial Statement Analysis",
  "Future Business Educator", "Future Business Leader", "Graphic Design", "Healthcare Administration",
  "Hospitality & Event Management", "Human Resource Management", "Impromptu Speaking",
  "Insurance & Risk Management", "International Business", "Introduction to Business Communication",
  "Introduction to Business Concepts", "Introduction to Business Presentation", "Introduction to Business Procedures",
  "Introduction to FBLA", "Introduction to Information Technology", "Introduction to Marketing Concepts",
  "Introduction to Parliamentary Procedure", "Introduction to Programming", "Introduction to Public Speaking",
  "Introduction to Retail & Merchandising", "Introduction to Social Media Strategy",
  "Introduction to Supply Chain Management", "Job Interview", "Journalism", "Local Chapter Annual Business Report",
  "Management Information Systems", "Marketing", "Mobile Application Development", "Network Design",
  "Networking Infrastructures", "Organizational Leadership", "Parliamentary Procedure", "Personal Finance",
  "Project Management", "Public Administration & Management", "Public Service Announcement", "Public Speaking",
  "Real Estate", "Retail Management", "Sales Presentation", "Securities & Investments", "Social Media Strategies",
  "Sports & Entertainment Management", "Supply Chain Management", "Technology Support & Services", "Visual Design",
  "Website Coding & Development", "Website Design"];

// Devuelve el nombre de la competencia mencionada (la más larga que coincida), o "".
function buscarCompetencia(textoNormalizado) {
  var mejor = '';
  COMPETENCIAS.forEach(function (c) {
    var n = normalizar(c.replace(/&/g, 'and'));
    var n2 = normalizar(c.replace(/&/g, ''));
    var t = ' ' + textoNormalizado.replace(/\band\b/g, 'and') + ' ';
    if ((t.indexOf(' ' + n + ' ') >= 0 || t.indexOf(' ' + n2 + ' ') >= 0) && c.length > mejor.length) mejor = c;
  });
  // "Marketing" o "Economics" solos son muy comunes: solo cuentan si se habla de competir o de un lugar.
  if (['Marketing', 'Economics', 'Journalism', 'Accounting', 'Advertising', 'Cybersecurity', 'Entrepreneurship'].indexOf(mejor) >= 0 &&
      !/(lugar|compet|evento competitivo|slc|nlc|conferencia|regional|estatal|nacional)/.test(textoNormalizado)) return '';
  return mejor;
}

function listarSugerencias(forzar) {
  var r = revisarInstagramSiToca(forzar) || {};
  var estado = leerSugerencias();
  return { sugerencias: estado.pendientes, ultima: estado.ultima, nuevas: r.nuevas || 0, aviso: r.aviso || '' };
}

function resolverSugerencia(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var estado = leerSugerencias();
    estado.pendientes = estado.pendientes.filter(function (s) { return s.id !== id; });
    guardarSugerencias(estado);
  } finally {
    lock.releaseLock();
  }
  return {};
}

// Ejecuta esta función UNA VEZ desde el editor (▷ Ejecutar) para darle al
// script los permisos de Drive y de conectarse con GitHub.
function autorizar() {
  UrlFetchApp.fetch('https://api.github.com/zen');
  carpeta('Pendientes');
  Logger.log('¡Listo! Permisos concedidos.');
}
