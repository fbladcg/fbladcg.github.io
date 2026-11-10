// =============================================================
//  Panel de edición de la página FBLA 3281.
//  Lee y guarda "contenido.yml" y las fotos en GitHub usando una
//  llave (token). No necesitas editar este archivo.
// =============================================================

(function () {
  "use strict";

  // Usuario y repositorio de GitHub donde vive la página.
  var CONFIG = { owner: "fbladcg", repo: "fbladcg.github.io" };

  var ARCHIVO = "contenido.yml";
  var CLAVE_LS = "fbla3281-panel";
  var CLAVE_LS_APROBAR = "fbla3281-clave-aprobacion";
  var CLAVE_LS_PESTANA = "fbla3281-pestana";
  var MAX_LADO = 2000;   // tamaño máximo (px) de las fotos que se suben
  var CABECERA =
    "# ==============================================================\n" +
    "#   CONTENIDO DE LA PÁGINA WEB — FBLA Capítulo 3281\n" +
    "#   Este archivo se edita desde el Panel de edición (admin.html).\n" +
    "#   No hace falta editarlo a mano.\n" +
    "# ==============================================================\n\n";

  var CAMPOS_FOTO_ALBUM = [
    { k: "foto", l: "Foto", tipo: "foto" },
    { k: "descripcion", l: "Descripción" },
    { k: "autor", l: "Autor" }
  ];

  // ---------- Partes de la página y sus campos ----------
  // Grupos del menú lateral (el orden de aquí es el orden del menú).
  var GRUPOS = [
    { nombre: "", keys: ["_inicio"] },
    { nombre: "Contenido", keys: ["anuncios", "eventos", "logros", "documentos"] },
    { nombre: "Fotos", keys: ["albumes", "subidas"] },
    { nombre: "Instagram", keys: ["_sugerencias", "instagram"] },
    { nombre: "Página", keys: ["capitulo", "sobre_nosotros", "directiva", "contacto"] },
    { nombre: "Estadísticas", keys: ["_visitas"] }
  ];

  var SECCIONES = [
    { key: "_inicio", titulo: "🏠 Inicio", tipo: "resumen",
      ayuda: "Resumen de la página y accesos rápidos." },
    { key: "anuncios", titulo: "📢 Anuncios", tipo: "lista", item: "anuncio", nuevoArriba: true,
      extraResumen: function (a) { return a.fecha || ""; },
      ayuda: "Avisos para los miembros. El primero de la lista es el que sale primero en la página.",
      campos: [
        { k: "titulo", l: "Título" },
        { k: "fecha", l: "Fecha", ph: "15 de noviembre de 2026" },
        { k: "texto", l: "Mensaje", tipo: "area" }
      ] },
    { key: "eventos", titulo: "📅 Eventos", tipo: "lista", item: "evento", ordenarFecha: true,
      extraResumen: function (ev) { return FX.texto(ev); },
      ayuda: "Próximas actividades. Toca un evento para abrirlo. Usa «📅 Ordenar por fecha» para ponerlos del más cercano al más lejano.",
      campos: [
        { k: "nombre", l: "Nombre del evento" },
        { k: "fecha", l: "Fecha", tipo: "fechaEvento" },
        { k: "hora", l: "Hora (opcional)", ph: "9:00 AM",
          nota: "Si la escribes (por ejemplo 9:00 AM), la cuenta regresiva llega hasta esa hora." },
        { k: "lugar", l: "Lugar (opcional)" },
        { k: "descripcion", l: "Descripción (opcional)", tipo: "area" },
        { k: "documentos", l: "Documentos del evento (opcional)", tipo: "lista", item: "documento",
          nota: "Permiso de viaje, agenda, guía… Salen debajo del evento para descargar.",
          campos: [
            { k: "titulo", l: "Título", ph: "Permiso de viaje" },
            { k: "archivo", l: "Archivo", tipo: "archivo" },
            { k: "enlace", l: "…o enlace (opcional)", ph: "https://drive.google.com/..." }
          ] }
      ] },
    { key: "albumes", titulo: "📸 Álbumes de fotos", tipo: "albumes", item: "álbum",
      ayuda: "Crea un álbum por cada evento, sube las fotos y márcalo como «Publicado» cuando esté listo. Los visitantes pueden ver y descargar las fotos.",
      campos: [
        { k: "id", tipo: "oculto" },
        { k: "titulo", l: "Nombre del evento" },
        { k: "fecha", l: "Fecha", ph: "20 de noviembre de 2026" },
        { k: "lugar", l: "Lugar (opcional)" },
        { k: "descripcion", l: "Descripción (opcional)", tipo: "area" },
        { k: "publicado", l: "Publicado (se ve en la página)", tipo: "check", def: false },
        { k: "recibe_fotos", l: "Los miembros pueden enviar fotos a este álbum", tipo: "check" },
        { k: "portada", tipo: "oculto" },
        { k: "fotos", tipo: "lista", oculto: true, campos: CAMPOS_FOTO_ALBUM }
      ] },
    { key: "subidas", titulo: "📤 Fotos de miembros", tipo: "miembros",
      ayuda: "Los miembros pueden enviar fotos para un álbum. Llegan a una carpeta privada de Google Drive y solo se publican cuando las apruebas aquí.",
      campos: [
        { k: "activo", l: "Permitir que los miembros envíen fotos", tipo: "check", def: false },
        { k: "url", l: "Enlace del script de Google (termina en /exec)", ph: "https://script.google.com/macros/s/.../exec", bloqueado: true,
          peligro: "Si este enlace queda mal, dejan de funcionar el envío de fotos de miembros, el conteo de visitas y las sugerencias de Instagram.",
          nota: "Lo obtienes una sola vez al instalar el script. Las instrucciones están en GUIA.md." }
      ] },
    { key: "_sugerencias", titulo: "💡 Sugerencias de Instagram", tipo: "sugerencias",
      ayuda: "Cada día se revisan las publicaciones nuevas de Instagram y se proponen eventos y logros. Revisa, edita lo que haga falta y apruébalos; se publican al «Guardar cambios»." },
    { key: "_visitas", titulo: "📊 Visitas", tipo: "visitas",
      ayuda: "Cuántas personas visitan la página. Cada navegador cuenta una vez por día (recargar no suma). No se guardan datos personales ni se usan cookies." },
    { key: "documentos", titulo: "📄 Documentos", tipo: "lista", item: "documento",
      ayuda: "Archivos que los miembros pueden descargar: permisos, reglamento, código de vestimenta, calendario… Sube el archivo o pega un enlace (Google Drive, FBLA).",
      extraResumen: function (d) { return d.archivo ? tipoDocumento(d.archivo).nombre + (d.tamano ? " · " + tamanoLegible(d.tamano) : "") : d.enlace ? "Enlace" : ""; },
      campos: [
        { k: "titulo", l: "Título", ph: "Permiso de viaje — Conferencia Estatal" },
        { k: "descripcion", l: "Descripción (opcional)", tipo: "area", ph: "Para qué es y cuándo hay que entregarlo" },
        { k: "archivo", l: "Archivo", tipo: "archivo" },
        { k: "enlace", l: "…o enlace (opcional)", ph: "https://drive.google.com/...",
          nota: "Usa el enlace solo si el documento está en otro sitio. Si subes un archivo, se usa el archivo." }
      ] },
    { key: "directiva", titulo: "👥 Directiva", tipo: "lista", item: "oficial",
      ayuda: "Oficiales del capítulo y consejero(a). Si no hay foto, se muestran las iniciales.",
      campos: [
        { k: "nombre", l: "Nombre" },
        { k: "puesto", l: "Puesto", ph: "Presidente(a)" },
        { k: "foto", l: "Foto (mejor si es cuadrada)", tipo: "foto" }
      ] },
    { key: "logros", titulo: "🏆 Logros", tipo: "lista", item: "logro", nuevoArriba: true,
      extraResumen: function (l) { return [l.competencia, l.anio_academico].filter(Boolean).join(" · "); },
      ayuda: "Premios y reconocimientos del capítulo.",
      campos: [
        { k: "titulo", l: "Logro", ph: "1er lugar — Social Media Strategies" },
        { k: "competencia", l: "Competencia de FBLA (opcional)", tipo: "competencia",
          ph: "Escribe para buscar: Accounting, Public Speaking…",
          nota: "Lista oficial de eventos competitivos de FBLA (escuela superior). Déjalo vacío si no es una competencia." },
        { k: "detalle", l: "Detalle", ph: "Conferencia Estatal (SLC) · nombre del estudiante" },
        { k: "anio_academico", l: "Año académico", tipo: "anio" }
      ] },
    { key: "instagram", titulo: "📷 Instagram", tipo: "objeto",
      ayuda: "La página muestra solas las publicaciones más recientes de Instagram usando el feed de Behold.so. No tienes que hacer nada cuando publiquen algo nuevo: aparece solo (Behold se actualiza una vez al día).",
      campos: [
        { k: "titulo", l: "Título de la sección", ph: "Síguenos en Instagram" },
        { k: "behold", l: "Enlace del feed de Behold", tipo: "behold", ph: "https://feeds.behold.so/...", bloqueado: true,
          peligro: "Si este enlace queda mal, dejan de salir las publicaciones de Instagram en la página y las sugerencias diarias.",
          nota: "En behold.so → tu feed → «Embed» / «JSON» → copia el enlace que empieza con https://feeds.behold.so/" },
        { k: "cantidad", l: "Cuántas publicaciones mostrar", ph: "2" },
        { k: "publicaciones", l: "Publicaciones de respaldo (opcional)", tipo: "lista", item: "publicación", nuevoArriba: true,
          nota: "Solo se usan si Behold no responde. En Instagram: «⋯» o «Compartir» → «Copiar enlace».",
          campos: [{ k: "enlace", l: "Enlace de la publicación", tipo: "instagram", ph: "https://www.instagram.com/p/..." }] }
      ] },
    { key: "capitulo", titulo: "🏫 Información general", tipo: "objeto",
      ayuda: "Lo que sale en la parte de arriba de la página.",
      campos: [
        { k: "nombre", l: "Nombre del capítulo" },
        { k: "escuela", l: "Escuela" },
        { k: "pueblo", l: "Pueblo" },
        { k: "lema", l: "Lema" },
        { k: "foto_portada", l: "Foto de portada (opcional)", tipo: "foto" },
        { k: "logo", l: "Logo (sale arriba a la izquierda)", tipo: "foto", recortar: true,
          nota: "Usa la versión BLANCA del logo oficial de FBLA (fbla.org/brand-center), en PNG con fondo transparente. No le cambies colores ni uses el triángulo solo. Los márgenes vacíos se recortan solos." }
      ] },
    { key: "sobre_nosotros", titulo: "ℹ️ Sobre nosotros", tipo: "objeto",
      ayuda: "Descripción del capítulo y los números grandes.",
      campos: [
        { k: "titulo", l: "Título" },
        { k: "texto", l: "Descripción", tipo: "area" },
        { k: "datos", l: "Números destacados", tipo: "lista", item: "número",
          campos: [
            { k: "numero", l: "Número", ph: "45" },
            { k: "etiqueta", l: "Qué representa", ph: "Miembros" }
          ] }
      ] },
    { key: "contacto", titulo: "✉️ Contacto", tipo: "objeto",
      ayuda: "Si dejas una red social vacía, no aparece en la página.",
      campos: [
        { k: "correo", l: "Correo electrónico" },
        { k: "fbla_connect", l: "Enlace de FBLA Connect", ph: "https://connect.fbla.org/", defTexto: "https://connect.fbla.org/", bloqueado: true,
          peligro: "Si este enlace queda mal, el botón «FBLA Connect» del menú llevará a una página equivocada.",
          nota: "Portal oficial de miembros de FBLA. Sale en el menú de arriba. Déjalo vacío para quitarlo." },
        { k: "instagram", l: "Enlace de Instagram", ph: "https://www.instagram.com/..." },
        { k: "facebook", l: "Enlace de Facebook", ph: "https://www.facebook.com/..." },
        { k: "tiktok", l: "Enlace de TikTok", ph: "https://www.tiktok.com/@..." }
      ] }
  ];

  // ---------- Estado ----------
  var datos = {};
  var rutasOriginales = {};  // fotos que había al cargar (para borrar las que se quiten)
  var sha = null;            // versión de contenido.yml que se cargó
  var rama = "main";
  var modo = null;           // "github" cuando se entra con el token
  var sesion = { owner: "", repo: "", token: "" };
  var vistas = {};           // ruta de foto -> imagen en memoria (para verla antes de publicar)
  var porSubir = {};         // ruta de foto -> contenido (base64) que se sube al guardar
  var aprobadas = [];        // fotos de miembros aprobadas que se confirman al guardar
  var pendientes = null;     // fotos de miembros esperando aprobación
  var actual = SECCIONES[0].key;
  var albumAbierto = null;
  var hayCambios = false;

  var $ = function (id) { return document.getElementById(id); };

  // ---------- Utilidades ----------
  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (a) {
      if (a === "texto") n.textContent = attrs[a];
      else if (a.indexOf("on") === 0) n.addEventListener(a.slice(2), attrs[a]);
      else if (attrs[a] !== undefined && attrs[a] !== null && attrs[a] !== false) n.setAttribute(a, attrs[a]);
    });
    (hijos || []).forEach(function (h) { if (h) n.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return n;
  }

  function ls(clave, v) {
    try {
      if (arguments.length === 1) return JSON.parse(localStorage.getItem(clave) || "null");
      if (v) localStorage.setItem(clave, JSON.stringify(v)); else localStorage.removeItem(clave);
    } catch (e) { return null; }
  }

  var tToast;
  function avisar(msg, error) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (error ? " toast--error" : "");
    t.hidden = false;
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.hidden = true; }, error ? 8000 : 4500);
  }

  // Pantalla de espera. Opcional: fracción (0–1) para la barra y la foto que se está subiendo.
  var ocu = null;
  function ocupado(msg, fraccion, foto) {
    var o = $("ocupado");
    o.hidden = !msg;
    if (!msg) return;
    if (!ocu) {
      o.textContent = "";
      ocu = { foto: el("img", { class: "ocupado__foto", alt: "" }), texto: el("p", { class: "ocupado__texto" }), relleno: el("span") };
      ocu.barra = el("div", { class: "barra-progreso", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100" }, [ocu.relleno]);
      o.appendChild(el("div", { class: "ocupado__caja" }, [ocu.foto, ocu.texto, ocu.barra]));
    }
    ocu.texto.textContent = msg;
    ocu.foto.hidden = !foto;
    if (foto) ocu.foto.src = foto;
    ocu.barra.hidden = fraccion === undefined || fraccion === null;
    if (!ocu.barra.hidden) {
      var pct = Math.round(Math.max(0, Math.min(1, fraccion)) * 100);
      ocu.relleno.style.width = pct + "%";
      ocu.barra.setAttribute("aria-valuenow", pct);
    }
  }

  // Tarjeta flotante (no bloquea) mientras se cargan fotos a un álbum, una por una.
  var cargandoFotos = false;
  function progresoFotos(msg, fraccion, foto) {
    var c = $("progreso-fotos");
    if (!c) {
      c = el("div", { class: "progreso-fotos", id: "progreso-fotos", role: "status", "aria-live": "polite" }, [
        el("img", { class: "progreso-fotos__foto", alt: "" }),
        el("div", { class: "progreso-fotos__info" }, [
          el("p", { class: "progreso-fotos__texto" }),
          el("div", { class: "barra-progreso", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100" }, [el("span")])
        ])
      ]);
      document.body.appendChild(c);
    }
    c.hidden = !msg;
    if (!msg) return;
    c.querySelector(".progreso-fotos__texto").textContent = msg;
    var img = c.querySelector(".progreso-fotos__foto");
    if (foto) img.src = foto;
    var pct = Math.round(Math.max(0, Math.min(1, fraccion || 0)) * 100);
    c.querySelector(".barra-progreso span").style.width = pct + "%";
    c.querySelector(".barra-progreso").setAttribute("aria-valuenow", pct);
  }

  // Mientras se edita una sugerencia de Instagram, los cambios no cuentan (aún no van a la página).
  var silencioCambios = false;
  document.addEventListener("pointerdown", function () { silencioCambios = false; }, true);
  document.addEventListener("focusin", function () { silencioCambios = false; }, true);

  // Indicador de la barra superior: ok (verde), pendiente (dorado).
  function fijarEstado(tipo) {
    var e = $("estado");
    e.textContent = tipo === "pendiente" ? "Cambios sin guardar" : "Todo guardado";
    e.setAttribute("data-estado", tipo);
  }

  function marcarCambio() {
    if (silencioCambios) return;
    hayCambios = true;
    $("guardar").disabled = false;
    fijarEstado("pendiente");
  }

  function b64aTexto(b64) {
    var bin = atob(b64.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function vacio(v) {
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  }

  function adivinarRepo() {
    var h = location.hostname;
    if (/\.github\.io$/i.test(h)) {
      var partes = location.pathname.split("/").filter(Boolean);
      if (partes.length && /^(admin|index)(\.html?)?$/i.test(partes[partes.length - 1])) partes.pop();
      return { owner: h.split(".")[0], repo: partes[0] || h };
    }
    return { owner: "", repo: "" };
  }

  // Todas las rutas "fotos/..." que se usan en el contenido.
  function rutasFotos(valor, acc) {
    acc = acc || {};
    if (typeof valor === "string") { if (/^(fotos|docs)\//.test(valor)) acc[valor] = true; }
    else if (Array.isArray(valor)) valor.forEach(function (v) { rutasFotos(v, acc); });
    else if (valor && typeof valor === "object") Object.keys(valor).forEach(function (k) { rutasFotos(valor[k], acc); });
    return acc;
  }

  function enlaceInstagram(url) {
    var m = String(url || "").trim().match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i);
    return m ? "https://www.instagram.com/" + m[1].toLowerCase() + "/" + m[2] + "/" : "";
  }

  // ---------- GitHub ----------
  function gh(ruta, metodo, cuerpo) {
    var url = "https://api.github.com/repos/" + encodeURIComponent(sesion.owner) + "/" +
      encodeURIComponent(sesion.repo) + (ruta ? "/" + ruta : "");
    return fetch(url, {
      method: metodo || "GET",
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + sesion.token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    }).then(function (r) {
      if (r.ok) return r.json();
      var e = new Error(mensajeError(r.status));
      e.status = r.status;
      throw e;
    }, function () {
      throw new Error("No hay conexión con GitHub. Revisa tu internet.");
    });
  }

  function rutaContenido(ruta, ref) {
    return "contents/" + ruta.split("/").map(encodeURIComponent).join("/") + (ref ? "?ref=" + encodeURIComponent(ref) : "");
  }

  function mensajeError(status) {
    if (status === 401) return "La llave (token) no es válida o ya expiró. Pide una nueva.";
    if (status === 403) return "La llave no tiene permiso para guardar. Debe tener permiso \"Contents: Read and write\" (y estar aprobada en la organización).";
    if (status === 404) return "No se encontró el repositorio. Revisa el usuario y el nombre del repositorio, y que la llave tenga acceso a él.";
    if (status === 409 || status === 422) return "Alguien más guardó cambios hace poco. Recarga el panel (tus cambios no guardados se perderán) e inténtalo otra vez.";
    return "GitHub respondió con un error (" + status + "). Inténtalo otra vez en un momento.";
  }

  // ---------- Script de Google (fotos de miembros) ----------
  function urlScript() {
    var u = String((datos.subidas || {}).url || "").trim();
    return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u) ? u : "";
  }

  function script(accion, extra) {
    var url = urlScript();
    if (!url) return Promise.reject(new Error("Primero pega el enlace del script de Google (termina en /exec)."));
    if (modo !== "github" || !sesion.token) return Promise.reject(new Error("Entra al panel con tu token de GitHub para ver las fotos de miembros."));
    // El script verifica con GitHub que este token puede editar la página.
    var cuerpo = { accion: accion, token: sesion.token };
    Object.keys(extra || {}).forEach(function (k) { cuerpo[k] = extra[k]; });
    var alAvanzar = extra && extra._progreso, esperado = extra && extra._esperado;
    delete cuerpo._progreso; delete cuerpo._esperado;
    return fetch(url, { method: "POST", body: JSON.stringify(cuerpo) })
      .then(function (r) { return alAvanzar && r.body && r.body.getReader ? leerConProgreso(r, alAvanzar, esperado) : r.json(); }, function () {
        throw new Error("No se pudo conectar con el script de Google. Revisa el enlace y tu internet.");
      })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.error) || "El script de Google respondió con un error.");
        return j;
      });
  }

  // Lee la respuesta poco a poco para mover la barra (bytes recibidos / bytes esperados).
  function leerConProgreso(r, alAvanzar, esperado) {
    var total = +r.headers.get("Content-Length") || esperado || 0;
    var lector = r.body.getReader(), partes = [], recibidos = 0;
    var paso = function () {
      return lector.read().then(function (x) {
        if (x.done) return;
        partes.push(x.value);
        recibidos += x.value.length;
        alAvanzar(total ? Math.min(0.99, recibidos / total) : null);
        return paso();
      });
    };
    return paso().then(function () {
      var todo = new Uint8Array(recibidos), pos = 0;
      partes.forEach(function (p) { todo.set(p, pos); pos += p.length; });
      return JSON.parse(new TextDecoder("utf-8").decode(todo));
    });
  }

  // ---------- Entrar / salir ----------
  function iniciar() {
    // Este navegador es de un administrador: sus visitas a la página no se cuentan.
    try { localStorage.setItem("fbla3281-admin", "1"); } catch (e) {}
    var g = ls(CLAVE_LS);
    var adiv = adivinarRepo();
    $("owner").value = CONFIG.owner || (g && g.owner) || adiv.owner;
    $("repo").value = CONFIG.repo || (g && g.repo) || adiv.repo;
    if (!$("owner").value || !$("repo").value) $("detalles-repo").open = true;

    $("form-login").addEventListener("submit", function (ev) {
      ev.preventDefault();
      sesion = { owner: $("owner").value.trim(), repo: $("repo").value.trim(), token: $("token").value.trim() };
      if (!sesion.owner || !sesion.repo) {
        $("detalles-repo").open = true;
        return errorLogin("Escribe el usuario de GitHub y el nombre del repositorio.");
      }
      entrarGithub($("recordar").checked);
    });
    $("guardar").addEventListener("click", guardar);
    $("salir").addEventListener("click", function () {
      if (hayCambios && !confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
      ls(CLAVE_LS, null);
      ls(CLAVE_LS_APROBAR, null);
      hayCambios = false;
      location.reload();
    });
    window.addEventListener("beforeunload", function (e) {
      if (hayCambios) { e.preventDefault(); e.returnValue = ""; }
    });

    if (g && g.token) {
      sesion = { owner: $("owner").value, repo: $("repo").value, token: g.token };
      entrarGithub(true);
    }
  }

  function errorLogin(msg) {
    $("login-error").textContent = msg;
    $("login-error").hidden = false;
  }

  function entrarGithub(recordar) {
    $("login-error").hidden = true;
    ocupado("Cargando contenido…");
    gh("").then(function (repo) {
      rama = repo.default_branch || "main";
      repoKB = repo.size || 0;
      return gh(rutaContenido(ARCHIVO, rama));
    }).then(function (r) {
      sha = r.sha;
      cargarTexto(b64aTexto(r.content));
      modo = "github";
      ls(CLAVE_LS, recordar ? sesion : null);
      abrirEditor();
    }).catch(function (e) {
      ls(CLAVE_LS, null);
      errorLogin(e.message);
    }).then(function () { ocupado(null); });
  }

  function cargarTexto(txt) {
    try {
      datos = jsyaml.load(txt) || {};
    } catch (e) {
      throw new Error("El archivo contenido.yml tiene un error y no se pudo leer (línea " +
        (e.mark ? e.mark.line + 1 : "?") + "). Pide ayuda para arreglarlo en GitHub.");
    }
    // La galería vieja (sin álbumes) se convierte en un álbum.
    if (Array.isArray(datos.galeria)) {
      var viejas = datos.galeria.filter(function (g) { return g && g.foto; });
      if (viejas.length) {
        if (!Array.isArray(datos.albumes)) datos.albumes = [];
        datos.albumes.push({ id: "galeria", titulo: "Galería", fecha: "", lugar: "", descripcion: "", publicado: true, portada: "", fotos: viejas });
      }
      delete datos.galeria;
    }
    // La sección «Únete» ya no existe: sus datos viejos se quitan al guardar.
    delete datos.unete;
    // Fechas de eventos escritas a mano → formato nuevo (día, varios días, mes o por anunciar).
    if (Array.isArray(datos.eventos)) datos.eventos.forEach(normalizarFechaEvento);
    // Logros sin año académico: se adivina por el texto (o el año actual).
    if (Array.isArray(datos.logros)) datos.logros.forEach(function (l) {
      if (l && typeof l === "object" && vacio(l.anio_academico)) {
        l.anio_academico = FX.anioAcademicoDeTexto((l.titulo || "") + " " + (l.detalle || "")) || FX.anioAcademicoActual();
      }
    });
    rutasOriginales = rutasFotos(datos);
  }

  function abrirEditor() {
    $("login").hidden = true;
    $("editor").hidden = false;
    $("botones").hidden = false;
    fijarEstado("ok");
    var ultima = ls(CLAVE_LS_PESTANA);
    if (ultima && SECCIONES.some(function (s) { return s.key === ultima; })) actual = ultima;
    pintarPestanas();
    pintar();
    // Revisa en segundo plano si hay sugerencias o fotos esperando (para los contadores).
    if (modo === "github" && urlScript()) {
      script("sugerencias").then(function (r) { if (!sugerencias) { sugerencias = r.sugerencias || []; sugerenciasInfo = r; } actualizarContadores(); }).catch(function () {});
      script("pendientes").then(function (r) {
        if (!pendientes) pendientes = (r.fotos || []).map(function (p) { p.estado = "pendiente"; return p; });
        actualizarContadores();
      }).catch(function () {});
    }
  }

  // Ctrl + S (o Cmd + S) guarda.
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (!$("guardar").disabled && !$("editor").hidden) guardar();
    }
  });

  // ---------- Pintar ----------
  function irA(key) {
    actual = key;
    albumAbierto = null;
    ls(CLAVE_LS_PESTANA, key);   // el panel recuerda la última pestaña
    pintarPestanas(); pintar(); window.scrollTo(0, 0);
  }

  // Número que sale junto a cada pestaña (cuántos hay o cuántos esperan revisión).
  function contadorDe(s) {
    if (s.tipo === "lista" || s.tipo === "albumes") return (datos[s.key] || []).length || "";
    if (s.tipo === "sugerencias" && sugerencias) {
      var n = sugerencias.filter(function (x) { return !x.estado; }).length;
      return n ? { n: n, alerta: true } : "";
    }
    if (s.tipo === "miembros" && pendientes) {
      var m = pendientes.filter(function (x) { return x.estado === "pendiente"; }).length;
      return m ? { n: m, alerta: true } : "";
    }
    return "";
  }

  function seccionDe(key) { return SECCIONES.filter(function (s) { return s.key === key; })[0]; }

  function pintarPestanas() {
    var nav = $("pestanas");
    nav.innerHTML = "";
    // Celular: menú desplegable agrupado
    var sel = el("select", { class: "pestanas-movil", "aria-label": "Parte de la página" });
    GRUPOS.forEach(function (g) {
      var destino = g.nombre ? el("optgroup", { label: g.nombre }) : sel;
      g.keys.forEach(function (k) {
        var s = seccionDe(k); if (!s) return;
        var c = contadorDe(s), n = typeof c === "object" ? c.n : c;
        var o = el("option", { value: s.key, texto: s.titulo + (n ? " (" + n + ")" : "") });
        if (s.key === actual) o.selected = true;
        destino.appendChild(o);
      });
      if (destino !== sel) sel.appendChild(destino);
    });
    sel.addEventListener("change", function () { irA(sel.value); });
    nav.appendChild(sel);
    // Computadora: menú lateral agrupado
    GRUPOS.forEach(function (g) {
      if (g.nombre) nav.appendChild(el("span", { class: "pestanas__grupo", texto: g.nombre }));
      g.keys.forEach(function (k) {
        var s = seccionDe(k); if (!s) return;
        var c = contadorDe(s), n = typeof c === "object" ? c.n : c;
        nav.appendChild(el("button", {
          class: "pestana", role: "tab", "aria-selected": s.key === actual ? "true" : "false", "data-key": s.key,
          onclick: function () { irA(s.key); }
        }, [s.titulo, n ? el("span", { class: "pestana__n" + (c.alerta ? " pestana__n--alerta" : ""), texto: String(n) }) : null]));
      });
    });
    var esp = indicadorEspacio();
    if (esp) nav.appendChild(esp);
  }

  // Espacio usado en GitHub (GitHub Pages recomienda que el sitio no pase de 1 GB).
  var repoKB = 0;
  function indicadorEspacio() {
    if (!repoKB) return null;
    var mb = repoKB / 1024, limite = 1024, pct = Math.min(100, mb / limite * 100);
    var nivel = pct >= 85 ? "alto" : pct >= 60 ? "medio" : "bajo";
    return el("div", { class: "almacen almacen--" + nivel, title: "Incluye el historial de cambios. Límite recomendado de GitHub Pages: 1 GB." }, [
      el("span", { class: "almacen__txt", texto: "💾 Espacio: " + (mb < 10 ? mb.toFixed(1) : Math.round(mb)) + " MB de 1 GB" }),
      el("span", { class: "almacen__barra" }, [el("span", { style: "width:" + Math.max(2, pct).toFixed(1) + "%" })]),
      pct >= 85 ? el("span", { class: "almacen__aviso", texto: "Casi lleno: pídele a Claude que libere espacio." }) : null
    ]);
  }

  // Actualiza solo los números de las pestañas (sin redibujar el panel).
  function actualizarContadores() {
    SECCIONES.forEach(function (s) {
      var b = document.querySelector('.pestana[data-key="' + s.key + '"]');
      if (!b) return;
      var c = contadorDe(s), n = typeof c === "object" ? c.n : c;
      var span = b.querySelector(".pestana__n");
      if (!n) { if (span) span.remove(); return; }
      if (!span) { span = el("span", { class: "pestana__n" }); b.appendChild(span); }
      span.textContent = String(n);
      span.classList.toggle("pestana__n--alerta", !!c.alerta);
    });
  }

  function pintar() {
    var s = SECCIONES.filter(function (x) { return x.key === actual; })[0];
    var panel = $("panel");
    panel.innerHTML = "";
    if (s.tipo === "albumes") return pintarAlbumes(panel, s);
    if (s.tipo === "visitas") return pintarVisitas(panel, s);
    if (s.tipo === "resumen") return pintarResumen(panel, s);
    if (s.tipo === "sugerencias") return pintarSugerencias(panel, s);

    panel.appendChild(el("h2", { texto: s.titulo }));
    panel.appendChild(el("p", { class: "ayuda", texto: s.ayuda }));

    if (s.tipo === "lista") {
      if (!Array.isArray(datos[s.key])) datos[s.key] = [];
      panel.appendChild(lista(datos, s.key, s));
      // Acceso rápido desde 🏠 Inicio: añade un elemento nuevo al abrir.
      if (anadirAlAbrir === s.key) {
        anadirAlAbrir = null;
        var b = panel.querySelector(".lista__barra .btn--azul");
        if (b) b.click();
      }
      return;
    }
    if (!datos[s.key] || typeof datos[s.key] !== "object") datos[s.key] = {};
    s.campos.forEach(function (c) { panel.appendChild(campo(datos[s.key], c)); });
    if (s.tipo === "miembros") pintarMiembros(panel);
  }

  function resumenDe(def, obj) {
    return def.campos.map(function (c) {
      return c.tipo === "foto" || c.tipo === "lista" || c.tipo === "oculto" || c.tipo === "fechaEvento" ? "" : obj[c.k];
    }).filter(Boolean)[0] || "";
  }

  function lista(padre, key, def) {
    if (!Array.isArray(padre[key])) padre[key] = [];
    var arr = padre[key];
    var cont = el("div", { class: def.k ? "sublista" : null });

    function redibujar() {
      var nuevo = lista(padre, key, def);
      cont.replaceWith(nuevo);
      return nuevo;
    }

    function anadir() {
      var nuevo = {};
      def.campos.forEach(function (c) { nuevo[c.k] = c.tipo === "check" ? c.def !== false : ""; });
      arr.unshift(nuevo);            // el nuevo siempre aparece arriba, abierto
      abiertos.add(nuevo);
      marcarCambio();
      var objetivo = redibujar().querySelector(":scope > .lista > .item");
      if (objetivo) {
        objetivo.scrollIntoView({ block: "center" });
        var primer = objetivo.querySelector("input[type=text], textarea");
        if (primer) primer.focus();
      }
    }

    // Barra de arriba: añadir (y ordenar por fecha en Eventos)
    var barra = el("div", { class: "lista__barra" }, [
      el("button", { class: "btn btn--azul", type: "button", onclick: anadir }, ["＋ Añadir " + def.item]),
      def.ordenarFecha && arr.length > 1 ? el("button", { class: "btn btn--borde btn--chico", type: "button",
        onclick: function () { ordenarPorFecha(arr); marcarCambio(); redibujar(); avisar("Eventos ordenados por fecha."); } }, ["📅 Ordenar por fecha"]) : null,
      arr.length > 1 ? el("button", { class: "btn btn--borde btn--chico", type: "button",
        onclick: function () {
          var todos = arr.every(function (o) { return abiertos.has(o); });
          arr.forEach(function (o) { if (todos) abiertos.delete(o); else abiertos.add(o); });
          redibujar();
        } }, [arr.every(function (o) { return abiertos.has(o); }) ? "▴ Cerrar todos" : "▾ Abrir todos"]) : null
    ]);
    cont.appendChild(barra);

    var caja = el("div", { class: "lista" });
    if (!arr.length) {
      caja = el("div", { class: "vacio", texto: "No hay ningún " + def.item + " todavía." });
    }
    arr.forEach(function (obj, i) {
      if (!obj || typeof obj !== "object") obj = arr[i] = {};
      var resumen = resumenDe(def, obj);
      var abierto = abiertos.has(obj);
      var extra = def.extraResumen ? def.extraResumen(obj) : "";
      var cab = el("div", { class: "item__cabeza" }, [
        el("button", { type: "button", class: "item__nombre", "aria-expanded": abierto ? "true" : "false",
          onclick: function () { if (abiertos.has(obj)) abiertos.delete(obj); else abiertos.add(obj); redibujar(); } }, [
          el("span", { class: "item__flecha", texto: abierto ? "▾" : "▸" }),
          el("span", { class: "item__titulo", texto: (resumen || mayus(def.item) + " sin título") }),
          extra ? el("span", { class: "item__extra", texto: extra }) : null
        ]),
        el("button", { class: "btn btn--icono", type: "button", title: "Subir", "aria-label": "Mover arriba", disabled: i === 0,
          onclick: function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); marcarCambio(); redibujar(); } }, ["↑"]),
        el("button", { class: "btn btn--icono", type: "button", title: "Bajar", "aria-label": "Mover abajo", disabled: i === arr.length - 1,
          onclick: function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); marcarCambio(); redibujar(); } }, ["↓"]),
        el("button", { class: "btn btn--peligro btn--chico", type: "button",
          onclick: function () {
            if (!confirm("¿Eliminar " + (def.item === "publicación" ? "esta " : "este ") + def.item + (resumen ? " (\"" + resumen + "\")" : "") + "?")) return;
            arr.splice(i, 1); marcarCambio(); redibujar();
          } }, ["🗑 Eliminar"])
      ]);
      var item = el("div", { class: "item" + (abierto ? "" : " item--cerrado") }, [cab]);
      if (abierto) {
        // Los campos solo se crean al abrir el elemento (el panel carga más rápido).
        var cuerpo = el("div", { class: "item__cuerpo" });
        def.campos.forEach(function (c) { cuerpo.appendChild(campo(obj, c)); });
        cuerpo.addEventListener("input", function () {
          var r = resumenDe(def, obj);
          cab.querySelector(".item__titulo").textContent = r || mayus(def.item) + " sin título";
        });
        item.appendChild(cuerpo);
      }
      caja.appendChild(item);
    });
    cont.appendChild(caja);
    actualizarContadores();
    return cont;
  }

  // Elementos de listas que están abiertos (los demás se muestran como una línea).
  var abiertos = new WeakSet();

  // Eventos por fecha: primero los que tienen fecha (del más cercano al más lejano), al final «Por anunciar».
  function ordenarPorFecha(arr) {
    function clave(ev) {
      var f = FX.leer(ev);
      if (f.tipo === "dia" || f.tipo === "rango") return f.inicio.getTime();
      if (f.tipo === "mes") return new Date(f.mes.y, f.mes.m, 1).getTime();
      return Infinity;
    }
    var conIndice = arr.map(function (ev, i) { return { ev: ev, i: i, k: clave(ev) }; });
    conIndice.sort(function (a, b) { return a.k - b.k || a.i - b.i; });
    conIndice.forEach(function (x, i) { arr[i] = x.ev; });
  }

  var contador = 0;
  function campo(obj, c) {
    var id = "c" + (++contador);
    var tipo = c.tipo || "texto";

    if (tipo === "oculto" || c.oculto) return document.createDocumentFragment();
    if (tipo === "lista") {
      return el("div", { class: "campo" }, [
        el("span", { class: "campo__titulo", texto: c.l }),
        c.nota ? el("p", { class: "campo__nota", style: "margin:0 0 8px", texto: c.nota }) : null,
        lista(obj, c.k, c)
      ]);
    }
    if (tipo === "check") {
      if (obj[c.k] === undefined) obj[c.k] = c.def !== false;
      return el("div", { class: "campo" }, [el("label", { class: "check" }, [
        el("input", { type: "checkbox", id: id, checked: obj[c.k] === true,
          onchange: function (e) { obj[c.k] = e.target.checked; marcarCambio(); if (c.alCambiar) c.alCambiar(); } }),
        c.l
      ])]);
    }
    if (tipo === "foto") return campoFoto(obj, c);
    if (tipo === "fechaEvento") return campoFechaEvento(obj, c);
    if (tipo === "archivo") return campoArchivo(obj, c);
    if (tipo === "anio") {
      if (vacio(obj[c.k])) obj[c.k] = FX.anioAcademicoDeTexto((obj.titulo || "") + " " + (obj.detalle || "")) || FX.anioAcademicoActual();
      var sel = el("select", { id: id, class: "selector-simple" });
      var anios = FX.aniosAcademicos(2010);
      if (anios.indexOf(obj[c.k]) < 0) anios.unshift(obj[c.k]);
      anios.forEach(function (a) { var o = el("option", { value: a, texto: a }); if (a === obj[c.k]) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { obj[c.k] = sel.value; marcarCambio(); });
      return el("div", { class: "campo" }, [el("label", { for: id, texto: c.l }), sel,
        el("p", { class: "campo__nota", texto: "De agosto a julio. En la página, los logros se agrupan por año académico." })]);
    }
    if (tipo === "competencia") {
      // (No llamar "lista" a esta variable: taparía la función lista() que dibuja las listas.)
      var datalist = document.getElementById("lista-competencias");
      if (!datalist) {
        datalist = el("datalist", { id: "lista-competencias" });
        (window.COMPETENCIAS_FBLA || []).forEach(function (n) { datalist.appendChild(el("option", { value: n })); });
        document.body.appendChild(datalist);
      }
      var comp = el("input", { type: "text", id: id, list: "lista-competencias", placeholder: c.ph, autocomplete: "off" });
      comp.value = obj[c.k] || "";
      var estadoComp = el("p", { class: "campo__nota" });
      var revisarComp = function () {
        var v = comp.value.trim();
        var oficial = (window.COMPETENCIAS_FBLA || []).some(function (n) { return n.toLowerCase() === v.toLowerCase(); });
        estadoComp.textContent = !v ? c.nota : oficial ? "✓ Evento oficial de FBLA" : "Este nombre no está en la lista oficial (puedes dejarlo si es otra competencia).";
        estadoComp.style.color = v && oficial ? "#1d7a3a" : "";
      };
      revisarComp();
      comp.addEventListener("input", function () { obj[c.k] = comp.value; marcarCambio(); revisarComp(); });
      return el("div", { class: "campo" }, [el("label", { for: id, texto: c.l }), comp, estadoComp]);
    }

    if (obj[c.k] === undefined && c.defTexto) obj[c.k] = c.defTexto;
    var valor = obj[c.k] === undefined || obj[c.k] === null ? "" : String(obj[c.k]);
    var entrada = tipo === "area"
      ? el("textarea", { id: id, placeholder: c.ph })
      : el("input", { type: "text", id: id, placeholder: c.ph });
    entrada.value = valor;
    var estado = null;
    if (tipo === "instagram" || tipo === "behold") {
      estado = el("p", { class: "campo__nota" });
      var valido = tipo === "behold"
        ? function (v) { return /^https:\/\/feeds\.behold\.so\/[\w-]+\/?$/.test(v); }
        : function (v) { return !!enlaceInstagram(v); };
      var error = tipo === "behold"
        ? "⚠ El enlace debe empezar con https://feeds.behold.so/"
        : "⚠ Este enlace no es de una publicación de Instagram (debe tener /p/ o /reel/).";
      var revisar = function () {
        var v = entrada.value.trim();
        estado.textContent = !v ? "" : valido(v) ? "✓ Enlace válido" : error;
        estado.style.color = valido(v) ? "#1d7a3a" : "#c0392b";
      };
      revisar();
      entrada.addEventListener("input", revisar);
    }
    entrada.addEventListener("input", function () { obj[c.k] = entrada.value; marcarCambio(); });

    // Enlaces delicados: bloqueados hasta que se pulse ✏️ Editar.
    if (c.bloqueado) {
      var boton = el("button", { type: "button", class: "btn btn--icono candado" });
      var aviso = el("p", { class: "campo__nota campo__peligro", texto: "⚠ " + (c.peligro || "Cambiar este enlace puede dañar la página.") });
      var fijar = function (bloquear) {
        entrada.readOnly = bloquear;
        entrada.classList.toggle("entrada--bloqueada", bloquear);
        boton.textContent = bloquear ? "✏️ Editar" : "🔒 Bloquear";
        boton.setAttribute("aria-label", bloquear ? "Desbloquear para editar " + c.l : "Bloquear " + c.l);
        aviso.hidden = bloquear;
      };
      boton.addEventListener("click", function () {
        if (entrada.readOnly) {
          if (!confirm("¿Seguro que quieres cambiar «" + c.l + "»?\n\n" + (c.peligro || "") + "\n\nSolo cámbialo si sabes que el enlace nuevo es correcto.")) return;
          fijar(false);
          entrada.focus();
        } else {
          fijar(true);
        }
      });
      fijar(true);
      return el("div", { class: "campo" }, [
        el("label", { for: id, texto: "🔒 " + c.l }),
        el("div", { class: "fila-candado" }, [entrada, boton]),
        aviso, estado,
        c.nota ? el("p", { class: "campo__nota", texto: c.nota }) : null
      ]);
    }

    return el("div", { class: "campo" }, [
      el("label", { for: id, texto: c.l }), entrada, estado,
      c.nota ? el("p", { class: "campo__nota", texto: c.nota }) : null
    ]);
  }

  function srcDe(ruta) { return vistas[ruta] || ruta; }

  // ---------- Documentos (PDF, Word, Excel…) ----------
  var MAX_DOC = 25 * 1024 * 1024;   // 25 MB por archivo
  var TIPOS_DOC = {
    pdf: ["📕", "PDF"], doc: ["📘", "Word"], docx: ["📘", "Word"], xls: ["📗", "Excel"], xlsx: ["📗", "Excel"],
    ppt: ["📙", "PowerPoint"], pptx: ["📙", "PowerPoint"], jpg: ["🖼", "Imagen"], jpeg: ["🖼", "Imagen"], png: ["🖼", "Imagen"],
    txt: ["📄", "Texto"], csv: ["📗", "CSV"]
  };
  function tipoDocumento(ruta) {
    var ext = String(ruta || "").split(".").pop().toLowerCase();
    var t = TIPOS_DOC[ext] || ["📄", ext.toUpperCase()];
    return { icono: t[0], nombre: t[1], ext: ext };
  }
  function tamanoLegible(b) {
    b = Number(b) || 0;
    return b >= 1048576 ? (b / 1048576).toFixed(1).replace(".0", "") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
  }

  function leerComoBase64(file) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(",")[1] || ""); };
      r.onerror = function () { mal(new Error("No se pudo leer el archivo.")); };
      r.readAsDataURL(file);
    });
  }

  function campoArchivo(obj, c) {
    var cont = el("div", { class: "campo" });
    function dibujar() {
      cont.innerHTML = "";
      cont.appendChild(el("span", { class: "campo__titulo", texto: c.l }));
      var input = el("input", { type: "file", hidden: true,
        accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.csv" });
      input.addEventListener("change", function () {
        var f = input.files[0];
        if (!f) return;
        var ext = f.name.split(".").pop().toLowerCase();
        if (!TIPOS_DOC[ext]) return avisar("Ese tipo de archivo no se acepta. Usa PDF, Word, Excel, PowerPoint o imagen.", true);
        if (f.size > MAX_DOC) return avisar("El archivo pesa " + tamanoLegible(f.size) + ". El máximo es 25 MB.", true);
        ocupado("Preparando archivo…");
        leerComoBase64(f).then(function (b64) {
          var ruta = "docs/" + nombreSeguro(f.name, ext);
          porSubir[ruta] = b64;
          obj[c.k] = ruta;
          obj.tamano = f.size;
          if (vacio(obj.titulo)) {
            obj.titulo = f.name.replace(/\.[^.]+$/, "");
            // Muestra el título nuevo en su cuadro y en el encabezado del elemento.
            var item = cont.closest(".item");
            var caja = item && item.querySelector(".item__cuerpo input[type=text]");
            if (caja && !caja.value) caja.value = obj.titulo;
            var tit = item && item.querySelector(".item__titulo");
            if (tit) tit.textContent = obj.titulo;
          }
          marcarCambio();
          dibujar();
          avisar("Archivo listo. Se publica al «Guardar cambios».");
        }).catch(function (e) { avisar(e.message, true); })
          .then(function () { ocupado(null); });
      });
      var ruta = obj[c.k];
      if (ruta) {
        var t = tipoDocumento(ruta);
        cont.appendChild(el("div", { class: "doc-actual" }, [
          el("span", { class: "doc-actual__icono", texto: t.icono }),
          el("div", { class: "doc-actual__info" }, [
            el("strong", { texto: ruta.split("/").pop() }),
            el("span", { texto: t.nombre + (obj.tamano ? " · " + tamanoLegible(obj.tamano) : "") + (porSubir[ruta] ? " · sin publicar todavía" : "") })
          ]),
          el("div", { class: "foto__botones" }, [
            el("button", { class: "btn btn--azul btn--chico", type: "button", onclick: function () { input.click(); } }, ["Cambiar"]),
            el("button", { class: "btn btn--borde btn--chico", type: "button",
              onclick: function () { obj[c.k] = ""; delete obj.tamano; marcarCambio(); dibujar(); } }, ["Quitar"])
          ])
        ]));
      } else {
        cont.appendChild(el("button", { class: "btn btn--grande", type: "button", onclick: function () { input.click(); } },
          ["📎 Subir archivo (PDF, Word, Excel, PowerPoint o imagen · máx. 25 MB)"]));
      }
      cont.appendChild(input);
    }
    dibujar();
    return cont;
  }

  // ---------- Fecha de un evento (con calendario en español) ----------
  var FX = window.FechasFBLA;
  var TIPOS_FECHA = [["dia", "Un día"], ["rango", "Varios días"], ["mes", "Durante un mes"], ["pendiente", "Por anunciar"]];

  // Convierte las fechas viejas escritas a mano al formato nuevo.
  function normalizarFechaEvento(ev) {
    if (!ev || typeof ev !== "object") return;
    if (["dia", "rango", "mes", "pendiente"].indexOf(ev.tipo_fecha) >= 0) return;
    if (vacio(ev.fecha)) { ev.tipo_fecha = "dia"; return; }
    var p = FX.desdeTexto(ev.fecha);
    Object.keys(p).forEach(function (k) { ev[k] = p[k]; });
  }

  function campoFechaEvento(obj, c) {
    normalizarFechaEvento(obj);
    var cont = el("div", { class: "campo" });
    var resumen;

    function actualizarResumen() {
      var f = FX.leer(obj);
      var conCuenta = f.tipo === "dia" || f.tipo === "rango";
      var aviso = "";
      if ((obj.tipo_fecha === "dia" || obj.tipo_fecha === "rango") && !FX.deISO(obj.inicio)) aviso = "⚠ Escoge el día. ";
      else if (obj.tipo_fecha === "rango" && !FX.deISO(obj.fin)) aviso = "⚠ Escoge el último día. ";
      else if (obj.tipo_fecha === "mes" && !FX.deMes(obj.mes)) aviso = "⚠ Escoge el mes. ";
      resumen.textContent = aviso + "Se verá así: «" + FX.texto(obj) + "» · " +
        (conCuenta ? "⏳ Con cuenta regresiva" : "Sin cuenta regresiva");
      resumen.style.color = aviso ? "#c0392b" : "";
    }
    function cambio() { marcarCambio(); actualizarResumen(); }

    function dibujar() {
      cont.innerHTML = "";
      cont.appendChild(el("span", { class: "campo__titulo", texto: c.l }));
      var grupo = el("div", { class: "tipos-fecha", role: "radiogroup", "aria-label": "Tipo de fecha" });
      TIPOS_FECHA.forEach(function (tp) {
        var activo = obj.tipo_fecha === tp[0];
        grupo.appendChild(el("button", {
          type: "button", role: "radio", "aria-checked": activo ? "true" : "false",
          class: "tipo-fecha" + (activo ? " tipo-fecha--activo" : ""),
          onclick: function () {
            if (obj.tipo_fecha === tp[0]) return;
            obj.tipo_fecha = tp[0];
            if (tp[0] === "rango" && FX.deISO(obj.inicio) && !FX.deISO(obj.fin)) obj.fin = "";
            marcarCambio(); dibujar();
          }
        }, [tp[1]]));
      });
      cont.appendChild(grupo);

      var sel = el("div", { class: "selectores-fecha" });
      if (obj.tipo_fecha === "dia") {
        sel.appendChild(selectorFecha("Día del evento", obj.inicio, function (v) { obj.inicio = v; cambio(); }));
      } else if (obj.tipo_fecha === "rango") {
        sel.appendChild(selectorFecha("Primer día", obj.inicio, function (v) {
          obj.inicio = v;
          if (FX.deISO(obj.fin) && obj.fin < v) obj.fin = "";
          marcarCambio(); dibujar();
        }));
        sel.appendChild(selectorFecha("Último día", obj.fin, function (v) { obj.fin = v; cambio(); }, { min: obj.inicio }));
      } else if (obj.tipo_fecha === "mes") {
        sel.appendChild(selectorMes("Mes del evento", obj.mes, function (v) { obj.mes = v; cambio(); }));
      } else {
        var idTxt = "c" + (++contador);
        var txt = el("input", { type: "text", id: idTxt, placeholder: "Por anunciar" });
        txt.value = obj.fecha_texto || "";
        txt.addEventListener("input", function () { obj.fecha_texto = txt.value; cambio(); });
        sel.appendChild(el("div", { class: "selector" }, [el("label", { for: idTxt, class: "selector__etiqueta", texto: "Texto que se mostrará (opcional)" }), txt]));
      }
      cont.appendChild(sel);
      resumen = el("p", { class: "campo__nota resumen-fecha" });
      cont.appendChild(resumen);
      actualizarResumen();
    }
    dibujar();
    return cont;
  }

  // Solo un calendario abierto a la vez; se cierra al hacer clic fuera o con Escape.
  var popActual = null;
  function cerrarPop() { if (popActual) { popActual.cerrar(); popActual = null; } }
  document.addEventListener("mousedown", function (e) {
    if (popActual && !popActual.contenedor.contains(e.target)) cerrarPop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarPop(); });

  function selectorBase(etiqueta, textoBoton, pintarContenido) {
    var id = "c" + (++contador);
    var env = el("div", { class: "selector" });
    var boton = el("button", { type: "button", id: id, class: "selector__boton", "aria-haspopup": "dialog", "aria-expanded": "false" });
    var pop = null;
    function cerrar() { if (pop) { pop.remove(); pop = null; boton.setAttribute("aria-expanded", "false"); } }
    function abrir() {
      cerrarPop();
      pop = el("div", { class: "calendario", role: "dialog", "aria-label": etiqueta });
      env.appendChild(pop);
      boton.setAttribute("aria-expanded", "true");
      popActual = { contenedor: env, cerrar: cerrar };
      pintarContenido(pop, function () { cerrar(); popActual = null; refrescar(); boton.focus(); });
    }
    function refrescar() {
      var t = textoBoton();
      boton.textContent = "📅 " + (t || "Escoge…");
      boton.classList.toggle("selector__boton--vacio", !t);
    }
    boton.addEventListener("click", function () { if (pop) { cerrar(); popActual = null; } else abrir(); });
    refrescar();
    env.appendChild(el("label", { for: id, class: "selector__etiqueta", texto: etiqueta }));
    env.appendChild(boton);
    return env;
  }

  function selectorFecha(etiqueta, valor, alCambiar, opciones) {
    opciones = opciones || {};
    var vista;
    return selectorBase(etiqueta, function () { var d = FX.deISO(valor); return d ? FX.largo(d) : ""; }, function (pop, listo) {
      var base = FX.deISO(valor) || FX.deISO(opciones.min) || new Date();
      vista = { y: base.getFullYear(), m: base.getMonth() };
      var hoyISO = FX.aISO(new Date());
      function pintar() {
        pop.innerHTML = "";
        pop.appendChild(el("div", { class: "calendario__cabeza" }, [
          el("button", { type: "button", class: "calendario__nav", "aria-label": "Mes anterior",
            onclick: function () { vista.m--; if (vista.m < 0) { vista.m = 11; vista.y--; } pintar(); } }, ["‹"]),
          el("strong", { texto: FX.textoMes(vista) }),
          el("button", { type: "button", class: "calendario__nav", "aria-label": "Mes siguiente",
            onclick: function () { vista.m++; if (vista.m > 11) { vista.m = 0; vista.y++; } pintar(); } }, ["›"])
        ]));
        var rejilla = el("div", { class: "calendario__dias" });
        FX.DIAS_CORTOS.forEach(function (d) { rejilla.appendChild(el("span", { class: "calendario__sem", texto: d })); });
        var primero = new Date(vista.y, vista.m, 1).getDay();
        var total = new Date(vista.y, vista.m + 1, 0).getDate();
        for (var i = 0; i < primero; i++) rejilla.appendChild(el("span"));
        for (var dia = 1; dia <= total; dia++) {
          (function (dia) {
            var iso = FX.aISO(new Date(vista.y, vista.m, dia));
            var deshabilitado = opciones.min && FX.deISO(opciones.min) && iso < opciones.min;
            rejilla.appendChild(el("button", {
              type: "button", texto: String(dia), disabled: deshabilitado,
              "aria-label": FX.largo(new Date(vista.y, vista.m, dia)),
              class: "calendario__dia" + (iso === valor ? " calendario__dia--sel" : "") + (iso === hoyISO ? " calendario__dia--hoy" : ""),
              onclick: function () { valor = iso; alCambiar(iso); listo(); }
            }));
          })(dia);
        }
        pop.appendChild(rejilla);
        pop.appendChild(el("div", { class: "calendario__pie" }, [
          el("button", { type: "button", class: "btn btn--borde btn--chico", onclick: function () {
            var b = new Date(); vista = { y: b.getFullYear(), m: b.getMonth() }; pintar();
          } }, ["Ir a hoy"]),
          el("button", { type: "button", class: "btn btn--borde btn--chico", onclick: function () { listo(); } }, ["Cerrar"])
        ]));
      }
      pintar();
    });
  }

  function selectorMes(etiqueta, valor, alCambiar) {
    return selectorBase(etiqueta, function () { var m = FX.deMes(valor); return m ? FX.textoMes(m) : ""; }, function (pop, listo) {
      var actual = FX.deMes(valor);
      var y = actual ? actual.y : new Date().getFullYear();
      function pintar() {
        pop.innerHTML = "";
        pop.appendChild(el("div", { class: "calendario__cabeza" }, [
          el("button", { type: "button", class: "calendario__nav", "aria-label": "Año anterior", onclick: function () { y--; pintar(); } }, ["‹"]),
          el("strong", { texto: String(y) }),
          el("button", { type: "button", class: "calendario__nav", "aria-label": "Año siguiente", onclick: function () { y++; pintar(); } }, ["›"])
        ]));
        var rejilla = el("div", { class: "calendario__meses" });
        var hoy = new Date(), mesActual = hoy.getFullYear() + "-" + (hoy.getMonth() < 9 ? "0" : "") + (hoy.getMonth() + 1);
        FX.MESES.forEach(function (nombre, i) {
          var v = y + "-" + (i < 9 ? "0" : "") + (i + 1);
          rejilla.appendChild(el("button", {
            type: "button", texto: mayus(nombre), title: v < mesActual ? "Este mes ya pasó" : null,
            class: "calendario__mes" + (v === valor ? " calendario__dia--sel" : "") + (v < mesActual ? " calendario__mes--pasado" : ""),
            onclick: function () { valor = v; alCambiar(v); listo(); }
          }));
        });
        pop.appendChild(rejilla);
      }
      pintar();
    });
  }

  function campoFoto(obj, c) {
    var cont = el("div", { class: "campo" });
    function dibujar() {
      cont.innerHTML = "";
      var ruta = obj[c.k] || "";
      var vista = ruta
        ? el("img", { class: "foto__vista", src: srcDe(ruta), alt: "" })
        : el("div", { class: "foto__vista", texto: "Sin foto" });
      if (ruta) vista.addEventListener("error", function () {
        vista.replaceWith(el("div", { class: "foto__vista", texto: "Foto guardada (aparece en unos minutos)" }));
      });
      var archivo = el("input", { type: "file", accept: "image/*", hidden: true });
      archivo.addEventListener("change", function () {
        if (!archivo.files[0]) return;
        ocupado("Preparando foto…");
        prepararFoto(archivo.files[0], "fotos", { recortar: c.recortar }).then(function (r) {
          obj[c.k] = r;
          marcarCambio();
          dibujar();
        }).catch(function (e) { avisar(e.message, true); })
          .then(function () { ocupado(null); });
      });
      cont.appendChild(el("span", { class: "campo__titulo", texto: c.l }));
      cont.appendChild(el("div", { class: "foto" }, [
        vista,
        el("div", { class: "foto__botones" }, [
          el("button", { class: "btn btn--azul btn--chico", type: "button", onclick: function () { archivo.click(); } },
            [ruta ? "Cambiar foto" : "Subir foto"]),
          ruta ? el("button", { class: "btn btn--borde btn--chico", type: "button",
            onclick: function () { obj[c.k] = ""; marcarCambio(); dibujar(); } }, ["Quitar foto"]) : null
        ]),
        archivo
      ]));
      if (c.nota) cont.appendChild(el("p", { class: "campo__nota", texto: c.nota }));
    }
    dibujar();
    return cont;
  }

  // ---------- Álbumes ----------
  function defAlbum() { return SECCIONES.filter(function (s) { return s.key === "albumes"; })[0]; }

  function fotosDe(a) {
    if (!Array.isArray(a.fotos)) a.fotos = [];
    return a.fotos;
  }

  function portadaDe(a) {
    var fotos = fotosDe(a).filter(function (f) { return f && f.foto; });
    if (!fotos.length) return "";
    return fotos.some(function (f) { return f.foto === a.portada; }) ? a.portada : fotos[0].foto;
  }

  function pintarAlbumes(panel, s) {
    if (!Array.isArray(datos.albumes)) datos.albumes = [];
    var arr = datos.albumes;
    if (albumAbierto !== null && arr[albumAbierto]) return pintarAlbum(panel, arr[albumAbierto]);
    albumAbierto = null;

    panel.appendChild(el("h2", { texto: s.titulo }));
    panel.appendChild(el("p", { class: "ayuda", texto: s.ayuda }));
    panel.appendChild(el("button", {
      class: "btn btn--azul", type: "button", style: "margin-bottom:18px",
      onclick: function () {
        arr.unshift({ id: "album-" + Date.now().toString(36), titulo: "", fecha: "", lugar: "", descripcion: "", publicado: false, portada: "", fotos: [] });
        albumAbierto = 0;
        marcarCambio();
        pintar();
        var primero = $("panel").querySelector("input[type=text]");
        if (primero) primero.focus();
      }
    }, ["＋ Crear álbum"]));

    if (!arr.length) {
      panel.appendChild(el("div", { class: "vacio", texto: "Todavía no hay álbumes. Crea el primero con el botón de arriba." }));
      return;
    }
    var rejilla = el("div", { class: "albumes-panel" });
    arr.forEach(function (a, i) {
      var portada = portadaDe(a);
      var n = fotosDe(a).length;
      rejilla.appendChild(el("div", { class: "album-p" }, [
        portada ? el("img", { class: "album-p__img", src: srcDe(portada), alt: "" }) : el("div", { class: "album-p__img album-p__img--vacio", texto: "Sin fotos" }),
        el("div", { class: "album-p__info" }, [
          el("strong", { texto: a.titulo || "(Álbum sin nombre)" }),
          el("span", { texto: [a.fecha, n + (n === 1 ? " foto" : " fotos")].filter(Boolean).join(" · ") }),
          interruptoresAlbum(a)
        ]),
        el("div", { class: "album-p__botones" }, [
          el("button", { class: "btn btn--azul btn--chico", type: "button",
            onclick: function () { albumAbierto = i; pintar(); window.scrollTo(0, 0); } }, ["✏️ Editar"]),
          el("button", { class: "btn btn--icono", type: "button", "aria-label": "Mover antes", disabled: i === 0,
            onclick: function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); marcarCambio(); pintar(); } }, ["↑"]),
          el("button", { class: "btn btn--icono", type: "button", "aria-label": "Mover después", disabled: i === arr.length - 1,
            onclick: function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); marcarCambio(); pintar(); } }, ["↓"]),
          el("button", { class: "btn btn--peligro btn--chico", type: "button",
            onclick: function () {
              if (!confirm("¿Eliminar el álbum \"" + (a.titulo || "sin nombre") + "\" y sus " + n + " fotos? Al guardar, las fotos se borran de la página.")) return;
              arr.splice(i, 1); marcarCambio(); pintar();
            } }, ["🗑"])
        ])
      ]));
    });
    panel.appendChild(rejilla);
  }

  // Interruptor (toggle) accesible.
  function interruptor(texto, encendido, alCambiar, opciones) {
    opciones = opciones || {};
    var input = el("input", { type: "checkbox", role: "switch", class: "interruptor__input", disabled: opciones.desactivado ? true : null });
    input.checked = !!encendido && !opciones.desactivado;
    input.addEventListener("change", function () { alCambiar(input.checked); });
    return el("label", { class: "interruptor" + (opciones.desactivado ? " interruptor--off" : ""), title: opciones.titulo || null }, [
      input, el("span", { class: "interruptor__pista", "aria-hidden": "true" }), el("span", { class: "interruptor__texto", texto: texto })
    ]);
  }

  // «Publicado» y «Recibe fotos» de un álbum, para cambiarlos sin abrirlo.
  function interruptoresAlbum(a) {
    var envios = (datos.subidas || {}).activo === true;
    var sinFotos = !fotosDe(a).length;
    return el("div", { class: "interruptores" }, [
      interruptor("Publicado", a.publicado === true, function (v) {
        a.publicado = v; marcarCambio(); pintar();
        if (v && sinFotos) avisar("El álbum se verá en la página cuando tenga al menos una foto.");
      }),
      interruptor("📤 Recibe fotos", a.recibe_fotos !== false, function (v) {
        a.recibe_fotos = v; marcarCambio(); pintar();
      }, {
        desactivado: !a.publicado || !envios,
        titulo: !envios ? "Activa «Permitir que los miembros envíen fotos» en Fotos de miembros" : !a.publicado ? "Publica el álbum para que reciba fotos" : null
      })
    ]);
  }

  function pintarAlbum(panel, a) {
    var def = defAlbum();
    panel.appendChild(el("button", { class: "btn btn--borde btn--chico", type: "button", style: "margin-bottom:16px",
      onclick: function () { albumAbierto = null; pintar(); window.scrollTo(0, 0); } }, ["← Todos los álbumes"]));
    panel.appendChild(el("h2", { texto: a.titulo || "Álbum nuevo" }));
    panel.appendChild(el("p", { class: "ayuda", texto: "Llena los datos del evento, sube las fotos y marca «Publicado» cuando quieras que se vea en la página." }));
    def.campos.forEach(function (c) { panel.appendChild(campo(a, c)); });
    panel.querySelector("input[type=text]").addEventListener("input", function (e) {
      panel.querySelector("h2").textContent = e.target.value || "Álbum nuevo";
    });

    var fotos = fotosDe(a);
    var titulo = el("h3", { class: "subtitulo", texto: "Fotos (" + fotos.length + ")" });
    var archivo = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
    archivo.addEventListener("change", function () {
      var archivos = Array.prototype.slice.call(archivo.files || []);
      if (!archivos.length) return;
      archivo.value = "";
      if (cargandoFotos) return avisar("Espera a que terminen de cargar las fotos anteriores.", true);
      cargandoFotos = true;
      var hechas = 0, fallidas = 0, total = archivos.length;
      // Vuelve a dibujar el álbum solo si sigue abierto y no se está escribiendo en él.
      var refrescar = function () {
        var abierto = actual === "albumes" && (datos.albumes || [])[albumAbierto] === a;
        var act = document.activeElement;
        var escribiendo = act && /^(INPUT|TEXTAREA|SELECT)$/.test(act.tagName) && $("panel").contains(act);
        if (!abierto || escribiendo) return;
        var y = window.scrollY; pintar(); window.scrollTo(0, y);
      };
      archivos.reduce(function (p, f, i) {
        return p.then(function () {
          var mini = URL.createObjectURL(f);
          progresoFotos("Cargando foto " + (i + 1) + " de " + total + "…", i / total, mini);
          return prepararFoto(f, "fotos/albumes/" + a.id).then(function (ruta) {
            fotos.push({ foto: ruta, descripcion: "", autor: "" });
            hechas++;
            marcarCambio();
            refrescar();
          }, function () { fallidas++; }).then(function () {
            progresoFotos("Cargando foto " + (i + 1) + " de " + total + "…", (i + 1) / total, null);
            setTimeout(function () { URL.revokeObjectURL(mini); }, 1000);
          });
        });
      }, Promise.resolve()).then(function () {
        cargandoFotos = false;
        progresoFotos("✓ " + hechas + " de " + total + (total === 1 ? " foto lista" : " fotos listas"), 1, null);
        setTimeout(function () { if (!cargandoFotos) progresoFotos(null); }, 2500);
        avisar(hechas + (hechas === 1 ? " foto añadida" : " fotos añadidas") +
          (fallidas ? ". " + fallidas + " no se pudieron abrir (usa JPG o PNG)" : "") + ". Recuerda «Guardar cambios».", fallidas > 0);
        refrescar();
      });
    });
    panel.appendChild(el("div", { class: "fila-titulo" }, [
      titulo,
      el("button", { class: "btn btn--oro", type: "button", onclick: function () { archivo.click(); } }, ["📤 Subir fotos"]),
      archivo
    ]));
    panel.appendChild(el("p", { class: "campo__nota", texto: "Puedes escoger muchas fotos a la vez. Se achican solas para que la página cargue rápido. Pide permiso antes de publicar fotos de estudiantes." }));

    if (!fotos.length) {
      panel.appendChild(el("div", { class: "vacio", texto: "Este álbum no tiene fotos todavía. Un álbum sin fotos no aparece en la página." }));
      return;
    }
    var rejilla = el("div", { class: "fotos-panel" });
    var portada = portadaDe(a);
    var otrosAlbumes = (datos.albumes || []).filter(function (x) { return x && x !== a && x.id; });
    fotos.forEach(function (f, i) {
      var desc = el("input", { type: "text", placeholder: "Descripción (opcional)", "aria-label": "Descripción de la foto " + (i + 1) });
      desc.value = f.descripcion || "";
      desc.addEventListener("input", function () { f.descripcion = desc.value; marcarCambio(); });
      var esPortada = f.foto === portada;
      // Fotos enviadas por miembros: el nombre del autor se puede corregir.
      var autor = null;
      if (f.autor) {
        var idAutor = "autor-" + (++contador);
        var campoAutor = el("input", { type: "text", id: idAutor, maxlength: "80", placeholder: "Nombre del autor" });
        campoAutor.value = f.autor;
        campoAutor.addEventListener("input", function () { f.autor = campoAutor.value; marcarCambio(); });
        autor = el("div", { class: "foto-p__campo" }, [
          el("label", { for: idAutor, class: "foto-p__autor", texto: "📷 Enviada por (sale como crédito)" }),
          campoAutor
        ]);
      }
      rejilla.appendChild(el("div", { class: "foto-p" + (esPortada ? " foto-p--portada" : "") }, [
        el("img", { src: srcDe(f.foto), alt: "", loading: "lazy" }),
        autor,
        desc,
        el("div", { class: "foto-p__botones" }, [
          el("button", { class: "btn btn--icono", type: "button", title: "Usar como portada", disabled: esPortada,
            onclick: function () { a.portada = f.foto; marcarCambio(); pintar(); } }, [esPortada ? "★ Portada" : "☆ Portada"]),
          el("button", { class: "btn btn--icono", type: "button", "aria-label": "Mover antes", disabled: i === 0,
            onclick: function () { fotos.splice(i - 1, 0, fotos.splice(i, 1)[0]); marcarCambio(); pintar(); } }, ["←"]),
          el("button", { class: "btn btn--icono", type: "button", "aria-label": "Mover después", disabled: i === fotos.length - 1,
            onclick: function () { fotos.splice(i + 1, 0, fotos.splice(i, 1)[0]); marcarCambio(); pintar(); } }, ["→"]),
          otrosAlbumes.length ? el("button", { class: "btn btn--icono", type: "button", title: "Mover a otro álbum", "aria-expanded": "false",
            onclick: function (e) {
              var caja = e.currentTarget.closest(".foto-p").querySelector(".foto-p__mover");
              caja.hidden = !caja.hidden;
              e.currentTarget.setAttribute("aria-expanded", caja.hidden ? "false" : "true");
              if (!caja.hidden) caja.querySelector("select").focus();
            } }, ["↪ Mover"]) : null,
          el("button", { class: "btn btn--icono btn--rojo", type: "button", "aria-label": "Eliminar foto",
            onclick: function () {
              if (!confirm("¿Eliminar esta foto del álbum?")) return;
              fotos.splice(i, 1);
              if (a.portada === f.foto) a.portada = "";
              marcarCambio(); pintar();
            } }, ["🗑"])
        ]),
        otrosAlbumes.length ? moverFotoCaja(a, f) : null
      ]));
    });
    panel.appendChild(rejilla);
  }

  // Selector para pasar una foto a otro álbum (conserva descripción y autor).
  function moverFotoCaja(origen, f) {
    var sel = el("select", { "aria-label": "Álbum de destino" });
    sel.appendChild(el("option", { value: "", texto: "— Mover a… —" }));
    (datos.albumes || []).forEach(function (x) {
      if (x && x !== origen && x.id) sel.appendChild(el("option", { value: x.id, texto: (x.titulo || "(sin nombre)") + (x.publicado ? "" : " (borrador)") }));
    });
    sel.addEventListener("change", function () {
      var destino = (datos.albumes || []).filter(function (x) { return x.id === sel.value; })[0];
      if (!destino) return;
      var lista = fotosDe(origen), pos = lista.indexOf(f);
      if (pos < 0) return;
      lista.splice(pos, 1);
      if (origen.portada === f.foto) origen.portada = "";
      fotosDe(destino).push(f);
      marcarCambio();
      pintar();
      avisar("Foto movida a «" + (destino.titulo || "álbum") + "». Recuerda «Guardar cambios».");
    });
    return el("div", { class: "foto-p__mover", hidden: true }, [sel]);
  }

  // ---------- 🏠 Inicio (tablero) ----------
  var anadirAlAbrir = null;   // pestaña donde se añade un elemento nuevo al abrirla

  function tarjeta(titulo, cuerpo, accion) {
    return el("div", { class: "tablero__tarjeta" }, [
      el("span", { class: "tablero__titulo", texto: titulo }),
      cuerpo,
      accion || null
    ]);
  }

  function pintarResumen(panel, s) {
    var cap = datos.capitulo || {};
    panel.appendChild(el("div", { class: "panel__cabeza" }, [
      el("h2", { texto: "¡Hola! 👋" }),
      el("p", { class: "ayuda", texto: "Este es el resumen de la página de " + (cap.nombre || "FBLA 3281") + ". ¿Qué quieres hacer hoy?" })
    ]));

    // Accesos rápidos
    var rapidos = el("div", { class: "tablero__rapidos" });
    [["📢", "Nuevo anuncio", "anuncios", true], ["📅", "Nuevo evento", "eventos", true], ["🏆", "Nuevo logro", "logros", true],
     ["📸", "Subir fotos", "albumes", false], ["📄", "Nuevo documento", "documentos", true]].forEach(function (r) {
      rapidos.appendChild(el("button", { type: "button", class: "rapido",
        onclick: function () { if (r[3]) anadirAlAbrir = r[2]; irA(r[2]); } }, [
        el("span", { class: "rapido__icono", texto: r[0] }), el("span", { texto: r[1] })
      ]));
    });
    panel.appendChild(rapidos);

    var rejilla = el("div", { class: "tablero" });

    // Próximo evento
    var ahora = new Date(), prox = null;
    (datos.eventos || []).forEach(function (e) {
      var st = FX.estado(e, ahora);
      if ((st.tipo === "futuro" || st.tipo === "manana" || st.tipo === "hoy") && (!prox || st.dias < prox.st.dias)) prox = { e: e, st: st };
    });
    rejilla.appendChild(tarjeta("📅 Próximo evento", prox
      ? el("div", null, [el("strong", { class: "tablero__grande", texto: prox.e.nombre || "Evento" }),
          el("span", { class: "tablero__sub", texto: FX.texto(prox.e) + " · " + (prox.st.tipo === "hoy" ? "¡Es hoy!" : prox.st.tipo === "manana" ? "¡Es mañana!" : "faltan " + prox.st.dias + " días") })])
      : el("span", { class: "tablero__sub", texto: "No hay eventos con fecha próxima." }),
      el("button", { type: "button", class: "btn btn--borde btn--chico", onclick: function () { irA("eventos"); } }, ["Ver eventos"])));

    // Pendientes de revisar
    var nSug = sugerencias ? sugerencias.filter(function (x) { return !x.estado; }).length : modo === "github" ? null : "—";
    var nFotos = pendientes ? pendientes.filter(function (x) { return x.estado === "pendiente"; }).length : modo === "github" ? null : "—";
    var pend = el("div", { class: "tablero__lista" }, [
      el("button", { type: "button", class: "tablero__fila", onclick: function () { irA("_sugerencias"); } }, [
        el("span", { texto: "💡 Sugerencias de Instagram" }),
        el("strong", { class: nSug ? "tablero__num tablero__num--alerta" : "tablero__num", texto: nSug === null ? "…" : String(nSug) })
      ]),
      el("button", { type: "button", class: "tablero__fila", onclick: function () { irA("subidas"); } }, [
        el("span", { texto: "📤 Fotos de miembros" }),
        el("strong", { class: nFotos ? "tablero__num tablero__num--alerta" : "tablero__num", texto: nFotos === null ? "…" : String(nFotos) })
      ])
    ]);
    rejilla.appendChild(tarjeta("🔔 Esperando tu revisión", pend));

    // Visitas
    var vis = el("div", null, [el("span", { class: "tablero__sub", texto: "Cargando…" })]);
    rejilla.appendChild(tarjeta("📊 Visitas", vis,
      el("button", { type: "button", class: "btn btn--borde btn--chico", onclick: function () { irA("_visitas"); } }, ["Ver detalle"])));
    if (modo === "github" && urlScript()) {
      (visitasCache ? Promise.resolve(visitasCache) : script("visitas")).then(function (r) {
        visitasCache = r;
        var v = r.visitas || { dias: {} }, hoy = FX.deISO(r.hoy) || new Date(), siete = 0;
        for (var i = 0; i < 7; i++) { var d = new Date(hoy); d.setDate(d.getDate() - i); siete += v.dias[FX.aISO(d)] || 0; }
        vis.innerHTML = "";
        vis.appendChild(el("div", { class: "tablero__cifras" }, [
          el("div", null, [el("strong", { class: "tablero__grande", texto: String(v.dias[FX.aISO(hoy)] || 0) }), el("span", { class: "tablero__sub", texto: "hoy" })]),
          el("div", null, [el("strong", { class: "tablero__grande", texto: String(siete) }), el("span", { class: "tablero__sub", texto: "últimos 7 días" })]),
          el("div", null, [el("strong", { class: "tablero__grande", texto: String(v.total || 0) }), el("span", { class: "tablero__sub", texto: "en total" })])
        ]));
      }).catch(function () { vis.innerHTML = ""; vis.appendChild(el("span", { class: "tablero__sub", texto: "No disponible ahora." })); });
    } else {
      vis.innerHTML = ""; vis.appendChild(el("span", { class: "tablero__sub", texto: "Disponible al entrar con tu llave." }));
    }

    // Contenido de la página
    var cuenta = function (k) { return (datos[k] || []).length; };
    rejilla.appendChild(tarjeta("📚 En la página", el("div", { class: "tablero__lista" }, [
      ["📢 Anuncios", "anuncios"], ["📅 Eventos", "eventos"], ["🏆 Logros", "logros"], ["📸 Álbumes", "albumes"], ["📄 Documentos", "documentos"]
    ].map(function (x) {
      return el("button", { type: "button", class: "tablero__fila", onclick: function () { irA(x[1]); } }, [
        el("span", { texto: x[0] }), el("strong", { class: "tablero__num", texto: String(cuenta(x[1])) })
      ]);
    }))));

    // Espacio
    var esp = indicadorEspacio();
    if (esp) rejilla.appendChild(tarjeta("💾 Espacio en GitHub", esp));

    panel.appendChild(rejilla);
    panel.appendChild(el("p", { class: "campo__nota", style: "margin-top:18px", texto: "Atajo: Ctrl + S guarda los cambios." }));
  }

  // ---------- Sugerencias de Instagram ----------
  var sugerencias = null;          // lista que devuelve el script
  var sugerenciasInfo = {};
  var sugerenciasPorConfirmar = []; // aprobadas: se quitan de la lista del script al guardar

  function defDe(key) { return SECCIONES.filter(function (s) { return s.key === key; })[0]; }

  function pintarSugerencias(panel, s) {
    panel.appendChild(el("h2", { texto: s.titulo }));
    panel.appendChild(el("p", { class: "ayuda", texto: s.ayuda }));
    var zona = el("div");
    panel.appendChild(el("div", { class: "fila-titulo", style: "border-top:0;padding-top:0;margin-top:0" }, [
      el("span", { class: "campo__nota", id: "sug-ultima", texto: "" }),
      el("button", { class: "btn btn--azul", type: "button", onclick: function () { cargarSugerencias(zona, true); } }, ["🔄 Revisar Instagram ahora"])
    ]));
    panel.appendChild(zona);
    if (sugerencias) dibujarSugerencias(zona);
    else cargarSugerencias(zona, false);
  }

  function cargarSugerencias(zona, forzar) {
    zona.innerHTML = "";
    zona.appendChild(el("div", { class: "vacio", texto: forzar ? "Revisando Instagram…" : "Cargando sugerencias…" }));
    script("sugerencias", { forzar: forzar }).then(function (r) {
      var yaAprobadas = {};
      (sugerencias || []).forEach(function (x) { if (x.estado === "aprobada") yaAprobadas[x.id] = x; });
      sugerencias = (r.sugerencias || []).map(function (x) { return yaAprobadas[x.id] || x; });
      sugerenciasInfo = r;
      dibujarSugerencias(zona);
      if (forzar) avisar(r.nuevas ? r.nuevas + (r.nuevas === 1 ? " sugerencia nueva." : " sugerencias nuevas.") : "No hay publicaciones nuevas con eventos o logros.");
    }).catch(function (e) {
      zona.innerHTML = "";
      zona.appendChild(el("div", { class: "vacio", texto: e.message }));
    });
  }

  function dibujarSugerencias(zona) {
    zona.innerHTML = "";
    actualizarContadores();
    var ult = $("sug-ultima");
    if (ult && sugerenciasInfo.ultima) ult.textContent = "Última revisión: " + new Date(sugerenciasInfo.ultima).toLocaleString("es-PR", { dateStyle: "medium", timeStyle: "short" });
    if (sugerenciasInfo.aviso) zona.appendChild(el("div", { class: "aviso", texto: sugerenciasInfo.aviso }));
    var lista = (sugerencias || []).filter(function (x) { return x.estado !== "descartada"; });
    if (!lista.length) {
      zona.appendChild(el("div", { class: "vacio", texto: "No hay sugerencias pendientes. 🎉 Se revisa Instagram una vez al día." }));
      return;
    }
    lista.forEach(function (sug) { zona.appendChild(tarjetaSugerencia(sug, zona)); });
  }

  function tarjetaSugerencia(sug, zona) {
    var post = sug.post || {};
    var card = el("div", { class: "sug" + (sug.estado === "aprobada" ? " sug--aprobada" : "") });
    var fechaPost = post.fecha ? new Date(post.fecha).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" }) : "";

    // Columna de la publicación original
    var texto = el("p", { class: "sug__texto", texto: post.texto || "" });
    card.appendChild(el("div", { class: "sug__post" }, [
      post.imagen ? el("img", { src: post.imagen, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null,
      el("span", { class: "campo__nota", texto: "Publicado en Instagram" + (fechaPost ? " el " + fechaPost : "") }),
      texto,
      post.permalink ? el("a", { href: post.permalink, target: "_blank", rel: "noopener", class: "sug__enlace", texto: "Ver publicación ↗" }) : null
    ]));

    // Columna editable
    var form = el("div", { class: "sug__form" });
    if (sug.estado === "aprobada") {
      form.appendChild(el("strong", { class: "foto-p__ok", texto: "✓ Añadido a " + (sug.tipo === "logro" ? "Logros" : "Eventos") + " — se publica al «Guardar cambios»" }));
      card.appendChild(form);
      return card;
    }
    var tipos = el("div", { class: "tipos-fecha", role: "radiogroup", "aria-label": "Tipo" });
    [["evento", "📅 Evento"], ["logro", "🏆 Logro"]].forEach(function (tp) {
      tipos.appendChild(el("button", {
        type: "button", role: "radio", "aria-checked": sug.tipo === tp[0] ? "true" : "false",
        class: "tipo-fecha" + (sug.tipo === tp[0] ? " tipo-fecha--activo" : ""),
        onclick: function () {
          if (sug.tipo === tp[0]) return;
          // Pasa el texto principal de un tipo al otro
          if (tp[0] === "logro") { sug.titulo = sug.titulo || sug.nombre || ""; sug.detalle = sug.detalle || ""; }
          else { sug.nombre = sug.nombre || sug.titulo || ""; if (!sug.tipo_fecha) sug.tipo_fecha = "dia"; }
          sug.tipo = tp[0];
          card.replaceWith(tarjetaSugerencia(sug, zona));
        }
      }, [tp[1]]));
    });
    form.appendChild(tipos);
    var def = defDe(sug.tipo === "logro" ? "logros" : "eventos");
    def.campos.forEach(function (c) { form.appendChild(campo(sug, c)); });
    // Editar una sugerencia no es un cambio de la página hasta que se aprueba.
    form.addEventListener("pointerdown", function () { silencioCambios = true; }, true);
    form.addEventListener("focusin", function () { silencioCambios = true; }, true);
    form.appendChild(el("div", { class: "foto-p__botones" }, [
      el("button", { class: "btn btn--azul", type: "button", onclick: function () { aprobarSugerencia(sug, zona); } },
        ["✓ Añadir a " + (sug.tipo === "logro" ? "Logros" : "Eventos")]),
      el("button", { class: "btn btn--peligro", type: "button", onclick: function () { descartarSugerencia(sug, zona); } }, ["✕ Descartar"])
    ]));
    card.appendChild(form);
    return card;
  }

  function aprobarSugerencia(sug, zona) {
    silencioCambios = false;
    if (modo !== "github") return avisar("Entra con tu token para aprobar sugerencias.", true);
    var item;
    if (sug.tipo === "logro") {
      if (vacio(sug.titulo)) return avisar("Escribe el título del logro.", true);
      item = { titulo: String(sug.titulo).trim(), competencia: String(sug.competencia || "").trim(),
        detalle: String(sug.detalle || "").trim(), anio_academico: sug.anio_academico || FX.anioAcademicoActual() };
      if (!Array.isArray(datos.logros)) datos.logros = [];
      datos.logros.unshift(item);
    } else {
      if (vacio(sug.nombre)) return avisar("Escribe el nombre del evento.", true);
      item = { nombre: String(sug.nombre).trim(), tipo_fecha: sug.tipo_fecha || "dia", hora: sug.hora || "", lugar: sug.lugar || "", descripcion: sug.descripcion || "" };
      ["inicio", "fin", "mes", "fecha_texto"].forEach(function (k) { if (sug[k]) item[k] = sug[k]; });
      item.fecha = FX.texto(item);
      if (!Array.isArray(datos.eventos)) datos.eventos = [];
      datos.eventos.push(item);
    }
    sug.estado = "aprobada";
    sugerenciasPorConfirmar.push(sug.id);
    marcarCambio();
    dibujarSugerencias(zona);
    avisar("Añadido a " + (sug.tipo === "logro" ? "Logros" : "Eventos") + ". Recuerda «Guardar cambios».");
  }

  function descartarSugerencia(sug, zona) {
    if (!confirm("¿Descartar esta sugerencia? No se añadirá a la página.")) return;
    ocupado("Descartando…");
    script("resolverSugerencia", { id: sug.id }).then(function () {
      sug.estado = "descartada";
      dibujarSugerencias(zona);
    }).catch(function (e) { avisar(e.message, true); })
      .then(function () { ocupado(null); });
  }

  // ---------- Visitas ----------
  var visitasCache = null;

  function pintarVisitas(panel, s) {
    panel.appendChild(el("h2", { texto: s.titulo }));
    panel.appendChild(el("p", { class: "ayuda", texto: s.ayuda }));
    var zona = el("div");
    panel.appendChild(el("button", { class: "btn btn--azul", type: "button", style: "margin-bottom:16px",
      onclick: function () { cargarVisitas(zona); } }, ["🔄 Actualizar"]));
    panel.appendChild(zona);
    if (visitasCache) dibujarVisitas(zona, visitasCache);
    else cargarVisitas(zona);
  }

  function cargarVisitas(zona) {
    zona.innerHTML = "";
    zona.appendChild(el("div", { class: "vacio", texto: "Cargando visitas…" }));
    script("visitas").then(function (r) {
      visitasCache = r;
      dibujarVisitas(zona, r);
    }).catch(function (e) {
      zona.innerHTML = "";
      zona.appendChild(el("div", { class: "vacio", texto: e.message }));
    });
  }

  function dibujarVisitas(zona, r) {
    zona.innerHTML = "";
    var v = r.visitas || { total: 0, dias: {}, paginas: {} };
    var hoy = FX.deISO(r.hoy) || new Date();
    function dia(offset) { var d = new Date(hoy); d.setDate(d.getDate() - offset); return FX.aISO(d); }
    function suma(n) { var t = 0; for (var i = 0; i < n; i++) t += v.dias[dia(i)] || 0; return t; }

    if (!v.total) {
      zona.appendChild(el("div", { class: "vacio", texto: "Todavía no hay visitas registradas. El conteo empieza desde que se instaló la versión nueva del script." }));
      return;
    }
    var tarjetas = el("div", { class: "visitas-tarjetas" });
    [["Hoy", v.dias[dia(0)] || 0], ["Últimos 7 días", suma(7)], ["Últimos 30 días", suma(30)], ["Total", v.total]].forEach(function (x) {
      tarjetas.appendChild(el("div", { class: "visitas-tarjeta" }, [
        el("span", { class: "visitas-tarjeta__num", texto: String(x[1]) }),
        el("span", { class: "visitas-tarjeta__txt", texto: x[0] })
      ]));
    });
    zona.appendChild(tarjetas);

    // Gráfica de los últimos 30 días
    zona.appendChild(el("h3", { class: "subtitulo", style: "margin:24px 0 10px", texto: "Visitas por día (últimos 30 días)" }));
    var max = 1, valores = [];
    for (var i = 29; i >= 0; i--) { var n = v.dias[dia(i)] || 0; valores.push([dia(i), n]); if (n > max) max = n; }
    var grafica = el("div", { class: "grafica", role: "img", "aria-label": "Gráfica de visitas por día" });
    valores.forEach(function (x) {
      var d = FX.deISO(x[0]);
      var etiqueta = d.getDate() + " " + FX.MESES_CORTOS[d.getMonth()];
      grafica.appendChild(el("div", { class: "grafica__col", title: etiqueta + ": " + x[1] + (x[1] === 1 ? " visita" : " visitas") }, [
        el("span", { class: "grafica__num", texto: x[1] ? String(x[1]) : "" }),
        el("div", { class: "grafica__barra", style: "height:" + Math.max(2, Math.round(x[1] / max * 120)) + "px" }),
        el("span", { class: "grafica__dia", texto: d.getDate() === 1 || x === valores[0] || x === valores[valores.length - 1] ? etiqueta : String(d.getDate()) })
      ]));
    });
    zona.appendChild(grafica);

    // Páginas y álbumes más vistos
    var nombres = { inicio: "🏠 Página principal", subir: "📤 Enviar fotos" };
    (datos.albumes || []).forEach(function (a) { if (a && a.id) nombres["album:" + a.id] = "📸 " + (a.titulo || "Álbum"); });
    var pags = Object.keys(v.paginas || {}).sort(function (a, b) { return v.paginas[b] - v.paginas[a]; });
    if (pags.length) {
      zona.appendChild(el("h3", { class: "subtitulo", style: "margin:24px 0 10px", texto: "Lo más visto" }));
      var tabla = el("table", { class: "tabla-visitas" });
      tabla.appendChild(el("thead", null, [el("tr", null, [el("th", { texto: "Página" }), el("th", { texto: "Visitas" })])]));
      var cuerpo = el("tbody");
      pags.forEach(function (p) {
        cuerpo.appendChild(el("tr", null, [el("td", { texto: nombres[p] || (p.indexOf("album:") === 0 ? "📸 Álbum eliminado" : p) }), el("td", { texto: String(v.paginas[p]) })]));
      });
      tabla.appendChild(cuerpo);
      zona.appendChild(tabla);
    }
  }

  // ---------- Fotos de miembros ----------
  function pintarMiembros(panel) {
    // Al activar o desactivar los envíos, se actualizan los interruptores de los álbumes.
    panel.querySelectorAll("input[type=checkbox]").forEach(function (c) {
      c.addEventListener("change", function () { var y = window.scrollY; pintar(); window.scrollTo(0, y); });
    });
    var paginaSubir = location.origin + location.pathname.replace(/admin(\.html)?$/i, "") + "subir.html";
    panel.appendChild(el("div", { class: "aviso aviso--info" }, [
      "Enlace para compartir con los miembros: ",
      el("a", { href: paginaSubir, target: "_blank", rel: "noopener", texto: paginaSubir }),
      el("br"),
      "En cada álbum de la página también aparece el botón «Subir mis fotos» cuando esta opción está activa y el álbum está publicado."
    ]));

    // Qué álbumes aceptan envíos (sin tener que abrir cada uno).
    var albumes = (datos.albumes || []).filter(function (a) { return a && a.id; });
    panel.appendChild(el("h3", { class: "subtitulo", texto: "Álbumes que reciben fotos" }));
    if ((datos.subidas || {}).activo !== true) {
      panel.appendChild(el("p", { class: "campo__nota", texto: "Activa «Permitir que los miembros envíen fotos» (arriba) para que los álbumes puedan recibir fotos." }));
    }
    if (!albumes.length) {
      panel.appendChild(el("div", { class: "vacio", texto: "Todavía no hay álbumes. Créalos en «Álbumes de fotos»." }));
    } else {
      panel.appendChild(el("div", { class: "albumes-envios" }, albumes.map(function (a) {
        var n = fotosDe(a).length;
        return el("div", { class: "album-envio" }, [
          el("div", { class: "album-envio__info" }, [
            el("strong", { texto: a.titulo || "(Álbum sin nombre)" }),
            el("span", { texto: [a.fecha, n + (n === 1 ? " foto" : " fotos")].filter(Boolean).join(" · ") })
          ]),
          interruptoresAlbum(a)
        ]);
      })));
    }

    var zona = el("div", { class: "pendientes" });
    panel.appendChild(el("div", { class: "fila-titulo" }, [
      el("h3", { class: "subtitulo", texto: "Fotos esperando aprobación" }),
      el("button", { class: "btn btn--azul buscar-fotos", type: "button", onclick: function () { buscarPendientes(zona); } }, ["🔄 Buscar fotos nuevas"])
    ]));
    panel.appendChild(zona);
    if (pendientes) { pintarPendientes(zona); cargarImagenesPendientes(zona); }
    else zona.appendChild(el("div", { class: "vacio", texto: "Buscando fotos nuevas…" }));
    // Al entrar a esta sección se buscan fotos solas (no más de una vez cada 30 segundos).
    if (Date.now() - buscadoAl > 30000) buscarPendientes(zona, true);
  }

  var buscadoAl = 0;
  function buscarPendientes(zona, silencioso) {
    buscadoAl = Date.now();
    if (!silencioso) ocupado("Buscando fotos…");
    var boton = $("panel").querySelector(".buscar-fotos");
    if (boton) { boton.disabled = true; boton.textContent = "🔄 Buscando…"; }
    script("pendientes").then(function (r) {
      var ya = {};
      (pendientes || []).forEach(function (p) { ya[p.id] = p; });
      pendientes = (r.fotos || []).map(function (p) {
        var previa = ya[p.id];
        if (previa) return previa;
        p.estado = "pendiente";
        return p;
      });
      if (!zona.isConnected) { actualizarContadores(); return; }   // ya se salió de la sección
      pintarPendientes(zona);
      cargarImagenesPendientes(zona);
    }).catch(function (e) {
      avisar(e.message, true);
      if (zona.isConnected && !pendientes) { zona.innerHTML = ""; zona.appendChild(el("div", { class: "vacio", texto: "No se pudieron buscar las fotos. Usa «Buscar fotos nuevas» para intentarlo otra vez." })); }
    }).then(function () {
      ocupado(null);
      var b = $("panel").querySelector(".buscar-fotos");
      if (b) { b.disabled = false; b.textContent = "🔄 Buscar fotos nuevas"; }
    });
  }

  // Descarga las fotos pendientes una por una, con una barra en cada foto y otra general.
  var cargandoPendientes = false;
  function cargarImagenesPendientes(zona) {
    if (cargandoPendientes) return;
    var cola = (pendientes || []).filter(function (p) { return !p.datos && !p.vista && p.estado !== "rechazada"; });
    if (!cola.length) return;
    cargandoPendientes = true;
    // La sección puede volver a dibujarse mientras se carga: siempre se usa la zona visible.
    var zonaActual = function () { return document.querySelector("#panel .pendientes") || zona; };
    cola.forEach(function (p) { p.error = false; });
    var total = cola.length;
    var general = function (hechas, fraccion) {
      var g = zonaActual().querySelector(".pendientes__progreso");
      if (!g) return;
      g.hidden = hechas >= total;
      g.querySelector(".pendientes__texto").textContent = "Cargando fotos: " + Math.min(hechas + 1, total) + " de " + total + "…";
      g.querySelector(".barra-progreso span").style.width = Math.round(((hechas + (fraccion || 0)) / total) * 100) + "%";
    };
    var marco = function (p) { return zonaActual().querySelector('[data-pendiente="' + p.id + '"] .foto-p__marco'); };
    var pintarMarco = function (p, fraccion) {
      var m = marco(p);
      if (!m) return;
      m.setAttribute("data-carga", p.datos || p.vista ? "lista" : p.error ? "error" : p.cargando ? "cargando" : "espera");
      var b = m.querySelector(".foto-p__barra span");
      if (b) {
        b.classList.toggle("indeterminada", p.cargando && fraccion === null);
        b.style.width = p.cargando && fraccion !== null && fraccion !== undefined ? Math.round(fraccion * 100) + "%" : p.cargando ? "" : "0%";
      }
    };
    general(0, 0);
    cola.reduce(function (cadena, p, i) {
      return cadena.then(function () {
        if (p.estado === "rechazada") return;
        p.cargando = true;
        pintarMarco(p, 0);
        // Primero la vista previa liviana; la foto original se descarga solo al aprobar.
        // (Si el script aún no tiene «vista», se usa la foto completa.)
        var avance = function (f) { pintarMarco(p, f); general(i, f || 0); };
        return script("vista", { id: p.id, lado: 700, _progreso: avance }).catch(function (e) {
          if (!/desconocida/i.test(e.message)) throw e;
          return script("foto", { id: p.id, _esperado: p.tamano ? Math.round(p.tamano * 4 / 3) + 200 : 0, _progreso: avance });
        }).then(function (r) {
          if (r.vista) { p.vista = r.datos; p.tipoVista = r.tipo; }
          else { p.datos = r.datos; p.tipo = r.tipo; }
          var img = zonaActual().querySelector('[data-pendiente="' + p.id + '"] img');
          if (img) img.src = (p.datos || p.vista ? "data:" + (p.datos ? p.tipo : p.tipoVista) + ";base64," + (p.datos || p.vista) : null);
        }).catch(function () { p.error = true; }).then(function () {
          p.cargando = false;
          pintarMarco(p);
          general(i + 1, 0);
        });
      });
    }, Promise.resolve()).then(function () {
      cargandoPendientes = false;
      // Si llegaron fotos nuevas mientras tanto, se cargan también.
      if ((pendientes || []).some(function (p) { return !p.datos && !p.vista && !p.error && p.estado !== "rechazada"; })) cargarImagenesPendientes(zona);
    });
  }

  function pintarPendientes(zona) {
    zona.innerHTML = "";
    actualizarContadores();
    var lista = (pendientes || []).filter(function (p) { return p.estado !== "rechazada"; });
    if (!lista.length) {
      zona.appendChild(el("div", { class: "vacio", texto: "No hay fotos nuevas. 🎉" }));
      return;
    }
    var albumes = (datos.albumes || []).filter(function (a) { return a && a.id; });
    var faltan = lista.filter(function (p) { return !p.datos && !p.vista; }).length;
    zona.appendChild(el("div", { class: "pendientes__progreso", hidden: !faltan || !cargandoPendientes ? true : null, role: "status", "aria-live": "polite" }, [
      el("p", { class: "pendientes__texto", texto: "Cargando fotos…" }),
      el("div", { class: "barra-progreso", role: "progressbar", "aria-label": "Fotos cargadas" }, [el("span")])
    ]));
    var rejilla = el("div", { class: "fotos-panel" });
    lista.forEach(function (p) {
      var sel = el("select", { "aria-label": "Álbum para esta foto" });
      sel.appendChild(el("option", { value: "", texto: "— Escoge un álbum —" }));
      albumes.forEach(function (a) {
        var o = el("option", { value: a.id, texto: a.titulo || "(sin nombre)" });
        if (a.id === p.album) o.selected = true;
        sel.appendChild(o);
      });
      var aprobada = p.estado === "aprobada";
      var nombre = el("input", { type: "text", maxlength: "80", placeholder: "Nombre del autor", "aria-label": "Nombre del autor (crédito)" });
      nombre.value = p.nombre || "";
      sel.addEventListener("change", function () { p.album = sel.value; });
      nombre.addEventListener("input", function () { p.nombre = nombre.value; });
      var info = [p.albumTitulo ? "Para: " + p.albumTitulo : "", p.nombre ? "Enviada por: " + p.nombre : "", p.fecha ? new Date(p.fecha).toLocaleDateString("es-PR") : ""]
        .filter(Boolean).join(" · ");
      rejilla.appendChild(el("div", { class: "foto-p" + (aprobada ? " foto-p--aprobada" : ""), "data-pendiente": p.id }, [
        el("div", { class: "foto-p__marco", title: "Ver en grande", onclick: function () { if (p.datos || p.vista) abrirVisorPendientes(p, zona); }, "data-carga": p.datos || p.vista ? "lista" : p.error ? "error" : p.cargando ? "cargando" : "espera" }, [
          el("img", { src: (p.datos || p.vista ? "data:" + (p.datos ? p.tipo : p.tipoVista) + ";base64," + (p.datos || p.vista) : null), alt: "Foto enviada" }),
          el("div", { class: "foto-p__cargando" }, [
            el("span", { class: "foto-p__estado-texto" }),
            el("div", { class: "foto-p__barra" }, [el("span")]),
            el("button", { class: "btn btn--borde btn--chico foto-p__reintentar", type: "button", onclick: function () { p.error = false; pintarPendientes(zona); cargarImagenesPendientes(zona); } }, ["Reintentar"])
          ])
        ]),
        el("span", { class: "foto-p__info", texto: info }),
        p.nota ? el("span", { class: "foto-p__info", texto: "«" + p.nota + "»" }) : null,
        aprobada
          ? el("strong", { class: "foto-p__ok", texto: "✓ Aprobada — se publica al «Guardar cambios»" })
          : el("div", { class: "foto-p__aprobar" }, [
            sel,
            el("div", { class: "foto-p__campo" }, [el("span", { class: "foto-p__autor", texto: "📷 Crédito" }), nombre]),
            el("div", { class: "foto-p__botones" }, [
              el("button", { class: "btn btn--azul btn--chico", type: "button", onclick: function () { p.nombre = nombre.value.trim(); aprobar(p, sel.value, zona); } }, ["✓ Aprobar"]),
              el("button", { class: "btn btn--peligro btn--chico", type: "button", onclick: function () { rechazar(p, zona); } }, ["✕ Rechazar"])
            ])
          ])
      ]));
    });
    zona.appendChild(rejilla);
  }

  function aprobar(p, albumId, zona) {
    var a = (datos.albumes || []).filter(function (x) { return x.id === albumId; })[0];
    if (!a) { avisar("Escoge el álbum donde va la foto.", true); return Promise.resolve(false); }
    if (!p.datos && !p.vista) { avisar("La foto todavía se está cargando. Espera un momento.", true); return Promise.resolve(false); }
    if (modo !== "github") { avisar("Entra con tu token para aprobar fotos.", true); return Promise.resolve(false); }
    if (p.estado === "aprobando") return Promise.resolve(false);
    p.album = albumId;
    p.estado = "aprobando";
    // La vista previa es liviana: para publicar se baja la foto original (calidad completa).
    var original = p.datos ? Promise.resolve() : (function () {
      ocupado("Descargando la foto original…", 0);
      return script("foto", { id: p.id, _esperado: p.tamano ? Math.round(p.tamano * 4 / 3) + 200 : 0,
        _progreso: function (f) { ocupado("Descargando la foto original…", f); } }).then(function (r) {
        p.datos = r.datos; p.tipo = r.tipo;
      });
    })();
    return original.then(function () {
      ocupado("Preparando la foto…");
      // Se guarda en WebP (la mitad del espacio, misma calidad).
      return aWebP(p.tipo, p.datos);
    }).then(function (f) {
      ocupado(null);
      var ruta = "fotos/albumes/" + a.id + "/" + nombreSeguro(p.archivo || "foto-miembro", f.ext);
      porSubir[ruta] = f.datos;
      vistas[ruta] = "data:" + f.tipo + ";base64," + f.datos;
      fotosDe(a).push({ foto: ruta, descripcion: "", autor: p.nombre || "" });
      p.estado = "aprobada";
      aprobadas.push(p.id);
      marcarCambio();
      pintarPendientes(zona);
      avisar("Foto añadida a «" + (a.titulo || "álbum") + "». Recuerda «Guardar cambios».");
      return true;
    }).catch(function (e) {
      ocupado(null);
      p.estado = "pendiente";
      avisar("No se pudo descargar la foto original: " + e.message, true);
      return false;
    });
  }

  function rechazar(p, zona) {
    if (!confirm("¿Rechazar esta foto? Se borrará y no se publicará.")) return Promise.resolve(false);
    ocupado("Rechazando…");
    return script("resolver", { id: p.id, aprobar: false }).then(function () {
      p.estado = "rechazada";
      pintarPendientes(zona);
      return true;
    }).catch(function (e) { avisar(e.message, true); return false; })
      .then(function (ok) { ocupado(null); return ok; });
  }

  // ---------- Visor (galería) de fotos pendientes ----------
  // Mismo formato que la galería de la página: foto grande, ‹ ›, deslizar en el celular.
  // Muestra la vista previa y en seguida baja la original (calidad completa).
  var visorP = null;
  function abrirVisorPendientes(p, zona) {
    var lista = function () { return (pendientes || []).filter(function (x) { return x.estado !== "rechazada"; }); };
    var pos = Math.max(0, lista().indexOf(p));
    if (visorP) visorP.remove();
    var img = el("img", { alt: "Foto enviada" });
    var pie = el("figcaption");
    var barra = el("div", { class: "barra-progreso visor__barra", role: "progressbar", "aria-label": "Descargando la foto original" }, [el("span")]);
    var calidad = el("span", { class: "visor__calidad" });
    var cuenta = el("span", { class: "visor__cuenta" });
    var sel = el("select", { class: "visor__album", "aria-label": "Álbum para esta foto" });
    var credito = el("input", { type: "text", class: "visor__credito", maxlength: "80", placeholder: "Crédito (autor)", "aria-label": "Nombre del autor (crédito)" });
    var bAprobar = el("button", { class: "btn btn--azul", type: "button" }, ["✓ Aprobar"]);
    var bRechazar = el("button", { class: "btn btn--peligro", type: "button" }, ["✕ Rechazar"]);
    var estado = el("strong", { class: "visor__ok" });
    var ant = el("button", { class: "visor__btn visor__ant", type: "button", "aria-label": "Foto anterior" }, ["‹"]);
    var sig = el("button", { class: "visor__btn visor__sig", type: "button", "aria-label": "Foto siguiente" }, ["›"]);
    var cerrarB = el("button", { class: "visor__btn visor__cerrar", type: "button", "aria-label": "Cerrar" }, ["✕"]);
    visorP = el("div", { class: "visor", role: "dialog", "aria-modal": "true", "aria-label": "Foto enviada por un miembro" }, [
      cerrarB, ant,
      el("figure", { class: "visor__fig" }, [img, calidad, barra, pie]),
      sig,
      el("div", { class: "visor__pie" }, [cuenta, sel, credito, estado, bRechazar, bAprobar])
    ]);
    document.body.appendChild(visorP);
    document.body.style.overflow = "hidden";

    var cerrar = function () {
      if (!visorP) return;
      visorP.remove(); visorP = null;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", teclas);
    };
    var actual = function () { return lista()[pos]; };
    var mostrar = function () {
      var l = lista();
      if (!l.length) return cerrar();
      pos = (pos + l.length) % l.length;
      var f = l[pos];
      img.src = f.datos ? "data:" + f.tipo + ";base64," + f.datos : f.vista ? "data:" + f.tipoVista + ";base64," + f.vista : "";
      pie.textContent = [f.albumTitulo ? "Para: " + f.albumTitulo : "", f.nombre ? "📷 " + f.nombre : "", f.fecha ? new Date(f.fecha).toLocaleDateString("es-PR") : "", f.nota ? "«" + f.nota + "»" : ""].filter(Boolean).join(" · ");
      cuenta.textContent = (pos + 1) + " de " + l.length;
      ant.hidden = sig.hidden = l.length < 2;
      sel.innerHTML = "";
      sel.appendChild(el("option", { value: "", texto: "— Escoge un álbum —" }));
      (datos.albumes || []).filter(function (a) { return a && a.id; }).forEach(function (a) {
        var o = el("option", { value: a.id, texto: a.titulo || "(sin nombre)" });
        if (a.id === f.album) o.selected = true;
        sel.appendChild(o);
      });
      credito.value = f.nombre || "";
      var aprobada = f.estado === "aprobada";
      sel.hidden = credito.hidden = bAprobar.hidden = bRechazar.hidden = aprobada;
      estado.hidden = !aprobada;
      estado.textContent = "✓ Aprobada — se publica al «Guardar cambios»";
      calidad.textContent = "";
      barra.hidden = true;
      if (!f.datos) bajarOriginal(f);
    };
    // Baja la foto original para verla con toda su calidad (y deja lista la aprobación).
    var bajarOriginal = function (f) {
      if (f.bajando) { barra.hidden = false; calidad.textContent = "Cargando la foto original…"; return; }
      f.bajando = true;
      barra.hidden = false;
      calidad.textContent = "Cargando la foto original…";
      barra.querySelector("span").style.width = "0%";
      script("foto", { id: f.id, _esperado: f.tamano ? Math.round(f.tamano * 4 / 3) + 200 : 0, _progreso: function (x) {
        if (visorP && actual() === f) barra.querySelector("span").style.width = Math.round((x || 0) * 100) + "%";
      } }).then(function (r) {
        f.datos = r.datos; f.tipo = r.tipo;
        if (visorP && actual() === f) { img.src = "data:" + f.tipo + ";base64," + f.datos; barra.hidden = true; calidad.textContent = ""; }
      }).catch(function () {
        if (visorP && actual() === f) { barra.hidden = true; calidad.textContent = "No se pudo cargar la original; se muestra la vista previa."; }
      }).then(function () { f.bajando = false; });
    };
    var mover = function (paso) { pos += paso; mostrar(); };
    // Tras aprobar o rechazar, pasa a la siguiente foto que falte por revisar.
    var siguientePendiente = function () {
      var l = lista();
      if (!l.length) return cerrar();
      for (var k = 0; k < l.length; k++) {
        var j = (pos + k) % l.length;
        if (l[j].estado !== "aprobada") { pos = j; return mostrar(); }
      }
      avisar("¡Revisaste todas las fotos! Recuerda «Guardar cambios».");
      cerrar();
    };
    sel.addEventListener("change", function () { actual().album = sel.value; });
    credito.addEventListener("input", function () { actual().nombre = credito.value; });
    bAprobar.addEventListener("click", function () {
      var f = actual();
      f.nombre = credito.value.trim();
      aprobar(f, sel.value, document.querySelector("#panel .pendientes") || zona).then(function (ok) { if (ok && visorP) { pos = lista().indexOf(f); siguientePendiente(); } });
    });
    bRechazar.addEventListener("click", function () {
      var f = actual();
      rechazar(f, document.querySelector("#panel .pendientes") || zona).then(function (ok) { if (ok && visorP) siguientePendiente(); });
    });
    ant.addEventListener("click", function () { mover(-1); });
    sig.addEventListener("click", function () { mover(1); });
    cerrarB.addEventListener("click", cerrar);
    visorP.addEventListener("click", function (e) { if (e.target === visorP) cerrar(); });
    var x0 = null;
    visorP.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    visorP.addEventListener("touchend", function (e) {
      if (x0 === null || e.target.closest(".visor__pie")) { x0 = null; return; }
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
      x0 = null;
    });
    var teclas = function (e) {
      if (!visorP || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { if (e.key === "Escape") cerrar(); return; }
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight") mover(1);
      else if (e.key === "ArrowLeft") mover(-1);
    };
    document.addEventListener("keydown", teclas);
    mostrar();
    cerrarB.focus();
  }

  // ---------- Fotos ----------
  function nombreSeguro(nombre, ext) {
    var base = String(nombre).replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "foto";
    return base + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + "." + ext;
  }

  // ---------- Compresión de fotos ----------
  // WebP ocupa ~la mitad que JPG con la misma calidad (medido: 197 KB → 103 KB).
  // Si el navegador no sabe crear WebP (Safari viejo), se usa JPG.
  var CALIDAD = 0.85;
  function comprimirFoto(canvas) {
    var webp = canvas.toDataURL("image/webp", CALIDAD);
    if (webp.indexOf("data:image/webp") === 0) return { dataUrl: webp, ext: "webp" };
    return { dataUrl: canvas.toDataURL("image/jpeg", CALIDAD), ext: "jpg" };
  }

  function tieneTransparencia(ctx, w, h) {
    var d = ctx.getImageData(0, 0, w, h).data;
    for (var i = 3; i < d.length; i += 16) if (d[i] < 250) return true;   // revisa 1 de cada 4 píxeles
    return false;
  }

  // Convierte una foto (base64) a WebP; si no se puede, la deja igual.
  function aWebP(tipo, base64) {
    return new Promise(function (ok) {
      if (/webp/.test(tipo)) return ok({ tipo: tipo, datos: base64, ext: "webp" });
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        var x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0);
        var r = comprimirFoto(c);
        var nuevo = r.dataUrl.split(",")[1];
        // Solo se usa si de verdad ocupa menos.
        if (nuevo.length < base64.length) ok({ tipo: r.ext === "webp" ? "image/webp" : "image/jpeg", datos: nuevo, ext: r.ext });
        else ok({ tipo: tipo, datos: base64, ext: /png/.test(tipo) ? "png" : "jpg" });
      };
      img.onerror = function () { ok({ tipo: tipo, datos: base64, ext: /png/.test(tipo) ? "png" : "jpg" }); };
      img.src = "data:" + tipo + ";base64," + base64;
    });
  }

  // Calcula el área con contenido (sin márgenes blancos o transparentes).
  function areaConContenido(img) {
    var c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    var ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var d = ctx.getImageData(0, 0, c.width, c.height).data;
    // Si la imagen tiene transparencia, solo se recorta lo transparente
    // (así un logo blanco no pierde sus partes blancas). Si no, se recorta el blanco.
    var conTransparencia = false;
    for (var k = 3; k < d.length; k += 4) { if (d[k] < 250) { conTransparencia = true; break; } }
    var x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (var y = 0; y < c.height; y++) {
      for (var x = 0; x < c.width; x++) {
        var i = (y * c.width + x) * 4;
        var vacio = conTransparencia ? d[i + 3] < 16 : (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240);
        if (!vacio) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return { x: 0, y: 0, w: c.width, h: c.height };
    var m = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);   // pequeño margen
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m);
    x1 = Math.min(c.width - 1, x1 + m); y1 = Math.min(c.height - 1, y1 + m);
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  function prepararImagen(file, opciones) {
    opciones = opciones || {};
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var a = opciones.recortar ? areaConContenido(img) : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
        var s = Math.min(1, MAX_LADO / Math.max(a.w, a.h));
        var c = document.createElement("canvas");
        c.width = Math.round(a.w * s);
        c.height = Math.round(a.h * s);
        var png = file.type === "image/png";
        var ctx = c.getContext("2d");
        if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, a.x, a.y, a.w, a.h, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        // PNG con transparencia (logos): se queda en PNG. Lo demás: WebP (mitad de espacio, misma calidad).
        if (png && tieneTransparencia(ctx, c.width, c.height)) return ok({ dataUrl: c.toDataURL("image/png"), ext: "png" });
        if (png) { var fondo = document.createElement("canvas"); fondo.width = c.width; fondo.height = c.height;
          var fx = fondo.getContext("2d"); fx.fillStyle = "#fff"; fx.fillRect(0, 0, c.width, c.height); fx.drawImage(c, 0, 0); c = fondo; }
        ok(comprimirFoto(c));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        mal(new Error("No se pudo abrir la imagen. Usa una foto JPG o PNG."));
      };
      img.src = url;
    });
  }

  // Prepara la foto y la deja lista para subir al guardar. Devuelve su ruta.
  function prepararFoto(file, carpeta, opciones) {
    return prepararImagen(file, opciones).then(function (img) {
      var ruta = carpeta + "/" + nombreSeguro(file.name, img.ext);
      vistas[ruta] = img.dataUrl;
      porSubir[ruta] = img.dataUrl.split(",")[1];
      return ruta;
    });
  }

  // ---------- Guardar ----------
  function esLista(def) { return def.tipo === "lista" || def.tipo === "albumes"; }

  function limpiar(def, valor) {
    // Quita de las listas los elementos que quedaron completamente vacíos.
    if (esLista(def) || Array.isArray(valor)) {
      if (!Array.isArray(valor)) valor = [];
      return valor.map(function (o) { return limpiarObjeto(def.campos, o); })
        .filter(function (o) {
          return def.campos.some(function (c) {
            if (c.tipo === "check" || c.tipo === "oculto" || c.tipo === "fechaEvento") return false;
            if (c.tipo === "lista") return o[c.k] && o[c.k].length;
            return !vacio(o[c.k]);
          });
        });
    }
    return limpiarObjeto(def.campos, valor || {});
  }
  function limpiarObjeto(campos, o) {
    var r = {};
    Object.keys(o || {}).forEach(function (k) { r[k] = o[k]; });
    campos.forEach(function (c) {
      if (c.tipo === "fechaEvento") {
        normalizarFechaEvento(r);
        var tf = r.tipo_fecha;
        if (tf !== "dia" && tf !== "rango") delete r.inicio;
        if (tf !== "rango") delete r.fin;
        if (tf !== "mes") delete r.mes;
        if (tf !== "pendiente") delete r.fecha_texto;
        r[c.k] = FX.texto(r);   // texto en español (también lo leen versiones viejas de la página)
      }
      else if (c.tipo === "lista") r[c.k] = limpiar(c, r[c.k] || []);
      else if (c.tipo === "check") r[c.k] = c.def === false ? r[c.k] === true : r[c.k] !== false;
      else if (r[c.k] === undefined && c.defTexto) r[c.k] = c.defTexto;
      else r[c.k] = vacio(r[c.k]) ? "" : String(r[c.k]).trim();
    });
    return r;
  }

  function contenidoLimpio() {
    var salida = {};
    Object.keys(datos).forEach(function (k) { salida[k] = datos[k]; });
    SECCIONES.forEach(function (s) { if (s.campos) salida[s.key] = limpiar(s, datos[s.key]); });
    return salida;
  }

  function generarYaml(salida) {
    return CABECERA + jsyaml.dump(salida, { lineWidth: -1, noRefs: true, quotingType: '"' });
  }

  function guardar() {
    if (cargandoFotos) return avisar("Espera a que terminen de cargar las fotos antes de guardar.", true);
    var salida = contenidoLimpio();
    var yaml = generarYaml(salida);
    if (modo !== "github") return avisar("Entra al panel con tu token de GitHub para guardar.", true);

    var usadas = rutasFotos(salida);
    var nuevas = Object.keys(porSubir).filter(function (r) { return usadas[r]; });
    var quitadas = Object.keys(rutasOriginales).filter(function (r) { return !usadas[r]; });
    var head, arbolBase, entradas = [];

    ocupado("Guardando…");
    gh("git/ref/heads/" + encodeURIComponent(rama)).then(function (ref) {
      head = ref.object.sha;
      return gh(rutaContenido(ARCHIVO, head));
    }).then(function (actualYml) {
      if (actualYml.sha !== sha) {
        var e = new Error(mensajeError(409));
        throw e;
      }
      return gh("git/commits/" + head);
    }).then(function (commit) {
      arbolBase = commit.tree.sha;
      // 1) Subir las fotos nuevas, una por una.
      return nuevas.reduce(function (p, ruta, i) {
        return p.then(function () {
          var foto = ruta.indexOf("fotos/") === 0 ? vistas[ruta] || null : null;
          var texto = "Subiendo foto " + (i + 1) + " de " + nuevas.length + "…";
          ocupado(texto, i / (nuevas.length + 1), foto);
          return gh("git/blobs", "POST", { content: porSubir[ruta], encoding: "base64" }).then(function (b) {
            entradas.push({ path: ruta, mode: "100644", type: "blob", sha: b.sha });
            ocupado(texto, (i + 1) / (nuevas.length + 1), foto);
          });
        });
      }, Promise.resolve());
    }).then(function () {
      // 2) Borrar las fotos que ya no se usan.
      if (!quitadas.length) return;
      ocupado("Guardando…");
      return gh("git/trees/" + arbolBase + "?recursive=1").then(function (arbol) {
        var existe = {};
        (arbol.tree || []).forEach(function (x) { existe[x.path] = true; });
        quitadas.filter(function (r) { return existe[r]; }).forEach(function (r) {
          entradas.push({ path: r, mode: "100644", type: "blob", sha: null });
        });
      });
    }).then(function () {
      ocupado("Publicando…", nuevas.length ? nuevas.length / (nuevas.length + 1) : null);
      entradas.push({ path: ARCHIVO, mode: "100644", type: "blob", content: yaml });
      return gh("git/trees", "POST", { base_tree: arbolBase, tree: entradas });
    }).then(function (arbol) {
      var msg = "Contenido actualizado desde el panel" + (nuevas.length ? " (" + nuevas.length + (nuevas.length === 1 ? " foto nueva)" : " fotos nuevas)") : "");
      return gh("git/commits", "POST", { message: msg, tree: arbol.sha, parents: [head] });
    }).then(function (commit) {
      return gh("git/refs/heads/" + encodeURIComponent(rama), "PATCH", { sha: commit.sha }).then(function () {
        return gh(rutaContenido(ARCHIVO, commit.sha));
      });
    }).then(function (y) {
      sha = y.sha;
      nuevas.forEach(function (r) { delete porSubir[r]; });
      rutasOriginales = usadas;
      hayCambios = false;
      $("guardar").disabled = true;
      fijarEstado("ok");
      avisar("¡Guardado! La página se actualiza en 1 o 2 minutos.");
      // 3) Avisar al script de Google cuáles fotos de miembros se aprobaron.
      var confirmar = aprobadas.slice();
      aprobadas = [];
      var sugListas = sugerenciasPorConfirmar.slice();
      sugerenciasPorConfirmar = [];
      return confirmar.reduce(function (p, id) {
        return p.then(function () { return script("resolver", { id: id, aprobar: true }).catch(function () {}); });
      }, Promise.resolve()).then(function () {
        // Sugerencias de Instagram aprobadas: salen de la lista de pendientes.
        return sugListas.reduce(function (p, id) {
          return p.then(function () { return script("resolverSugerencia", { id: id }).catch(function () {}); });
        }, Promise.resolve());
      }).then(function () {
        if (pendientes) pendientes = pendientes.filter(function (p) { return p.estado === "pendiente"; });
        if (sugerencias) sugerencias = sugerencias.filter(function (x) { return x.estado !== "aprobada"; });
      });
    }).catch(function (e) {
      avisar(e.message, true);
    }).then(function () { ocupado(null); });
  }

  iniciar();
})();
