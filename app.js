// =============================================================
//  Este archivo construye la página a partir de contenido.yml.
//  No necesitas editarlo para cambiar textos, fotos o eventos.
// =============================================================

(function () {
  "use strict";

  var app = document.getElementById("app");
  var menu = document.getElementById("menu");
  var pie = document.getElementById("pie");
  var DATOS = {};

  // Evita que el texto se interprete como código.
  function t(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function lista(valor) {
    return Array.isArray(valor) ? valor.filter(Boolean) : [];
  }

  function enlaceSeguro(url) {
    url = String(url || "").trim();
    if (/^www\./i.test(url)) url = "https://" + url;
    if (/^(https?:|mailto:)/i.test(url) || /^[\w\-./ ]+$/.test(url)) return url;
    return "";
  }

  function iniciales(nombre) {
    return String(nombre || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); })
      .join("");
  }

  // rutaTitulo: dónde se guarda el título si se edita con el lápiz (por defecto "titulos.<id>").
  function seccion(id, titulo, contenido, clase, rutaTitulo) {
    return (
      '<section id="' + id + '" class="seccion ' + (clase || "") + '">' +
      '<div class="contenedor">' +
      (titulo ? '<h2 class="seccion__titulo" data-editar="' + t(rutaTitulo || "titulos." + id) + '">' + t(titulo) + "</h2>" : "") +
      contenido +
      "</div></section>"
    );
  }

  // ---------- Texto con formato (bloques de texto) ----------
  // Solo se permiten etiquetas seguras: nada de scripts, estilos ni atributos raros.
  var PERMITIDAS = { P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, A: 1, UL: 1, OL: 1, LI: 1, H3: 1, H4: 1, BLOCKQUOTE: 1 };
  function sanear(html) {
    var doc = new DOMParser().parseFromString("<div>" + String(html || "") + "</div>", "text/html");
    var raiz = doc.body.firstChild;
    (function limpiar(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (h) {
        if (h.nodeType === 3) return;
        if (h.nodeType !== 1) { h.remove(); return; }
        limpiar(h);
        var tag = h.tagName === "DIV" ? "P" : h.tagName;
        if (!PERMITIDAS[tag]) {
          if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(h.tagName)) { h.remove(); return; }
          while (h.firstChild) h.parentNode.insertBefore(h.firstChild, h);
          h.remove();
          return;
        }
        var nuevo = doc.createElement(tag);
        while (h.firstChild) nuevo.appendChild(h.firstChild);
        if (tag === "A") {
          var href = String(h.getAttribute("href") || "").trim();
          if (/^www\./i.test(href)) href = "https://" + href;
          if (/^(https?:|mailto:)/i.test(href)) { nuevo.setAttribute("href", href); nuevo.setAttribute("target", "_blank"); nuevo.setAttribute("rel", "noopener"); }
        }
        h.replaceWith(nuevo);
      });
    })(raiz);
    return raiz.innerHTML;
  }

  // Video de YouTube → id (o "" si el enlace no es de YouTube).
  function idYouTube(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
    return m ? m[1] : "";
  }

  // ---------- Bloques personalizados (añadidos con el editor visual) ----------
  function htmlBloque(b, i) {
    var r = "bloques." + i + ".";
    var fondo = b.fondo === "gris" ? " seccion--gris" : b.fondo === "azul" ? " seccion--azul" : "";
    var dentro = "";
    if (b.tipo === "texto") {
      dentro = '<div class="bloque__texto" data-editar="' + r + 'html" data-rico>' + (sanear(b.html) || "<p>Escribe aquí…</p>") + "</div>";
    } else if (b.tipo === "titulo") {
      dentro = '<h2 class="seccion__titulo bloque__titulo" data-editar="' + r + 'texto">' + t(b.texto || "Título") + "</h2>" +
        (b.subtitulo || window.FBLA_EDITANDO ? '<p class="bloque__subtitulo" data-editar="' + r + 'subtitulo">' + t(b.subtitulo || "") + "</p>" : "");
    } else if (b.tipo === "imagen") {
      dentro = b.src
        ? '<figure class="bloque__imagen' + (b.ancho === "completo" ? " bloque__imagen--completa" : "") + '">' +
          '<img src="' + t(enlaceSeguro(b.src)) + '" alt="' + t(b.alt || b.pie || "") + '" loading="lazy">' +
          (b.pie || window.FBLA_EDITANDO ? '<figcaption data-editar="' + r + 'pie">' + t(b.pie || "") + "</figcaption>" : "") + "</figure>"
        : '<div class="bloque__vacio">🖼 Imagen sin escoger</div>';
    } else if (b.tipo === "boton") {
      var url = enlaceSeguro(b.enlace);
      dentro = '<p class="bloque__boton"><a class="boton ' + (b.estilo === "borde" ? "boton--borde" : "boton--acento") + '" href="' + t(url || "#") + '"' +
        (/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "") + ' data-editar="' + r + 'texto">' + t(b.texto || "Botón") + "</a></p>";
    } else if (b.tipo === "video") {
      var vid = idYouTube(b.enlace);
      dentro = vid
        ? '<div class="bloque__video"><iframe src="https://www.youtube-nocookie.com/embed/' + vid + '" title="' + t(b.titulo || "Video") + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
        : '<div class="bloque__vacio">▶️ Video sin enlace de YouTube</div>';
    } else if (b.tipo === "tarjetas") {
      var items = lista(b.items);
      dentro = '<div class="bloque__tarjetas bloque__tarjetas--' + (b.columnas === 2 || b.columnas === "2" ? "2" : "3") + '">' + items.map(function (x, k) {
        var rk = r + "items." + k + ".";
        return '<div class="tarjeta bloque__tarjeta">' +
          '<span class="bloque__icono" data-editar="' + rk + 'icono">' + t(x.icono || "⭐") + "</span>" +
          '<h3 data-editar="' + rk + 'titulo">' + t(x.titulo || "Título") + "</h3>" +
          '<p data-editar="' + rk + 'texto">' + t(x.texto || "") + "</p></div>";
      }).join("") + "</div>";
    } else if (b.tipo === "separador") {
      dentro = '<hr class="bloque__separador">';
    }
    return '<section id="bloque-' + t(b.id) + '" class="seccion bloque bloque--' + t(b.tipo) + fondo + '" data-bloque="' + t(b.id) + '">' +
      '<div class="contenedor">' + dentro + "</div></section>";
  }

  // Convierte un enlace de Instagram en su forma oficial, o "" si no es válido.
  function enlaceInstagram(url) {
    var m = String(url || "").trim().match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i);
    return m ? "https://www.instagram.com/" + m[1].toLowerCase() + "/" + m[2] + "/" : "";
  }

  function albumesPublicados() {
    return lista(DATOS.albumes).filter(function (a) {
      return a.publicado !== false && a.id && lista(a.fotos).some(function (f) { return f.foto; });
    });
  }

  function fotosDe(album) {
    return lista(album.fotos).filter(function (f) { return f.foto; });
  }

  function portadaDe(album) {
    var fotos = fotosDe(album);
    var p = album.portada && fotos.some(function (f) { return f.foto === album.portada; }) ? album.portada : fotos[0].foto;
    return enlaceSeguro(p);
  }

  function subidasActivas() {
    var s = DATOS.subidas || {};
    return s.activo === true && /^https:\/\/script\.google\.com\//.test(String(s.url || ""));
  }

  // ---------- Conteo de visitas ----------
  // Avisa al script de Google; cuenta una vez por día por página en cada navegador.
  // No usa cookies ni guarda datos personales.
  function registrarVisita(pagina) {
    var url = String((DATOS.subidas || {}).url || "").trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return;
    if (!/\.github\.io$/i.test(location.hostname)) return;          // pruebas locales no cuentan
    var hoy = new Date().toISOString().slice(0, 10);
    var clave = "fbla3281-visita-" + pagina;
    try {
      if (localStorage.getItem("fbla3281-admin") === "1") return;   // los administradores no cuentan
      if (localStorage.getItem(clave) === hoy) return;               // una vez por día por navegador
      localStorage.setItem(clave, hoy);
    } catch (e) {}
    try { fetch(url + "?accion=visita&p=" + encodeURIComponent(pagina), { mode: "no-cors", keepalive: true }); } catch (e) {}
  }

  // ¿Este álbum acepta fotos de miembros? (activado por defecto)
  function albumRecibeFotos(a) {
    return subidasActivas() && a && a.id && a.publicado === true && a.recibe_fotos !== false;
  }

  function construir(d) {
    DATOS = d;
    var cap = d.capitulo || {};
    document.title = (cap.nombre || "FBLA") + " — " + (cap.escuela || "");
    // Si el nombre tiene " - ", la segunda parte va en la línea de abajo.
    var partesNombre = String(cap.nombre || "FBLA").split(/\s+[-–—]\s+/);
    document.getElementById("marca-texto").innerHTML = partesNombre.length > 1
      ? '<span class="marca__linea">' + t(partesNombre[0]) + '</span><span class="marca__linea marca__linea--sub">' + t(partesNombre.slice(1).join(" - ")) + "</span>"
      : t(partesNombre[0]);
    if (cap.logo) {
      var logo = document.getElementById("logo");
      logo.src = enlaceSeguro(cap.logo);
      logo.alt = "FBLA";
      logo.hidden = false;
      document.querySelector(".marca").classList.add("marca--con-logo");
    }

    var html = "";
    var nav = [];
    var c = d.contacto || {};
    var titulos = d.titulos || {};
    // Cada sección se guarda aparte para poder ordenarla, ocultarla o intercalar bloques.
    var secciones = [];
    function agregar(id, menuTxt, h) { secciones.push({ id: id, menu: menuTxt, html: h }); }

    // ---- Portada ----
    var fondo = cap.foto_portada
      ? ' style="background-image:linear-gradient(115deg,rgba(10,46,127,.92),rgba(29,82,188,.78)),url(\'' + t(enlaceSeguro(cap.foto_portada)) + '\')"'
      : "";
    var partes = String(cap.nombre || "FBLA").split(/\s+[-–—]\s+/);
    var lema = String(cap.lema || "").split("|").map(function (x) { return x.trim(); }).filter(Boolean);
    var prox = proximoEvento(lista(d.eventos));
    var hayFotos = albumesPublicados().length > 0;
    html +=
      '<section id="inicio" class="portada"' + fondo + '>' +
      '<div class="portada__formas" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<div class="contenedor portada__rejilla">' +
      '<div class="portada__texto">' +
      '<p class="portada__escuela">' + t(cap.escuela) + (cap.pueblo ? " · " + t(cap.pueblo) : "") + "</p>" +
      '<h1 class="portada__titulo">' + t(partes[0]) +
      (partes.length > 1 ? '<span class="portada__sub">' + t(partes.slice(1).join(" - ")) + "</span>" : "") + "</h1>" +
      (window.FBLA_EDITANDO
        // En modo edición el lema se muestra como texto (separa con | para que salgan insignias)
        ? '<p class="portada__lema-texto" data-editar="capitulo.lema" title="Separa con | para mostrar insignias">' + t(cap.lema || "") + "</p>"
        : lema.length > 1
          ? '<ul class="portada__lema" aria-label="Lema">' + lema.map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul>"
          : (cap.lema ? '<p class="portada__lema-texto">' + t(cap.lema) + "</p>" : "")) +
      (prox
        ? '<a class="portada__proximo" href="#eventos"><span class="portada__proximo-et">Próximo evento</span>' +
          '<strong>' + t(prox.ev.nombre) + '</strong><span class="portada__proximo-cuando">' + t(F.texto(prox.ev)) + " · " + t(prox.cuando) + "</span></a>"
        : "") +
      '<div class="portada__botones">' +
      '<a class="boton boton--acento" href="#eventos">📅 Ver eventos</a>' +
      (hayFotos ? '<a class="boton boton--claro" href="#albumes">📸 Ver fotos</a>' : "") +
      "</div></div>" +
      '<div class="portada__emblema"><img src="img/emblema-512.png" alt="Emblema de FBLA: Service, Education, Progress" width="512" height="512"></div>' +
      "</div></section>";

    // ---- Sobre nosotros ----
    var sobre = d.sobre_nosotros;
    if (sobre) {
      var datos = lista(sobre.datos).map(function (x, k) {
        return '<div class="dato"><span class="dato__numero" data-editar="sobre_nosotros.datos.' + k + '.numero">' + t(x.numero) +
          '</span><span class="dato__etiqueta" data-editar="sobre_nosotros.datos.' + k + '.etiqueta">' + t(x.etiqueta) + "</span></div>";
      }).join("");
      agregar("nosotros", "Nosotros", seccion("nosotros", sobre.titulo || "Sobre nosotros",
        '<p class="texto-grande" data-editar="sobre_nosotros.texto">' + t(sobre.texto) + "</p>" +
        (datos ? '<div class="datos">' + datos + "</div>" : ""), "", "sobre_nosotros.titulo"));
    }

    // ---- Anuncios ----
    var anuncios = lista(d.anuncios);
    if (anuncios.length) {
      agregar("anuncios", "Anuncios", seccion("anuncios", titulos.anuncios || "Anuncios",
        '<div class="rejilla rejilla--2">' + anuncios.map(function (a) {
          var k = d.anuncios.indexOf(a), r = "anuncios." + k + ".";
          return '<article class="tarjeta anuncio">' +
            (a.fecha || window.FBLA_EDITANDO ? '<p class="etiqueta" data-editar="' + r + 'fecha">' + t(a.fecha || "") + "</p>" : "") +
            '<h3 data-editar="' + r + 'titulo">' + t(a.titulo) + "</h3>" +
            (a.texto || window.FBLA_EDITANDO ? '<p data-editar="' + r + 'texto">' + t(a.texto || "") + "</p>" : "") +
            '<button type="button" class="evento__compartir" data-compartir-anuncio="' + anuncios.indexOf(a) + '">📤 Compartir imagen</button>' +
            "</article>";
        }).join("") + "</div>", "seccion--gris"));
    }

    // ---- Eventos ----
    var eventos = lista(d.eventos);
    if (eventos.length) {
      agregar("eventos", "Eventos", seccion("eventos", titulos.eventos || "Próximos eventos", htmlEventos(eventos)));
    }

    // ---- Directiva ----
    var directiva = lista(d.directiva);
    if (directiva.length) {
      agregar("directiva", "Directiva", seccion("directiva", titulos.directiva || "Nuestra directiva",
        '<div class="rejilla rejilla--personas">' + directiva.map(function (p) {
          var r = "directiva." + d.directiva.indexOf(p) + ".";
          var foto = p.foto
            ? '<img class="persona__foto" src="' + t(enlaceSeguro(p.foto)) + '" alt="' + t(p.nombre) + '" loading="lazy">'
            : '<div class="persona__foto persona__foto--iniciales" aria-hidden="true">' + t(iniciales(p.nombre)) + "</div>";
          return '<div class="persona">' + foto + '<h3 data-editar="' + r + 'nombre">' + t(p.nombre) +
            '</h3><p class="persona__puesto" data-editar="' + r + 'puesto">' + t(p.puesto) + "</p></div>";
        }).join("") + "</div>", "seccion--gris"));
    }

    // ---- Logros ----
    var logros = lista(d.logros);
    if (logros.length) {
      agregar("logros", "Logros", seccion("logros", titulos.logros || "Logros", htmlLogros(logros)));
    }

    // ---- Documentos para descargar ----
    var documentos = lista(d.documentos).filter(function (x) { return x.titulo && (x.archivo || x.enlace); });
    if (documentos.length) {
      agregar("documentos", "Documentos", seccion("documentos", titulos.documentos || "Documentos", htmlDocumentos(documentos)));
    }

    // ---- Álbumes de fotos ----
    var albumes = albumesPublicados();
    if (albumes.length) {
      agregar("albumes", "Fotos", seccion("albumes", titulos.albumes || "Álbumes de fotos",
        '<div class="albumes">' + albumes.map(function (a) {
          var meta = [a.fecha, a.lugar].filter(Boolean).map(t).join(" · ");
          var n = fotosDe(a).length;
          return '<a class="album-tarjeta" href="#album/' + encodeURIComponent(a.id) + '">' +
            '<div class="album-tarjeta__img"><img src="' + t(portadaDe(a)) + '" alt="" loading="lazy">' +
            '<span class="album-tarjeta__n">' + n + (n === 1 ? " foto" : " fotos") + "</span></div>" +
            '<div class="album-tarjeta__info"><h3>' + t(a.titulo) + "</h3>" +
            (meta ? "<p>" + meta + "</p>" : "") + "</div></a>";
        }).join("") + "</div>", "seccion--gris"));
    }

    // ---- Instagram ----
    var ig = d.instagram || {};
    var fijas = lista(ig.publicaciones).map(function (p) { return enlaceInstagram(p.enlace); }).filter(Boolean);
    var feed = feedBehold(ig.behold);
    if (feed || fijas.length) {
      var perfil = enlaceSeguro(c.instagram);
      agregar("instagram", "Instagram", seccion("instagram", ig.titulo || "Síguenos en Instagram",
        '<div class="instagram" id="instagram-posts"></div>' +
        (perfil ? '<p class="instagram__mas"><a class="boton boton--borde" href="' + t(perfil) + '" target="_blank" rel="noopener">Ver más en Instagram</a></p>' : ""),
        "", "instagram.titulo"));
    }

    // ---- Contacto ----
    var redes = [
      ["Instagram", c.instagram], ["Facebook", c.facebook], ["TikTok", c.tiktok]
    ].filter(function (r) { return r[1]; });
    if (c.correo || redes.length) {
      agregar("contacto", "Contacto", seccion("contacto", titulos.contacto || "Contacto",
        '<div class="contacto">' +
        (c.correo ? '<a class="boton boton--borde" href="mailto:' + t(c.correo) + '">✉ ' + t(c.correo) + "</a>" : "") +
        redes.map(function (r) {
          return '<a class="boton boton--borde" href="' + t(enlaceSeguro(r[1])) + '" target="_blank" rel="noopener">' + r[0] + "</a>";
        }).join("") + "</div>"));
    }

    // ---- Bloques añadidos con el editor visual ----
    lista(d.bloques).forEach(function (b) {
      if (!b.id) return;
      agregar("bloque-" + b.id, b.menu || "", htmlBloque(b, d.bloques.indexOf(b)));
    });

    // ---- Orden y secciones ocultas (definidos con el editor visual) ----
    var diseno = d.diseno || {};
    var orden = lista(diseno.orden);
    var ocultas = lista(diseno.ocultas);
    secciones.forEach(function (s, i) { s.pos = orden.indexOf(s.id) >= 0 ? orden.indexOf(s.id) : 1000 + i; });
    secciones.sort(function (a, b) { return a.pos - b.pos; });
    secciones.forEach(function (s) {
      var oculta = ocultas.indexOf(s.id) >= 0;
      if (oculta && !window.FBLA_EDITANDO) return;
      html += oculta ? s.html.replace(/^<section /, '<section data-oculta="1" ') : s.html;
      if (s.menu && !oculta) nav.push([s.id, s.menu]);
    });
    // Para el editor: el orden con que se dibujó la página.
    window.FBLA_ORDEN = secciones.map(function (s) { return s.id; });

    app.innerHTML = html;
    // FBLA Connect (portal de miembros) en el menú. Si no se ha configurado, se usa el portal oficial.
    var connect = enlaceSeguro(c.fbla_connect === undefined ? "https://connect.fbla.org/" : c.fbla_connect);
    menu.innerHTML = nav.map(function (n) {
      return '<a href="#' + n[0] + '">' + n[1] + "</a>";
    }).join("") +
      (lista(d.albumes).some(albumRecibeFotos) ? '<a class="menu__subir" href="subir.html">📤 Subir fotos</a>' : "") +
      (connect ? '<a class="menu__connect" href="' + t(connect) + '" target="_blank" rel="noopener">FBLA Connect ↗</a>' : "");
    pie.innerHTML = "<p>© " + new Date().getFullYear() + " " + t(cap.nombre) + " · " + t(cap.escuela) + "</p>" +
      '<p class="pie__nota">Capítulo local de Future Business Leaders of America.</p>' +
      '<p class="pie__nota"><a href="admin.html" class="pie__editar">Panel de edición</a></p>';

    if (feed || fijas.length) mostrarInstagram(feed, fijas, cantidadInstagram(ig.cantidad));
    iniciarCuentaRegresiva();
    revisarRuta();
    registrarVisita("inicio");
    // Aviso para el editor visual (editor.js): la página terminó de dibujarse.
    document.dispatchEvent(new CustomEvent("fbla:lista"));
  }

  // ---------- Eventos y cuenta regresiva ----------
  var F = window.FechasFBLA;

  function htmlEventos(eventos) {
    var ahora = new Date();
    // El próximo evento con fecha exacta lleva la cuenta regresiva en vivo.
    var proximo = null;
    eventos.forEach(function (e, i) {
      var st = F.estado(e, ahora);
      if ((st.tipo === "futuro" || st.tipo === "manana" || st.tipo === "hoy") && st.objetivo > ahora &&
          (!proximo || st.objetivo < proximo.objetivo)) proximo = { i: i, objetivo: st.objetivo };
    });
    return '<ol class="eventos">' + eventos.map(function (e, i) {
      var st = F.estado(e, ahora);
      var caja = F.caja(e);
      var fechaTxt = F.texto(e);
      var meta = [fechaTxt, e.hora, e.lugar].filter(Boolean).map(t).join(" · ");
      var insignia = "";
      if (st.tipo === "futuro") insignia = '<span class="cuenta cuenta--futuro">⏳ Faltan ' + st.dias + " días</span>";
      else if (st.tipo === "manana") insignia = '<span class="cuenta cuenta--pronto">⏳ ¡Es mañana!</span>';
      else if (st.tipo === "hoy") insignia = '<span class="cuenta cuenta--hoy">🎉 ¡Es hoy!</span>';
      else if (st.tipo === "encurso") insignia = '<span class="cuenta cuenta--hoy">🎉 ¡En curso! · ' +
        (st.ultimo ? "Hoy es el último día" : "Termina el " + t(F.corto(st.fin))) + "</span>";
      else if (st.tipo === "estemes") insignia = '<span class="cuenta cuenta--pronto">📅 ¡Este mes!</span>';
      else if (st.tipo === "pasado") insignia = '<span class="cuenta cuenta--pasado">Finalizado</span>';
      var enVivo = proximo && proximo.i === i
        ? '<div class="reloj" data-objetivo="' + proximo.objetivo.getTime() + '" aria-label="Cuenta regresiva">' +
          ["días", "horas", "min", "seg"].map(function (u) {
            return '<div class="reloj__caja"><span class="reloj__num">--</span><span class="reloj__u">' + u + "</span></div>";
          }).join("") + "</div>"
        : "";
      return '<li class="evento' + (st.tipo === "pasado" ? " evento--pasado" : "") + (enVivo ? " evento--proximo" : "") + '">' +
        '<div class="evento__fecha' + (caja.largo ? " evento__fecha--largo" : "") + '">' +
        '<span class="evento__grande">' + t(caja.grande) + '</span><span class="evento__chico">' + t(caja.chico) + "</span></div>" +
        '<div class="evento__info">' +
        (enVivo ? '<p class="evento__etiqueta">Próximo evento</p>' : "") +
        "<h3>" + t(e.nombre) + "</h3>" +
        (meta ? '<p class="evento__meta">' + meta + "</p>" : "") +
        (e.descripcion ? "<p>" + t(e.descripcion) + "</p>" : "") +
        htmlDocsEvento(e) +
        (insignia && !enVivo ? '<p class="evento__cuenta">' + insignia + "</p>" : "") +
        enVivo +
        (st.tipo !== "pasado" ? '<button type="button" class="evento__compartir" data-compartir="' + i + '">📤 Compartir imagen</button>' : "") +
        "</div></li>";
    }).join("") + "</ol>";
  }

  // ---------- Compartir eventos y anuncios como imagen (WhatsApp, Instagram…) ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-compartir], [data-compartir-anuncio]");
    if (!b) return;
    if (b.hasAttribute("data-compartir-anuncio")) {
      var an = lista(DATOS.anuncios)[Number(b.getAttribute("data-compartir-anuncio"))];
      if (an) compartirImagen(function (emb) { return dibujarTarjetaAnuncio(an, emb); }, an.titulo || "anuncio",
        an.titulo + (an.fecha ? " — " + an.fecha : "") + "\n" + location.origin + location.pathname + "#anuncios", b);
      return;
    }
    var ev = lista(DATOS.eventos)[Number(b.getAttribute("data-compartir"))];
    if (ev) compartirImagen(function (emb) { return dibujarTarjetaEvento(ev, emb); }, ev.nombre || "evento",
      ev.nombre + " — " + F.texto(ev) + (ev.lugar ? " · " + ev.lugar : "") + "\n" + location.origin + location.pathname + "#eventos", b);
  });

  var FUENTE = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

  // Fondo y pie comunes de las imágenes para compartir (colores oficiales).
  function lienzoBase(W, H) {
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0a2e7f"); g.addColorStop(1, "#1d52bc");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(34,106,221,.35)"; x.beginPath(); x.arc(W - 60, 120, 340, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(255,255,255,.05)"; x.beginPath(); x.arc(80, H - 160, 260, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#f4ab19"; x.fillRect(0, H - 22, W, 22);
    x.textAlign = "center";
    return { c: c, x: x };
  }
  function pieTarjeta(x, W, H) {
    var cap = DATOS.capitulo || {};
    x.textAlign = "center";
    x.fillStyle = "#ffffff"; x.font = "700 40px " + FUENTE;
    x.fillText(String(cap.nombre || "FBLA").split(/\s+[-–—]\s+/)[0], W / 2, H - 150);
    x.font = "32px " + FUENTE; x.fillStyle = "rgba(255,255,255,.85)";
    x.fillText(cap.escuela || "", W / 2, H - 104);
    x.fillStyle = "#f4ab19"; x.font = "700 32px " + FUENTE;
    x.fillText(location.host || "fbladcg.github.io", W / 2, H - 56);
  }

  // Hasta 4 fotos del álbum (la portada primero) para la imagen de compartir.
  function prepararFotosAlbum(a) {
    var fotos = fotosDe(a).map(function (f) { return f.foto; });
    var portada = a.portada && fotos.indexOf(a.portada) >= 0 ? a.portada : fotos[0];
    var elegidas = [portada].concat(fotos.filter(function (f) { return f !== portada; })).slice(0, 4);
    return Promise.all(elegidas.map(function (f) { return cargarImagen(enlaceSeguro(f)); }))
      .then(function (imgs) { return imgs.filter(Boolean); });
  }

  // Dibuja una imagen recortada para llenar un rectángulo (como object-fit: cover).
  function dibujarCubriendo(x, img, dx, dy, dw, dh) {
    var r = Math.max(dw / img.width, dh / img.height);
    var sw = dw / r, sh = dh / r;
    x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, dx, dy, dw, dh);
  }

  function dibujarTarjetaAlbum(a, emblema, fotos) {
    var W = 1080, H = 1350, base = lienzoBase(W, H), x = base.x;
    fotos = fotos || [];
    // Collage de fotos arriba (1, 2 o 4)
    var top = 0, alto = 760, g = 8;
    if (fotos.length >= 4) {
      var w2 = (W - g) / 2, h2 = (alto - g) / 2;
      dibujarCubriendo(x, fotos[0], 0, top, w2, h2); dibujarCubriendo(x, fotos[1], w2 + g, top, w2, h2);
      dibujarCubriendo(x, fotos[2], 0, top + h2 + g, w2, h2); dibujarCubriendo(x, fotos[3], w2 + g, top + h2 + g, w2, h2);
    } else if (fotos.length >= 2) {
      var w = (W - g) / 2;
      dibujarCubriendo(x, fotos[0], 0, top, w, alto); dibujarCubriendo(x, fotos[1], w + g, top, w, alto);
    } else if (fotos.length === 1) {
      dibujarCubriendo(x, fotos[0], 0, top, W, alto);
    }
    // Degradado para que el texto se lea
    var dg = x.createLinearGradient(0, alto - 260, 0, alto);
    dg.addColorStop(0, "rgba(10,46,127,0)"); dg.addColorStop(1, "rgba(10,46,127,1)");
    x.fillStyle = dg; x.fillRect(0, alto - 260, W, 260);
    x.fillStyle = "#f4ab19"; x.fillRect(0, alto, W, 8);
    if (emblema) x.drawImage(emblema, W - 170, 30, 140, 140);
    x.textAlign = "center";
    x.fillStyle = "#f4ab19"; x.font = "700 38px " + FUENTE;
    x.fillText("📸 ÁLBUM DE FOTOS", W / 2, alto + 80);
    x.fillStyle = "#ffffff"; x.font = "700 66px " + FUENTE;
    var y = alto + 165;
    lineas(x, a.titulo || "Álbum", W - 160, 2).forEach(function (l) { x.fillText(l, W / 2, y); y += 76; });
    x.font = "36px " + FUENTE; x.fillStyle = "rgba(255,255,255,.9)";
    var n = fotosDe(a).length;
    var meta = [a.fecha, n + (n === 1 ? " foto" : " fotos")].filter(Boolean).join(" · ");
    x.fillText(meta, W / 2, y + 10);
    // Pie reducido (el collage ocupa más espacio)
    var cap = DATOS.capitulo || {};
    x.fillStyle = "#ffffff"; x.font = "700 32px " + FUENTE;
    x.fillText(String(cap.nombre || "FBLA").split(/\s+[-–—]\s+/)[0] + " · " + (cap.escuela || ""), W / 2, H - 80);
    x.fillStyle = "#f4ab19"; x.font = "700 30px " + FUENTE;
    x.fillText(location.host || "fbladcg.github.io", W / 2, H - 40);
    return base.c;
  }

  function dibujarTarjetaAnuncio(a, emblema) {
    var W = 1080, H = 1350, base = lienzoBase(W, H), x = base.x;
    if (emblema) x.drawImage(emblema, W / 2 - 130, 120, 260, 260);
    x.fillStyle = "#f4ab19"; x.font = "700 40px " + FUENTE;
    x.fillText("📢 ANUNCIO", W / 2, 470);
    x.fillStyle = "#ffffff"; x.font = "700 70px " + FUENTE;
    var y = 570;
    lineas(x, a.titulo, W - 160, 3).forEach(function (l) { x.fillText(l, W / 2, y); y += 82; });
    if (a.fecha) {
      y += 20;
      x.font = "700 44px " + FUENTE; x.fillStyle = "#f4ab19";
      x.fillText("📅 " + a.fecha, W / 2, y); y += 50;
    }
    if (a.texto) {
      y += 40;
      x.font = "40px " + FUENTE; x.fillStyle = "rgba(255,255,255,.95)";
      var max = Math.max(2, Math.floor((H - 230 - y) / 56));
      lineas(x, a.texto, W - 200, max).forEach(function (l) { x.fillText(l, W / 2, y); y += 56; });
    }
    pieTarjeta(x, W, H);
    return base.c;
  }

  function cargarImagen(src) {
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { ok(null); };
      img.src = src;
    });
  }

  // Parte un texto en líneas que caben en "ancho".
  function lineas(ctx, texto, ancho, max) {
    var palabras = String(texto || "").split(/\s+/), res = [], linea = "";
    palabras.forEach(function (p) {
      var prueba = linea ? linea + " " + p : p;
      if (ctx.measureText(prueba).width > ancho && linea) { res.push(linea); linea = p; } else linea = prueba;
    });
    if (linea) res.push(linea);
    if (res.length > max) { res = res.slice(0, max); res[max - 1] = res[max - 1].replace(/\s*\S*$/, "") + "…"; }
    return res;
  }

  function dibujarTarjetaEvento(ev, emblema) {
    var W = 1080, H = 1350, base = lienzoBase(W, H), x = base.x, c = base.c;
    var fuente = FUENTE;
    if (emblema) x.drawImage(emblema, W / 2 - 170, 150, 340, 340);
    // Etiqueta
    var st = F.estado(ev);
    var etiqueta = st.tipo === "hoy" ? "¡ES HOY!" : st.tipo === "encurso" ? "¡EN CURSO!" : "PRÓXIMO EVENTO";
    x.fillStyle = "#f4ab19"; x.font = "700 40px " + fuente;
    x.fillText(etiqueta, W / 2, 570);
    // Nombre del evento
    x.fillStyle = "#ffffff"; x.font = "700 76px " + fuente;
    var ls = lineas(x, ev.nombre, W - 160, 3), y = 670;
    ls.forEach(function (l) { x.fillText(l, W / 2, y); y += 88; });
    // Fecha, hora y lugar
    y += 30;
    x.font = "700 48px " + fuente; x.fillStyle = "#ffffff";
    x.fillText("📅 " + F.texto(ev), W / 2, y); y += 70;
    x.font = "40px " + fuente; x.fillStyle = "rgba(255,255,255,.9)";
    if (ev.hora) { x.fillText("🕘 " + ev.hora, W / 2, y); y += 60; }
    if (ev.lugar) lineas(x, "📍 " + ev.lugar, W - 180, 2).forEach(function (l) { x.fillText(l, W / 2, y); y += 56; });
    // Cuenta regresiva
    var cuenta = st.tipo === "futuro" ? "Faltan " + st.dias + " días" : st.tipo === "manana" ? "¡Es mañana!" : st.tipo === "estemes" ? "¡Este mes!" : "";
    if (cuenta) {
      y += 40;
      x.font = "700 46px " + fuente;
      var w = x.measureText(cuenta).width + 80;
      x.fillStyle = "#f4ab19";
      var rx = W / 2 - w / 2, ry = y - 52, rh = 76, r = 38;
      x.beginPath(); x.moveTo(rx + r, ry); x.arcTo(rx + w, ry, rx + w, ry + rh, r); x.arcTo(rx + w, ry + rh, rx, ry + rh, r);
      x.arcTo(rx, ry + rh, rx, ry, r); x.arcTo(rx, ry, rx + w, ry, r); x.fill();
      x.fillStyle = "#0a2e7f"; x.fillText(cuenta, W / 2, y);
    }
    pieTarjeta(x, W, H);
    return c;
  }

  function compartirImagen(dibujar, titulo, mensaje, boton, precarga) {
    var texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Preparando imagen…";
    Promise.all([cargarImagen("img/emblema-512.png"), precarga || Promise.resolve(null)]).then(function (r) {
      var lienzo = dibujar(r[0], r[1]);
      return new Promise(function (ok) { lienzo.toBlob(ok, "image/png"); });
    }).then(function (blob) {
      var nombre = String(titulo).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) + ".png";
      var archivo = new File([blob], nombre, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        return navigator.share({ files: [archivo], title: titulo, text: mensaje }).catch(function () {});
      }
      // Computadora: se descarga la imagen.
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
    }).catch(function () {
      alert("No se pudo crear la imagen en este navegador.");
    }).then(function () {
      boton.disabled = false;
      boton.textContent = texto;
    });
  }

  // ---------- Documentos ----------
  var TIPOS_DOC = {
    pdf: ["📕", "PDF"], doc: ["📘", "Word"], docx: ["📘", "Word"], xls: ["📗", "Excel"], xlsx: ["📗", "Excel"],
    ppt: ["📙", "PowerPoint"], pptx: ["📙", "PowerPoint"], jpg: ["🖼", "Imagen"], jpeg: ["🖼", "Imagen"], png: ["🖼", "Imagen"],
    txt: ["📄", "Texto"], csv: ["📗", "CSV"]
  };
  function tamanoLegible(b) {
    b = Number(b) || 0;
    if (!b) return "";
    return b >= 1048576 ? (b / 1048576).toFixed(1).replace(".0", "") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
  }

  // Documentos adjuntos a un evento: lista corta de enlaces para descargar.
  function htmlDocsEvento(e) {
    var docs = lista(e.documentos).filter(function (x) { return x.archivo || x.enlace; });
    if (!docs.length) return "";
    return '<ul class="evento__docs">' + docs.map(function (x) {
      var archivo = x.archivo ? enlaceSeguro(x.archivo) : "";
      var url = archivo || enlaceSeguro(x.enlace);
      var ext = archivo ? archivo.split(".").pop().toLowerCase() : "";
      var tipo = TIPOS_DOC[ext] || (archivo ? ["📄", ext.toUpperCase()] : ["🔗", "Enlace"]);
      var meta = [tipo[1], tamanoLegible(x.tamano)].filter(Boolean).join(" · ");
      return '<li><a href="' + t(url) + '"' + (archivo ? " download" : ' target="_blank" rel="noopener"') + ">" +
        tipo[0] + " " + t(x.titulo || (archivo ? archivo.split("/").pop() : "Enlace")) + "</a>" +
        '<span class="evento__docs-meta">' + t(meta) + "</span></li>";
    }).join("") + "</ul>";
  }

  function htmlDocumentos(docs) {
    return '<div class="documentos">' + docs.map(function (x) {
      var archivo = x.archivo ? enlaceSeguro(x.archivo) : "";
      var url = archivo || enlaceSeguro(x.enlace);
      var ext = archivo ? archivo.split(".").pop().toLowerCase() : "";
      var tipo = TIPOS_DOC[ext] || (archivo ? ["📄", ext.toUpperCase()] : ["🔗", "Enlace"]);
      var meta = [tipo[1], tamanoLegible(x.tamano)].filter(Boolean).join(" · ");
      var botones = archivo
        ? (ext === "pdf" ? '<a class="boton boton--borde boton--chico" href="' + t(url) + '" target="_blank" rel="noopener">👁 Ver</a>' : "") +
          '<a class="boton boton--acento boton--chico" href="' + t(url) + '" download>⬇ Descargar</a>'
        : '<a class="boton boton--acento boton--chico" href="' + t(url) + '" target="_blank" rel="noopener">Abrir ↗</a>';
      return '<article class="documento">' +
        '<span class="documento__icono" aria-hidden="true">' + tipo[0] + "</span>" +
        '<div class="documento__info"><h3>' + t(x.titulo) + "</h3>" +
        (x.descripcion ? "<p>" + t(x.descripcion) + "</p>" : "") +
        '<span class="documento__meta">' + t(meta) + "</span></div>" +
        '<div class="documento__botones">' + botones + "</div></article>";
    }).join("") + "</div>";
  }

  // ---------- Logros agrupados por año académico (desplegables) ----------
  function htmlLogros(logros) {
    var actual = F.anioAcademicoActual();
    var grupos = {};
    logros.forEach(function (l) {
      var a = l.anio_academico || F.anioAcademicoDeTexto((l.titulo || "") + " " + (l.detalle || "")) || actual;
      (grupos[a] = grupos[a] || []).push(l);
    });
    var anios = Object.keys(grupos).sort().reverse();
    // Abierto: el año actual; si no tiene logros, el más reciente.
    var abierto = grupos[actual] ? actual : anios[0];
    return '<div class="logros-anios">' + anios.map(function (a) {
      var n = grupos[a].length;
      return '<details class="logros-anio"' + (a === abierto ? " open" : "") + ">" +
        '<summary><span class="logros-anio__nombre">Año académico ' + t(a) + "</span>" +
        (a === actual ? '<span class="logros-anio__actual">Año actual</span>' : "") +
        '<span class="logros-anio__n">' + n + (n === 1 ? " logro" : " logros") + "</span></summary>" +
        '<ul class="logros">' + grupos[a].map(function (l) {
          return '<li class="logro"><span class="logro__icono" aria-hidden="true">★</span><div>' +
            "<h3>" + t(l.titulo) + "</h3>" +
            (l.competencia ? '<p class="logro__comp">🏅 ' + t(l.competencia) + "</p>" : "") +
            (l.detalle ? "<p>" + t(l.detalle) + "</p>" : "") +
            "</div></li>";
        }).join("") + "</ul></details>";
    }).join("") + "</div>";
  }

  // Próximo evento con fecha exacta (para la portada).
  function proximoEvento(eventos) {
    var ahora = new Date(), mejor = null;
    eventos.forEach(function (e) {
      var st = F.estado(e, ahora);
      if (st.tipo === "encurso") { if (!mejor || !mejor.encurso) mejor = { ev: e, encurso: true, cuando: "¡En curso!", orden: -1 }; return; }
      if (st.tipo !== "futuro" && st.tipo !== "manana" && st.tipo !== "hoy") return;
      var orden = st.tipo === "hoy" ? 0 : st.dias;
      var cuando = st.tipo === "hoy" ? "¡Es hoy!" : st.tipo === "manana" ? "¡Es mañana!" : "Faltan " + st.dias + " días";
      if (!mejor || (!mejor.encurso && orden < mejor.orden)) mejor = { ev: e, cuando: cuando, orden: orden };
    });
    return mejor;
  }

  var relojTimer = null;
  function iniciarCuentaRegresiva() {
    clearInterval(relojTimer);
    var reloj = document.querySelector(".reloj[data-objetivo]");
    if (!reloj) return;
    var objetivo = Number(reloj.getAttribute("data-objetivo"));
    var nums = reloj.querySelectorAll(".reloj__num");
    var tic = function () {
      var falta = Math.max(0, objetivo - Date.now());
      var s = Math.floor(falta / 1000);
      var valores = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      valores.forEach(function (v, i) { nums[i].textContent = i === 0 ? String(v) : (v < 10 ? "0" : "") + v; });
      if (falta <= 0) clearInterval(relojTimer);
    };
    tic();
    relojTimer = setInterval(tic, 1000);
  }

  // ---------- Instagram ----------
  var CACHE_IG = "fbla3281-instagram";
  var HORAS_CACHE_IG = 3;

  function feedBehold(url) {
    var u = String(url || "").trim();
    return /^https:\/\/feeds\.behold\.so\/[\w-]+\/?$/.test(u) ? u : "";
  }

  function cantidadInstagram(n) {
    n = parseInt(n, 10);
    return n >= 1 && n <= 12 ? n : 2;
  }

  // Lee las publicaciones más recientes del feed de Behold.
  // Guarda una copia por 3 horas en el navegador para no gastar el límite gratis.
  function ultimasPublicaciones(feed) {
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(CACHE_IG) || "null"); } catch (e) {}
    if (guardado && guardado.feed === feed && Date.now() - guardado.hora < HORAS_CACHE_IG * 3600000 && guardado.enlaces.length) {
      return Promise.resolve(guardado.enlaces);
    }
    return fetch(feed).then(function (r) {
      if (!r.ok) throw new Error("Behold " + r.status);
      return r.json();
    }).then(function (j) {
      var posts = Array.isArray(j) ? j : (j && (j.posts || j.media)) || [];
      var enlaces = posts.map(function (p) { return enlaceInstagram(p && p.permalink); }).filter(Boolean);
      if (!enlaces.length) throw new Error("Feed vacío");
      try { localStorage.setItem(CACHE_IG, JSON.stringify({ feed: feed, hora: Date.now(), enlaces: enlaces })); } catch (e) {}
      return enlaces;
    }).catch(function (e) {
      if (guardado && guardado.feed === feed && guardado.enlaces.length) return guardado.enlaces;  // copia vieja
      throw e;
    });
  }

  function mostrarInstagram(feed, fijas, cantidad) {
    var cont = document.getElementById("instagram-posts");
    var pintar = function (enlaces) {
      if (!enlaces.length) {
        var sec = document.getElementById("instagram");
        if (sec) sec.querySelector(".instagram").innerHTML = "";
        return;
      }
      // Cada publicación va en un marco; todos los marcos de la fila miden lo mismo
      // y el botón de abajo queda alineado (nada se recorta).
      cont.innerHTML = enlaces.slice(0, cantidad).map(function (url) {
        return '<div class="instagram__post"><div class="instagram__marco"><blockquote class="instagram-media" data-instgrm-permalink="' + t(url) +
          '?utm_source=ig_embed" data-instgrm-version="14"><a href="' + t(url) + '" target="_blank" rel="noopener">Ver esta publicación en Instagram</a></blockquote></div>' +
          '<a class="instagram__ver" href="' + t(url) + '" target="_blank" rel="noopener">Ver en Instagram ↗</a></div>';
      }).join("");
      cargarInstagram();
    };
    if (!feed) return pintar(fijas);
    ultimasPublicaciones(feed).then(pintar, function () { pintar(fijas); });
  }

  function cargarInstagram() {
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(s);
  }

  // ---------- Vista de un álbum ----------
  var vista = null;      // contenedor del álbum abierto
  var visor = null;      // visor de una foto
  var fotosAbiertas = [];
  var posVisor = 0;
  var scrollAntes = 0;

  function revisarRuta() {
    var m = location.hash.match(/^#album\/(.+)$/);
    if (m) {
      var id = decodeURIComponent(m[1]);
      var album = albumesPublicados().filter(function (a) { return String(a.id) === id; })[0];
      if (album) return abrirAlbum(album);
    }
    cerrarAlbum();
  }

  function nombreArchivo(ruta) {
    return String(ruta).split("/").pop();
  }

  function abrirAlbum(a) {
    cerrarVisor();
    if (!vista) scrollAntes = window.scrollY;
    if (vista) vista.remove();
    fotosAbiertas = fotosDe(a);
    registrarVisita("album:" + a.id);
    var meta = [a.fecha, a.lugar].filter(Boolean).map(t).join(" · ");
    vista = document.createElement("div");
    vista.className = "album-vista";
    vista.setAttribute("role", "dialog");
    vista.setAttribute("aria-modal", "true");
    vista.setAttribute("aria-label", a.titulo || "Álbum");
    vista.innerHTML =
      '<div class="album-vista__barra"><div class="contenedor album-vista__fila">' +
      '<a class="boton boton--claro" href="#albumes">← Álbumes</a>' +
      '<div class="album-vista__acciones">' +
      '<button class="boton boton--claro" type="button" data-compartir-album title="Crea una imagen del álbum para WhatsApp o Instagram">🔗 Compartir álbum</button>' +
      '<button class="boton boton--acento" type="button" data-zip title="Descarga cada foto por separado">⬇ Descargar todas</button>' +
      "</div></div></div>" +
      '<div class="contenedor album-vista__cuerpo">' +
      "<h2>" + t(a.titulo) + "</h2>" +
      (meta ? '<p class="album-vista__meta">' + meta + " · " + fotosAbiertas.length + (fotosAbiertas.length === 1 ? " foto" : " fotos") + "</p>" : "") +
      (a.descripcion ? '<p class="album-vista__desc">' + t(a.descripcion) + "</p>" : "") +
      // Invitación a subir fotos (solo si el álbum las acepta)
      (albumRecibeFotos(a)
        ? '<div class="album-subir"><span class="album-subir__icono" aria-hidden="true">📷</span>' +
          '<div><strong>¿Tienes fotos de este evento?</strong><span>Envíalas y, cuando la directiva las apruebe, saldrán aquí con tu nombre.</span></div>' +
          '<a class="boton boton--acento" href="subir.html?album=' + encodeURIComponent(a.id) + '">📤 Subir mis fotos</a></div>'
        : "") +
      '<div class="album-fotos">' + fotosAbiertas.map(function (f, i) {
        return '<button type="button" class="album-foto" data-i="' + i + '" aria-label="Ver foto ' + (i + 1) + '">' +
          '<img src="' + t(enlaceSeguro(f.foto)) + '" alt="' + t(f.descripcion || "") + '" loading="lazy"></button>';
      }).join("") + "</div></div>";
    document.body.appendChild(vista);
    document.body.classList.add("sin-scroll");
    vista.scrollTop = 0;

    vista.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (b) abrirVisor(Number(b.getAttribute("data-i")));
      if (e.target.closest("[data-zip]")) descargarTodas(a, e.target.closest("[data-zip]"));
      var comp = e.target.closest("[data-compartir-album]");
      if (comp) compartirImagen(function (emb, fotos) { return dibujarTarjetaAlbum(a, emb, fotos); }, a.titulo || "album",
        "📸 " + (a.titulo || "Álbum") + (a.fecha ? " — " + a.fecha : "") + "\n" + location.origin + location.pathname + "#album/" + encodeURIComponent(a.id), comp, prepararFotosAlbum(a));
    });
    var volver = vista.querySelector(".boton--claro");
    if (volver) volver.focus();
  }

  function cerrarAlbum() {
    cerrarVisor();
    if (!vista) return;
    vista.remove();
    vista = null;
    document.body.classList.remove("sin-scroll");
    var sec = document.getElementById("albumes");
    if (location.hash === "#albumes" && sec) sec.scrollIntoView();
    else window.scrollTo(0, scrollAntes);
  }

  // ---------- Visor de fotos ----------
  function abrirVisor(i) {
    posVisor = i;
    if (!visor) {
      visor = document.createElement("div");
      visor.className = "visor";
      visor.setAttribute("role", "dialog");
      visor.setAttribute("aria-modal", "true");
      visor.innerHTML =
        '<button class="visor__btn visor__cerrar" type="button" aria-label="Cerrar">✕</button>' +
        '<button class="visor__btn visor__ant" type="button" aria-label="Foto anterior">‹</button>' +
        '<figure class="visor__fig"><img alt=""><figcaption></figcaption></figure>' +
        '<button class="visor__btn visor__sig" type="button" aria-label="Foto siguiente">›</button>' +
        '<div class="visor__pie"><span class="visor__cuenta"></span>' +
        '<a class="boton boton--acento visor__descargar" download>⬇ Descargar</a></div>';
      document.body.appendChild(visor);
      visor.querySelector(".visor__cerrar").addEventListener("click", cerrarVisor);
      // Descargar: las fotos WebP se entregan en JPG.
      visor.querySelector(".visor__descargar").addEventListener("click", function (e) {
        var d = e.currentTarget;
        if (!/\.webp$/i.test(d.getAttribute("href") || "")) return;
        e.preventDefault();
        var txt = d.textContent;
        d.textContent = "Preparando…";
        fotoParaDescargar(d.getAttribute("href")).then(function (x) { guardarBlob(x.blob, x.nombre); })
          .catch(function () { window.open(d.getAttribute("href"), "_blank"); })
          .then(function () { d.textContent = txt; });
      });
      visor.querySelector(".visor__ant").addEventListener("click", function () { moverVisor(-1); });
      visor.querySelector(".visor__sig").addEventListener("click", function () { moverVisor(1); });
      visor.addEventListener("click", function (e) { if (e.target === visor) cerrarVisor(); });
      var x0 = null;
      visor.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      visor.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1);
        x0 = null;
      });
    }
    pintarVisor();
    visor.querySelector(".visor__cerrar").focus();
  }

  function pintarVisor() {
    var f = fotosAbiertas[posVisor];
    var src = enlaceSeguro(f.foto);
    visor.querySelector("img").src = src;
    visor.querySelector("img").alt = f.descripcion || "";
    var pie = [f.descripcion, f.autor ? "📷 " + f.autor : ""].filter(Boolean).join(" · ");
    visor.querySelector("figcaption").textContent = pie;
    visor.querySelector(".visor__cuenta").textContent = (posVisor + 1) + " de " + fotosAbiertas.length;
    var d = visor.querySelector(".visor__descargar");
    d.href = src;
    d.setAttribute("download", nombreArchivo(src).replace(/\.webp$/i, ".jpg"));
    var varias = fotosAbiertas.length > 1;
    visor.querySelector(".visor__ant").hidden = !varias;
    visor.querySelector(".visor__sig").hidden = !varias;
  }

  function moverVisor(paso) {
    posVisor = (posVisor + paso + fotosAbiertas.length) % fotosAbiertas.length;
    pintarVisor();
  }

  function cerrarVisor() {
    if (!visor) return;
    visor.remove();
    visor = null;
  }

  document.addEventListener("keydown", function (e) {
    if (visor) {
      if (e.key === "Escape") cerrarVisor();
      else if (e.key === "ArrowRight") moverVisor(1);
      else if (e.key === "ArrowLeft") moverVisor(-1);
    } else if (vista && e.key === "Escape") {
      location.hash = "albumes";
    }
  });

  // ---------- Descargas ----------
  // Las fotos se guardan en WebP (ocupan la mitad); al descargarlas se entregan en JPG,
  // que abre en cualquier celular o computadora. Las PNG y JPG se bajan tal cual.
  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  function fotoParaDescargar(url) {
    var nombre = nombreArchivo(url);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("No se pudo bajar " + nombre);
      return r.blob();
    }).then(function (b) {
      if (!/\.webp$/i.test(nombre)) return { blob: b, nombre: nombre };
      return createImageBitmap(b).then(function (bmp) {
        var c = document.createElement("canvas");
        c.width = bmp.width; c.height = bmp.height;
        var x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(bmp, 0, 0);
        return new Promise(function (ok) { c.toBlob(ok, "image/jpeg", 0.95); });
      }).then(function (jpg) {
        return { blob: jpg, nombre: nombre.replace(/\.webp$/i, ".jpg") };
      }, function () { return { blob: b, nombre: nombre }; });
    });
  }

  function guardarBlob(blob, nombre) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 20000);
  }

  function descargarTodas(album, boton) {
    if (boton.disabled) return;
    var textoOriginal = boton.textContent;
    var fotos = fotosDe(album);
    boton.disabled = true;
    fotos.reduce(function (p, f, i) {
      return p.then(function () {
        boton.textContent = "Descargando " + (i + 1) + " de " + fotos.length + "…";
        return fotoParaDescargar(enlaceSeguro(f.foto)).then(function (x) {
          guardarBlob(x.blob, x.nombre);
          return esperar(600);   // pausa para que el navegador acepte varias descargas
        });
      });
    }, Promise.resolve()).catch(function (e) {
      alert("No se pudieron descargar las fotos. " + e.message);
    }).then(function () {
      boton.disabled = false;
      boton.textContent = textoOriginal;
    });
  }

  window.addEventListener("hashchange", revisarRuta);

  // Lo que el editor visual (editor.js) necesita de la página.
  window.FBLA = {
    datos: function () { return DATOS; },
    reconstruir: function (d) { construir(d); },
    sanear: sanear,
    idYouTube: idYouTube
  };

  function mostrarError(mensaje) {
    app.innerHTML =
      '<section class="seccion"><div class="contenedor error">' +
      "<h2>⚠ Hay un error en contenido.yml</h2>" +
      "<p>La página no pudo leer el archivo de contenido. Revisa el último cambio que hiciste. " +
      "Lo más común es: un espacio de más o de menos al principio de la línea, o una comilla \" que falta.</p>" +
      "<pre>" + t(mensaje) + "</pre>" +
      "<p>Consejo: en GitHub, abre <strong>contenido.yml</strong>, ve a la pestaña <em>History</em> y compara con la versión anterior.</p>" +
      "</div></section>";
  }

  // Menú en celulares
  var botonMenu = document.querySelector(".menu-boton");
  botonMenu.addEventListener("click", function () {
    var abierto = menu.classList.toggle("menu--abierto");
    botonMenu.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      menu.classList.remove("menu--abierto");
      botonMenu.setAttribute("aria-expanded", "false");
    }
  });

  // "?v=" evita que el navegador muestre una versión vieja del contenido.
  fetch("contenido.yml?v=" + Date.now(), { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("No se encontró el archivo contenido.yml (código " + r.status + ").");
      return r.text();
    })
    .then(function (texto) {
      var datos;
      try {
        datos = jsyaml.load(texto);
      } catch (err) {
        var linea = err.mark ? "Error cerca de la línea " + (err.mark.line + 1) + ":\n\n" : "";
        throw new Error(linea + (err.reason || err.message));
      }
      construir(datos || {});
    })
    .catch(function (err) { mostrarError(err.message); });
})();
