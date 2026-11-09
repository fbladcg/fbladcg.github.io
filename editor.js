// =============================================================
//  Editor visual de la página (estilo Google Sites).
//  Solo aparece para quien entró al panel desde este navegador.
//  ✏️ Editar → escribe encima de los textos, añade bloques, mueve
//  y oculta secciones → 💾 Publicar (guarda en GitHub).
//  No necesitas editar este archivo.
// =============================================================

(function () {
  "use strict";

  var OWNER = "fbladcg", REPO = "fbladcg.github.io", ARCHIVO = "contenido.yml";
  var CABECERA =
    "# ==============================================================\n" +
    "#   CONTENIDO DE LA PÁGINA WEB — FBLA Capítulo 3281\n" +
    "#   Este archivo se edita desde el Panel de edición (admin.html).\n" +
    "#   No hace falta editarlo a mano.\n" +
    "# ==============================================================\n\n";

  // Nombres de las secciones y su pestaña en el panel (para lo que se edita con formularios).
  var SECCIONES = {
    nosotros: ["Sobre nosotros", "sobre_nosotros"], anuncios: ["Anuncios", "anuncios"], eventos: ["Eventos", "eventos"],
    directiva: ["Directiva", "directiva"], logros: ["Logros", "logros"], documentos: ["Documentos", "documentos"],
    albumes: ["Álbumes de fotos", "albumes"], instagram: ["Instagram", "instagram"], contacto: ["Contacto", "contacto"]
  };
  var TIPOS = [
    ["texto", "📝", "Texto", "Párrafos con negritas, listas y enlaces"],
    ["titulo", "🔠", "Título", "Un título grande con subtítulo"],
    ["imagen", "🖼", "Imagen", "Una foto o gráfico con pie de foto"],
    ["boton", "🔘", "Botón", "Un botón con enlace (formulario, página…)"],
    ["video", "▶️", "Video", "Un video de YouTube"],
    ["tarjetas", "🗂", "Tarjetas", "2 o 3 columnas con ícono, título y texto"],
    ["separador", "➖", "Separador", "Una línea para dividir"]
  ];

  var sesion = null;       // { token }
  var datos = null;        // contenido que se está editando
  var sha = null, rama = "main";
  var originales = {};     // fotos que había al empezar
  var porSubir = {};       // ruta -> base64 (imágenes nuevas)
  var vistas = {};         // ruta -> dataURL (para verlas antes de publicar)
  var cambios = false;
  var barra = null;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (a) {
      var v = attrs[a];
      if (a === "texto") n.textContent = v;
      else if (a.indexOf("on") === 0) n.addEventListener(a.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(a, v);
    });
    (hijos || []).forEach(function (h) { if (h) n.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return n;
  }
  function ls(k, v) {
    try {
      if (arguments.length === 1) return JSON.parse(localStorage.getItem(k) || "null");
      if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k);
    } catch (e) { return null; }
  }

  // ---------- ¿Mostrar el lápiz? ----------
  function esAdmin() { try { return localStorage.getItem("fbla3281-admin") === "1"; } catch (e) { return false; } }

  function botonLapiz() {
    if ($(".ed-lapiz") || !esAdmin()) return;
    document.body.appendChild(el("button", { type: "button", class: "ed-lapiz", title: "Editar esta página", onclick: entrar }, ["✏️ Editar página"]));
  }

  // ---------- GitHub ----------
  function gh(ruta, metodo, cuerpo) {
    return fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + (ruta ? "/" + ruta : ""), {
      method: metodo || "GET", cache: "no-store",
      headers: { Authorization: "Bearer " + sesion.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    }).then(function (r) {
      if (r.ok) return r.json();
      var m = r.status === 401 ? "La llave (token) no es válida o expiró." :
        r.status === 403 ? "La llave no tiene permiso para guardar." :
        r.status === 409 || r.status === 422 ? "Alguien más guardó cambios hace poco. Sal del editor, recarga la página y vuelve a intentarlo." :
        "GitHub respondió con un error (" + r.status + ").";
      throw new Error(m);
    }, function () { throw new Error("No hay conexión con GitHub."); });
  }
  function b64aTexto(b64) {
    var bin = atob(b64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function rutasFotos(v, acc) {
    acc = acc || {};
    if (typeof v === "string") { if (/^(fotos|docs)\//.test(v)) acc[v] = true; }
    else if (Array.isArray(v)) v.forEach(function (x) { rutasFotos(x, acc); });
    else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { rutasFotos(v[k], acc); });
    return acc;
  }

  // ---------- Entrar / salir ----------
  function entrar() {
    var g = ls("fbla3281-panel");
    if (g && g.token) { sesion = { token: g.token }; return cargar(); }
    pedirLlave();
  }

  function pedirLlave() {
    var input = el("input", { type: "password", placeholder: "github_pat_…", autocomplete: "off", class: "ed-input" });
    var recordar = el("input", { type: "checkbox", checked: true });
    var error = el("p", { class: "ed-error", hidden: true });
    var m = modal("✏️ Editar la página", [
      el("p", { texto: "Pega tu llave de GitHub (la misma del panel)." }), input,
      el("label", { class: "ed-check" }, [recordar, " Recordarme en esta computadora"]), error
    ], [
      ["Cancelar", function () { cerrarModal(m); }],
      ["Entrar", function () {
        sesion = { token: input.value.trim() };
        if (!sesion.token) return;
        cargar().then(function (ok) {
          if (ok) { if (recordar.checked) ls("fbla3281-panel", { owner: OWNER, repo: REPO, token: sesion.token }); cerrarModal(m); }
          else { error.textContent = "No se pudo entrar. Revisa la llave."; error.hidden = false; }
        });
      }, true]
    ]);
    input.focus();
  }

  function cargar() {
    ocupado("Abriendo el editor…");
    return gh("").then(function (r) {
      rama = r.default_branch || "main";
      return gh("contents/" + ARCHIVO + "?ref=" + encodeURIComponent(rama));
    }).then(function (r) {
      sha = r.sha;
      datos = jsyaml.load(b64aTexto(r.content)) || {};
      originales = rutasFotos(datos);
      window.FBLA_EDITANDO = true;
      document.body.classList.add("editando");
      var lapiz = $(".ed-lapiz"); if (lapiz) lapiz.remove();
      crearBarra();
      redibujar();
      aviso("Modo edición: haz clic en cualquier texto para cambiarlo. Usa «＋» para añadir bloques.");
      return true;
    }).catch(function (e) {
      aviso(e.message, true);
      return false;
    }).then(function (ok) { ocupado(null); return ok; });
  }

  function salir() {
    if (cambios && !confirm("Tienes cambios sin publicar. ¿Salir y descartarlos?")) return;
    cambios = false;
    location.hash = "";
    location.reload();
  }

  // ---------- Barra del editor ----------
  function crearBarra() {
    barra = el("div", { class: "ed-barra", role: "toolbar", "aria-label": "Editor de la página" }, [
      el("span", { class: "ed-barra__titulo", texto: "✏️ Editando" }),
      el("span", { class: "ed-estado", id: "ed-estado", texto: "Sin cambios" }),
      el("button", { type: "button", class: "ed-btn", onclick: function () { elegirBloque("__final"); } }, ["＋ Bloque al final"]),
      el("a", { class: "ed-btn", href: "admin.html", target: "_blank", rel: "noopener" }, ["⚙ Panel"]),
      el("button", { type: "button", class: "ed-btn ed-btn--oro", id: "ed-publicar", disabled: true, onclick: publicar }, ["💾 Publicar"]),
      el("button", { type: "button", class: "ed-btn", onclick: salir }, ["✕ Salir"])
    ]);
    document.body.appendChild(barra);
    window.addEventListener("beforeunload", function (e) { if (cambios) { e.preventDefault(); e.returnValue = ""; } });
  }

  function marcar() {
    cambios = true;
    $("#ed-estado").textContent = "● Cambios sin publicar";
    $("#ed-estado").classList.add("ed-estado--pendiente");
    $("#ed-publicar").disabled = false;
  }

  // ---------- Dibujar y decorar ----------
  function redibujar() {
    var y = window.scrollY;
    window.FBLA.reconstruir(datos);
    window.scrollTo(0, y);
  }

  document.addEventListener("fbla:lista", function () {
    if (window.FBLA_EDITANDO) decorar(); else botonLapiz();
  });

  function decorar() {
    var app = $("#app");
    // Imágenes nuevas todavía sin publicar
    app.querySelectorAll("img").forEach(function (img) {
      var src = img.getAttribute("src");
      if (vistas[src]) img.src = vistas[src];
    });
    // Textos editables
    app.querySelectorAll("[data-editar]").forEach(function (n) {
      if (n.closest(".album-vista")) return;
      if (n.hasAttribute("data-rico")) n.setAttribute("contenteditable", "true");
      else {
        n.setAttribute("contenteditable", "plaintext-only");
        if (n.contentEditable !== "plaintext-only") n.setAttribute("contenteditable", "true");
      }
      n.setAttribute("spellcheck", "true");
      if (!n.textContent.trim()) n.setAttribute("data-vacio", "Escribe aquí…");
    });
    // Controles de cada sección y botones «＋»
    var secs = Array.prototype.slice.call(app.children).filter(function (s) { return s.tagName === "SECTION" && s.id !== "inicio"; });
    var primero = secs[0];
    if (primero) primero.parentNode.insertBefore(botonInsertar(null), primero);
    secs.forEach(function (s, i) {
      s.classList.add("ed-seccion");
      s.insertBefore(controlesSeccion(s, i, secs.length), s.firstChild);
      s.parentNode.insertBefore(botonInsertar(s.id), s.nextSibling);
    });
  }

  function botonInsertar(despuesDe) {
    return el("div", { class: "ed-insertar" }, [
      el("button", { type: "button", class: "ed-insertar__btn", title: "Añadir un bloque aquí", onclick: function () { elegirBloque(despuesDe); } }, ["＋ Añadir bloque aquí"])
    ]);
  }

  function ordenActual() {
    datos.diseno = datos.diseno || {};
    var actual = (window.FBLA_ORDEN || []).slice();
    datos.diseno.orden = actual;
    return actual;
  }

  function controlesSeccion(s, i, total) {
    var id = s.id, esBloque = id.indexOf("bloque-") === 0;
    var bloque = esBloque ? (datos.bloques || []).filter(function (b) { return "bloque-" + b.id === id; })[0] : null;
    var oculta = s.hasAttribute("data-oculta");
    var nombre = esBloque ? "Bloque: " + ((TIPOS.filter(function (t) { return t[0] === bloque.tipo; })[0] || [])[2] || "") : (SECCIONES[id] || [id])[0];
    var mover = function (paso) {
      var orden = ordenActual(), p = orden.indexOf(id), q = p + paso;
      if (p < 0 || q < 0 || q >= orden.length) return;
      orden.splice(q, 0, orden.splice(p, 1)[0]);
      marcar(); redibujar();
      var nuevo = document.getElementById(id); if (nuevo) nuevo.scrollIntoView({ block: "center" });
    };
    var hijos = [
      el("span", { class: "ed-ctrl__nombre", texto: nombre + (oculta ? " (oculta)" : "") }),
      el("button", { type: "button", title: "Subir", "aria-label": "Subir " + nombre, disabled: i === 0, onclick: function () { mover(-1); } }, ["↑"]),
      el("button", { type: "button", title: "Bajar", "aria-label": "Bajar " + nombre, disabled: i === total - 1, onclick: function () { mover(1); } }, ["↓"]),
      el("button", { type: "button", title: oculta ? "Mostrar" : "Ocultar", onclick: function () {
        datos.diseno = datos.diseno || {};
        var oc = datos.diseno.ocultas = (datos.diseno.ocultas || []).filter(function (x) { return x !== id; });
        if (!oculta) oc.push(id);
        marcar(); redibujar();
      } }, [oculta ? "👁 Mostrar" : "🙈 Ocultar"])
    ];
    if (esBloque && bloque.tipo !== "separador" && bloque.tipo !== "texto" && bloque.tipo !== "titulo") {
      hijos.push(el("button", { type: "button", onclick: function () { opcionesBloque(bloque); } }, ["⚙ Opciones"]));
    } else if (esBloque && bloque.tipo !== "separador") {
      hijos.push(el("button", { type: "button", onclick: function () { opcionesBloque(bloque); } }, ["🎨 Fondo"]));
    }
    if (esBloque) {
      hijos.push(el("button", { type: "button", class: "ed-ctrl__borrar", onclick: function () {
        if (!confirm("¿Borrar este bloque?")) return;
        datos.bloques = (datos.bloques || []).filter(function (b) { return b !== bloque; });
        if (datos.diseno) {
          datos.diseno.orden = (datos.diseno.orden || []).filter(function (x) { return x !== id; });
          datos.diseno.ocultas = (datos.diseno.ocultas || []).filter(function (x) { return x !== id; });
        }
        marcar(); redibujar();
      } }, ["🗑 Borrar"]));
    } else if (SECCIONES[id] && SECCIONES[id][1]) {
      hijos.push(el("a", { href: "admin.html", target: "_blank", rel: "noopener", class: "ed-ctrl__panel",
        onclick: function () { ls("fbla3281-pestana", SECCIONES[id][1]); } }, ["Editar en el panel ↗"]));
    }
    return el("div", { class: "ed-ctrl", contenteditable: "false" }, hijos);
  }

  // ---------- Edición de textos ----------
  function fijarRuta(obj, ruta, valor) {
    var p = ruta.split("."), o = obj;
    for (var i = 0; i < p.length - 1; i++) {
      var k = /^\d+$/.test(p[i]) ? +p[i] : p[i];
      if (o[k] === undefined || o[k] === null || typeof o[k] !== "object") o[k] = /^\d+$/.test(p[i + 1]) ? [] : {};
      o = o[k];
    }
    o[/^\d+$/.test(p[p.length - 1]) ? +p[p.length - 1] : p[p.length - 1]] = valor;
  }

  document.addEventListener("input", function (e) {
    if (!window.FBLA_EDITANDO) return;
    var n = e.target.closest && e.target.closest("[data-editar]");
    if (!n || !n.closest("#app")) return;
    var valor = n.hasAttribute("data-rico") ? window.FBLA.sanear(n.innerHTML) : n.innerText.replace(/ /g, " ").replace(/\n+$/, "");
    fijarRuta(datos, n.getAttribute("data-editar"), valor);
    n.toggleAttribute("data-vacio", !n.textContent.trim());
    if (!n.textContent.trim()) n.setAttribute("data-vacio", "Escribe aquí…");
    marcar();
  });

  // Enter termina la edición en textos de una sola línea.
  document.addEventListener("keydown", function (e) {
    if (!window.FBLA_EDITANDO || e.key !== "Enter") return;
    var n = e.target.closest && e.target.closest("[data-editar]");
    if (n && !n.hasAttribute("data-rico") && !/^P$/.test(n.tagName)) { e.preventDefault(); n.blur(); }
  });

  // Pegar: solo texto (para no traer formatos raros de Word o de otras páginas).
  document.addEventListener("paste", function (e) {
    if (!window.FBLA_EDITANDO) return;
    var n = e.target.closest && e.target.closest("[data-editar]");
    if (!n) return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, txt);
  });

  // En modo edición, los enlaces y botones de la página no navegan (para poder editarlos).
  document.addEventListener("click", function (e) {
    if (!window.FBLA_EDITANDO) return;
    var a = e.target.closest && e.target.closest("#app a, #app button");
    if (a && !a.closest(".ed-ctrl, .ed-insertar")) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---------- Barra de formato para los bloques de texto ----------
  var formato = null;
  document.addEventListener("focusin", function (e) {
    if (!window.FBLA_EDITANDO) return;
    var n = e.target.closest && e.target.closest("[data-rico]");
    if (!n) return;
    if (!formato) {
      formato = el("div", { class: "ed-formato", contenteditable: "false" });
      [["B", "bold", "Negrita"], ["I", "italic", "Cursiva"], ["U", "underline", "Subrayado"], ["• Lista", "insertUnorderedList", "Lista"],
       ["1. Lista", "insertOrderedList", "Lista numerada"], ["Subtítulo", "h3", "Subtítulo"], ["Párrafo", "p", "Texto normal"],
       ["🔗 Enlace", "enlace", "Enlace"], ["✕ Formato", "removeFormat", "Quitar formato"]].forEach(function (b) {
        formato.appendChild(el("button", { type: "button", title: b[2], onmousedown: function (ev) {
          ev.preventDefault();
          if (b[1] === "enlace") {
            var url = prompt("Enlace (https://…)", "https://");
            if (url && /^(https?:\/\/|mailto:)/i.test(url)) document.execCommand("createLink", false, url);
          } else if (b[1] === "h3" || b[1] === "p") document.execCommand("formatBlock", false, b[1]);
          else document.execCommand(b[1], false, null);
          var act = document.activeElement && document.activeElement.closest("[data-rico]");
          if (act) act.dispatchEvent(new Event("input", { bubbles: true }));
        } }, [b[0]]));
      });
      document.body.appendChild(formato);
    }
    var r = n.getBoundingClientRect();
    formato.style.top = Math.max(8, r.top + window.scrollY - 48) + "px";
    formato.style.left = Math.max(8, r.left + window.scrollX) + "px";
    formato.hidden = false;
  });
  document.addEventListener("focusout", function (e) {
    if (formato && e.target.closest && e.target.closest("[data-rico]")) setTimeout(function () {
      if (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest("[data-rico]")) formato.hidden = true;
    }, 150);
  });

  // ---------- Añadir bloques ----------
  function elegirBloque(despuesDe) {
    var m = modal("＋ Añadir bloque", [
      el("div", { class: "ed-tipos" }, TIPOS.map(function (tp) {
        return el("button", { type: "button", class: "ed-tipo", onclick: function () { cerrarModal(m); crearBloque(tp[0], despuesDe); } }, [
          el("span", { class: "ed-tipo__icono", texto: tp[1] }), el("strong", { texto: tp[2] }), el("span", { texto: tp[3] })
        ]);
      }))
    ], [["Cancelar", function () { cerrarModal(m); }]]);
  }

  function crearBloque(tipo, despuesDe) {
    var b = { id: "b" + Date.now().toString(36), tipo: tipo };
    if (tipo === "texto") b.html = "<p>Escribe aquí tu texto…</p>";
    if (tipo === "titulo") { b.texto = "Nuevo título"; b.subtitulo = ""; }
    if (tipo === "imagen") { b.src = ""; b.pie = ""; b.ancho = "normal"; }
    if (tipo === "boton") { b.texto = "Más información"; b.enlace = ""; b.estilo = "acento"; }
    if (tipo === "video") b.enlace = "";
    if (tipo === "tarjetas") {
      b.columnas = 3;
      b.items = [{ icono: "💼", titulo: "Título", texto: "Describe algo aquí." }, { icono: "🏆", titulo: "Título", texto: "Describe algo aquí." }, { icono: "🤝", titulo: "Título", texto: "Describe algo aquí." }];
    }
    datos.bloques = datos.bloques || [];
    datos.bloques.push(b);
    var orden = ordenActual(), id = "bloque-" + b.id;
    // null = al principio; "__final" = al final; otro = justo después de esa sección
    var pos = despuesDe === null ? 0 : despuesDe === "__final" ? orden.length : orden.indexOf(despuesDe) + 1;
    if (pos <= 0 && despuesDe !== null) pos = orden.length;
    orden.splice(pos, 0, id);
    marcar(); redibujar();
    var nuevo = document.getElementById(id);
    if (nuevo) {
      nuevo.scrollIntoView({ block: "center" });
      var editable = nuevo.querySelector("[data-editar]");
      if (editable) editable.focus();
    }
    if (tipo === "imagen" || tipo === "boton" || tipo === "video") opcionesBloque(b);
  }

  // ---------- Opciones de cada bloque ----------
  function campoTexto(etiqueta, valor, ph, alCambiar) {
    var i = el("input", { type: "text", class: "ed-input", placeholder: ph || "" });
    i.value = valor || "";
    i.addEventListener("input", function () { alCambiar(i.value); });
    return el("label", { class: "ed-campo" }, [el("span", { texto: etiqueta }), i]);
  }
  function campoSelect(etiqueta, valor, opciones, alCambiar) {
    var s = el("select", { class: "ed-input" });
    opciones.forEach(function (o) { var op = el("option", { value: o[0], texto: o[1] }); if (String(o[0]) === String(valor || opciones[0][0])) op.selected = true; s.appendChild(op); });
    s.addEventListener("change", function () { alCambiar(s.value); });
    return el("label", { class: "ed-campo" }, [el("span", { texto: etiqueta }), s]);
  }

  function opcionesBloque(b) {
    var copia = JSON.parse(JSON.stringify(b));
    var cuerpo = [];
    if (b.tipo === "imagen") {
      var vista = el("div", { class: "ed-vista" }, [copia.src ? el("img", { src: vistas[copia.src] || copia.src, alt: "" }) : el("span", { texto: "Sin imagen" })]);
      var archivo = el("input", { type: "file", accept: "image/*", hidden: true });
      archivo.addEventListener("change", function () {
        if (!archivo.files[0]) return;
        ocupado("Preparando imagen…");
        prepararImagen(archivo.files[0]).then(function (r) {
          copia.src = r.ruta;
          vista.innerHTML = ""; vista.appendChild(el("img", { src: r.dataUrl, alt: "" }));
        }).catch(function (e) { aviso(e.message, true); }).then(function () { ocupado(null); });
      });
      cuerpo.push(vista, archivo,
        el("button", { type: "button", class: "ed-btn", onclick: function () { archivo.click(); } }, [copia.src ? "Cambiar imagen" : "📷 Escoger imagen"]),
        campoTexto("Pie de foto (opcional)", copia.pie, "", function (v) { copia.pie = v; }),
        campoTexto("Descripción para lectores de pantalla", copia.alt, "Qué muestra la imagen", function (v) { copia.alt = v; }),
        campoSelect("Tamaño", copia.ancho, [["normal", "Normal"], ["completo", "Ancho completo"]], function (v) { copia.ancho = v; }));
    }
    if (b.tipo === "boton") {
      cuerpo.push(campoTexto("Texto del botón", copia.texto, "Más información", function (v) { copia.texto = v; }),
        campoTexto("Enlace", copia.enlace, "https://forms.gle/…", function (v) { copia.enlace = v; }),
        campoSelect("Estilo", copia.estilo, [["acento", "Dorado"], ["borde", "Con borde azul"]], function (v) { copia.estilo = v; }));
    }
    if (b.tipo === "video") {
      cuerpo.push(campoTexto("Enlace de YouTube", copia.enlace, "https://www.youtube.com/watch?v=…", function (v) { copia.enlace = v; }),
        el("p", { class: "ed-nota", texto: "Copia el enlace del video desde YouTube (Compartir → Copiar)." }));
    }
    if (b.tipo === "tarjetas") {
      cuerpo.push(campoSelect("Columnas", copia.columnas, [[3, "3 columnas"], [2, "2 columnas"]], function (v) { copia.columnas = +v; }));
      var listaT = el("div", { class: "ed-tarjetas" });
      var pintarT = function () {
        listaT.innerHTML = "";
        (copia.items || []).forEach(function (x, k) {
          listaT.appendChild(el("div", { class: "ed-tarjeta" }, [
            campoTexto("Ícono (emoji)", x.icono, "⭐", function (v) { x.icono = v; }),
            campoTexto("Título", x.titulo, "", function (v) { x.titulo = v; }),
            campoTexto("Texto", x.texto, "", function (v) { x.texto = v; }),
            el("button", { type: "button", class: "ed-btn ed-btn--peligro", onclick: function () { copia.items.splice(k, 1); pintarT(); } }, ["🗑 Quitar tarjeta"])
          ]));
        });
        listaT.appendChild(el("button", { type: "button", class: "ed-btn", onclick: function () {
          copia.items = copia.items || []; copia.items.push({ icono: "⭐", titulo: "Título", texto: "" }); pintarT();
        } }, ["＋ Añadir tarjeta"]));
      };
      pintarT();
      cuerpo.push(listaT);
    }
    if (b.tipo !== "separador") {
      cuerpo.push(campoSelect("Fondo de la sección", copia.fondo, [["", "Blanco"], ["gris", "Gris claro"], ["azul", "Azul (FBLA)"]], function (v) { copia.fondo = v; }));
    }
    var m = modal("⚙ Opciones del bloque", cuerpo, [
      ["Cancelar", function () { cerrarModal(m); }],
      ["Aplicar", function () {
        Object.keys(copia).forEach(function (k) { b[k] = copia[k]; });
        cerrarModal(m); marcar(); redibujar();
      }, true]
    ]);
  }

  // Imagen → WebP (la mitad del espacio). Devuelve la ruta donde se guardará.
  function prepararImagen(file) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        var x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var d = c.toDataURL("image/webp", 0.85), ext = "webp";
        if (d.indexOf("data:image/webp") !== 0) { d = c.toDataURL("image/jpeg", 0.85); ext = "jpg"; }
        var base = file.name.replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "imagen";
        var ruta = "fotos/bloques/" + base + "-" + Date.now().toString(36) + "." + ext;
        porSubir[ruta] = d.split(",")[1];
        vistas[ruta] = d;
        ok({ ruta: ruta, dataUrl: d });
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error("No se pudo abrir la imagen.")); };
      img.src = url;
    });
  }

  // ---------- Publicar ----------
  function publicar() {
    var yaml = CABECERA + jsyaml.dump(datos, { lineWidth: -1, noRefs: true, quotingType: '"' });
    var usadas = rutasFotos(datos);
    var nuevas = Object.keys(porSubir).filter(function (r) { return usadas[r]; });
    // Solo se borran imágenes de bloques que ya no se usan (las demás se manejan en el panel).
    var quitadas = Object.keys(originales).filter(function (r) { return !usadas[r] && r.indexOf("fotos/bloques/") === 0; });
    var head, arbolBase, entradas = [];
    ocupado("Publicando…");
    gh("git/ref/heads/" + encodeURIComponent(rama)).then(function (ref) {
      head = ref.object.sha;
      return gh("contents/" + ARCHIVO + "?ref=" + head);
    }).then(function (actual) {
      if (actual.sha !== sha) throw new Error("Alguien guardó cambios desde el panel mientras editabas. Sal del editor, recarga y vuelve a hacer tus cambios.");
      return gh("git/commits/" + head);
    }).then(function (commit) {
      arbolBase = commit.tree.sha;
      return nuevas.reduce(function (p, ruta, i) {
        return p.then(function () {
          ocupado("Subiendo imagen " + (i + 1) + " de " + nuevas.length + "…");
          return gh("git/blobs", "POST", { content: porSubir[ruta], encoding: "base64" }).then(function (b) {
            entradas.push({ path: ruta, mode: "100644", type: "blob", sha: b.sha });
          });
        });
      }, Promise.resolve());
    }).then(function () {
      if (!quitadas.length) return;
      return gh("git/trees/" + arbolBase + "?recursive=1").then(function (arbol) {
        var existe = {};
        (arbol.tree || []).forEach(function (x) { existe[x.path] = true; });
        quitadas.filter(function (r) { return existe[r]; }).forEach(function (r) { entradas.push({ path: r, mode: "100644", type: "blob", sha: null }); });
      });
    }).then(function () {
      ocupado("Publicando…");
      entradas.push({ path: ARCHIVO, mode: "100644", type: "blob", content: yaml });
      return gh("git/trees", "POST", { base_tree: arbolBase, tree: entradas });
    }).then(function (arbol) {
      return gh("git/commits", "POST", { message: "Página editada con el editor visual", tree: arbol.sha, parents: [head] });
    }).then(function (commit) {
      return gh("git/refs/heads/" + encodeURIComponent(rama), "PATCH", { sha: commit.sha }).then(function () {
        return gh("contents/" + ARCHIVO + "?ref=" + commit.sha);
      });
    }).then(function (y) {
      sha = y.sha;
      nuevas.forEach(function (r) { delete porSubir[r]; });
      originales = usadas;
      cambios = false;
      $("#ed-estado").textContent = "✓ Publicado";
      $("#ed-estado").classList.remove("ed-estado--pendiente");
      $("#ed-publicar").disabled = true;
      aviso("¡Publicado! La página pública se actualiza en 1 o 2 minutos.");
    }).catch(function (e) {
      aviso(e.message, true);
    }).then(function () { ocupado(null); });
  }

  // ---------- Ventanas, avisos y espera ----------
  function modal(titulo, cuerpo, botones) {
    var fondo = el("div", { class: "ed-modal", role: "dialog", "aria-modal": "true", "aria-label": titulo });
    var caja = el("div", { class: "ed-modal__caja" }, [
      el("h2", { texto: titulo }),
      el("div", { class: "ed-modal__cuerpo" }, cuerpo),
      el("div", { class: "ed-modal__botones" }, botones.map(function (b) {
        return el("button", { type: "button", class: "ed-btn" + (b[2] ? " ed-btn--oro" : ""), onclick: b[1] }, [b[0]]);
      }))
    ]);
    fondo.appendChild(caja);
    fondo.addEventListener("mousedown", function (e) { if (e.target === fondo) cerrarModal(fondo); });
    fondo.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarModal(fondo); });
    document.body.appendChild(fondo);
    return fondo;
  }
  function cerrarModal(m) { if (m && m.parentNode) m.remove(); }

  var tAviso;
  function aviso(msg, error) {
    var a = $(".ed-aviso") || document.body.appendChild(el("div", { class: "ed-aviso", role: "status" }));
    a.textContent = msg;
    a.classList.toggle("ed-aviso--error", !!error);
    a.hidden = false;
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { a.hidden = true; }, error ? 8000 : 4500);
  }
  function ocupado(msg) {
    var o = $(".ed-ocupado");
    if (!msg) { if (o) o.remove(); return; }
    if (!o) o = document.body.appendChild(el("div", { class: "ed-ocupado" }));
    o.textContent = msg;
  }

  // ---------- Estilos del editor ----------
  var css = "" +
    ".ed-lapiz{position:fixed;left:16px;bottom:16px;z-index:60;background:#0a2e7f;color:#fff;border:2px solid #f4ab19;border-radius:999px;padding:12px 18px;font:700 15px Arial,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}" +
    ".ed-lapiz:hover{background:#1d52bc}" +
    ".ed-barra{position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:14px;z-index:70;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;background:#0a2e7f;color:#fff;padding:8px 10px;border-radius:14px;border:2px solid #f4ab19;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:calc(100% - 24px);font:14px Arial,sans-serif}" +
    ".ed-barra__titulo{font-weight:700;padding:0 6px}" +
    ".ed-estado{font-size:12px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.12);color:#8be0a4}" +
    ".ed-estado--pendiente{color:#f4ab19;background:rgba(244,171,25,.15)}" +
    ".ed-btn{font:700 13px Arial,sans-serif;border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;padding:7px 12px;border-radius:9px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px}" +
    ".ed-modal .ed-btn{color:#0a2e7f;background:#fff;border-color:#cfd8e8}" +
    ".ed-btn--oro,.ed-modal .ed-btn--oro{background:#f4ab19;color:#0a2e7f;border-color:#f4ab19}" +
    ".ed-btn:disabled{opacity:.45;cursor:default}" +
    ".ed-btn--peligro,.ed-modal .ed-btn--peligro{color:#c0392b;border-color:#c0392b}" +
    "body.editando{padding-bottom:90px}" +
    ".editando [data-editar]{outline:1.5px dashed rgba(34,106,221,.55);outline-offset:3px;border-radius:4px;cursor:text;min-width:40px}" +
    ".editando [data-editar]:hover{outline-color:#f4ab19;background:rgba(244,171,25,.08)}" +
    ".editando [data-editar]:focus{outline:2px solid #f4ab19;background:rgba(244,171,25,.10)}" +
    ".editando [data-editar][data-vacio]:empty::before{content:attr(data-vacio);color:#9aa6bd;font-style:italic}" +
    ".editando .portada [data-editar]:focus,.editando .seccion--azul [data-editar]:focus{background:rgba(255,255,255,.12)}" +
    ".ed-seccion{position:relative;outline:0 solid transparent;transition:outline-color .15s}" +
    ".ed-seccion:hover{outline:2px solid rgba(244,171,25,.6);outline-offset:-2px}" +
    ".ed-seccion[data-oculta]{opacity:.45}" +
    ".ed-ctrl{position:absolute;top:8px;right:8px;z-index:5;display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;align-items:center;max-width:calc(100% - 16px);background:#0a2e7f;padding:4px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.25);font:13px Arial,sans-serif}" +
    ".ed-ctrl button,.ed-ctrl a{font:700 12px Arial,sans-serif;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:7px;padding:5px 9px;cursor:pointer;text-decoration:none}" +
    ".ed-ctrl button:hover,.ed-ctrl a:hover{background:#1d52bc}" +
    ".ed-ctrl button:disabled{opacity:.35}" +
    ".ed-ctrl__nombre{color:#f4ab19;font-weight:700;padding:0 6px}" +
    ".ed-ctrl__borrar:hover{background:#c0392b !important}" +
    ".ed-insertar{display:flex;justify-content:center;padding:6px 16px;background:repeating-linear-gradient(90deg,transparent 0 10px,rgba(34,106,221,.12) 10px 20px) center/100% 2px no-repeat}" +
    ".ed-insertar__btn{font:700 13px Arial,sans-serif;background:#fff;color:#1d52bc;border:1.5px dashed #1d52bc;border-radius:999px;padding:6px 14px;cursor:pointer;opacity:.75}" +
    ".ed-insertar__btn:hover{opacity:1;background:#f4ab19;color:#0a2e7f;border-color:#f4ab19}" +
    ".ed-formato{position:absolute;z-index:65;display:flex;gap:3px;flex-wrap:wrap;background:#0a2e7f;padding:4px;border-radius:9px;box-shadow:0 6px 18px rgba(0,0,0,.25)}" +
    ".ed-formato button{font:700 12px Arial,sans-serif;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:6px;padding:5px 8px;cursor:pointer}" +
    ".ed-formato button:hover{background:#f4ab19;color:#0a2e7f}" +
    ".ed-modal{position:fixed;inset:0;z-index:90;background:rgba(10,46,127,.45);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".ed-modal__caja{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.3);font:15px Arial,sans-serif;color:#2d2b2b}" +
    ".ed-modal__caja h2{margin:0 0 14px;color:#0a2e7f;font-size:1.25rem}" +
    ".ed-modal__cuerpo{display:flex;flex-direction:column;gap:12px}" +
    ".ed-modal__botones{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}" +
    ".ed-campo{display:flex;flex-direction:column;gap:4px;font-weight:700;color:#0a2e7f;font-size:13px}" +
    ".ed-input{font:15px Arial,sans-serif;padding:9px 11px;border:1px solid #cfd8e8;border-radius:8px;width:100%;box-sizing:border-box}" +
    ".ed-input:focus{outline:none;border-color:#226add;box-shadow:0 0 0 3px rgba(34,106,221,.18)}" +
    ".ed-check{display:flex;gap:8px;align-items:center;font-size:14px}" +
    ".ed-error{color:#c0392b;font-weight:700;margin:0}" +
    ".ed-nota{font-size:13px;color:#55607a;margin:0}" +
    ".ed-tipos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}" +
    ".ed-tipo{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;padding:12px;border:1px solid #dbe2ef;border-radius:10px;background:#fbfcff;cursor:pointer;font:13px Arial,sans-serif;color:#55607a}" +
    ".ed-tipo:hover{border-color:#226add;background:#eef3fc}" +
    ".ed-tipo strong{color:#0a2e7f;font-size:15px}" +
    ".ed-tipo__icono{font-size:1.6rem}" +
    ".ed-vista{border:1px dashed #cfd8e8;border-radius:10px;min-height:120px;display:flex;align-items:center;justify-content:center;color:#9aa6bd;overflow:hidden;background:#f7f9fd}" +
    ".ed-vista img{max-width:100%;max-height:240px;display:block}" +
    ".ed-tarjetas{display:flex;flex-direction:column;gap:10px}" +
    ".ed-tarjeta{border:1px solid #e3e9f4;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;background:#fbfcff}" +
    ".ed-aviso{position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:86px;z-index:95;background:#0a2e7f;color:#fff;padding:11px 18px;border-radius:12px;font:700 14px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:calc(100% - 32px);text-align:center}" +
    ".ed-aviso--error{background:#c0392b}" +
    ".ed-ocupado{position:fixed;inset:0;z-index:99;background:rgba(10,46,127,.45);display:flex;align-items:center;justify-content:center;color:#fff;font:700 18px Arial,sans-serif}" +
    "@media (max-width:760px){.ed-ctrl{position:static;margin:-36px 12px 18px;justify-content:flex-start}.ed-barra{bottom:8px;gap:6px}.ed-barra__titulo{display:none}.ed-aviso{top:72px;bottom:auto}}";
  document.head.appendChild(el("style", {}, [css]));

  // Si la página ya terminó de dibujarse antes de cargar este archivo
  if (window.FBLA && document.querySelector("#app section")) botonLapiz();
})();
