// =============================================================
//  Página para que los miembros envíen fotos a un álbum.
//  Las fotos van a una carpeta privada de Google Drive y solo se
//  publican cuando el admin las aprueba en el Panel de edición.
// =============================================================

(function () {
  "use strict";

  var MAX_FOTOS = 15;
  var MAX_LADO = 2000;
  var $ = function (id) { return document.getElementById(id); };
  var url = "";
  var albumes = [];
  var archivos = [];

  function mensaje(texto, error) {
    var m = $("mensaje");
    m.textContent = texto;
    m.className = "mensaje " + (error ? "mensaje--error" : "mensaje--ok");
    m.hidden = false;
  }

  function prepararImagen(file) {
    return new Promise(function (ok, mal) {
      var u = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        var png = file.type === "image/png";
        var ctx = c.getContext("2d");
        if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        var tipo = png ? "image/png" : "image/jpeg";
        ok({ tipo: tipo, datos: c.toDataURL(tipo, 0.85).split(",")[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(u); mal(new Error("No se pudo abrir " + file.name + ". Usa fotos JPG o PNG.")); };
      img.src = u;
    });
  }

  function enviarUna(file, base) {
    return prepararImagen(file).then(function (img) {
      var cuerpo = {
        accion: "subir",
        codigo: base.codigo,
        album: base.album.id,
        albumTitulo: base.album.titulo || "",
        nombre: base.nombre,
        nota: base.nota,
        archivo: file.name,
        tipo: img.tipo,
        datos: img.datos
      };
      return fetch(url, { method: "POST", body: JSON.stringify(cuerpo) });
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || "No se pudo enviar la foto.");
    });
  }

  function iniciar(d) {
    var s = d.subidas || {};
    url = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(s.url || "").trim()) ? String(s.url).trim() : "";
    // Solo los álbumes publicados que aceptan fotos de miembros.
    albumes = (d.albumes || []).filter(function (a) { return a && a.id && a.publicado === true && a.recibe_fotos !== false; });
    if (d.capitulo && d.capitulo.nombre) $("marca-texto").textContent = d.capitulo.nombre;

    // Conteo de visitas (una vez por día en este navegador; sin datos personales)
    if (url && /\.github\.io$/i.test(location.hostname)) {
      var hoy = new Date().toISOString().slice(0, 10), clave = "fbla3281-visita-subir", visto = null, admin = false;
      try { admin = localStorage.getItem("fbla3281-admin") === "1"; visto = localStorage.getItem(clave); localStorage.setItem(clave, hoy); } catch (e) {}
      if (!admin && visto !== hoy) { try { fetch(url + "?accion=visita&p=subir", { mode: "no-cors", keepalive: true }); } catch (e) {} }
    }

    if (s.activo !== true || !url || !albumes.length) {
      $("cerrado").hidden = false;
      return;
    }

    var sel = $("album");
    var pedido = new URLSearchParams(location.search).get("album");
    sel.appendChild(new Option("— Escoge el evento —", ""));
    albumes.forEach(function (a) {
      var o = new Option([a.titulo, a.fecha].filter(Boolean).join(" · "), a.id);
      if (a.id === pedido) o.selected = true;
      sel.appendChild(o);
    });
    $("formulario").hidden = false;

    // Pregunta al script si hay que escribir el código del capítulo.
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      $("campo-codigo").hidden = !(j && j.pideCodigo);
    }).catch(function () {
      $("campo-codigo").hidden = false;   // si no se sabe, se muestra por si acaso
    });

    $("fotos").addEventListener("change", function () {
      archivos = Array.prototype.slice.call(this.files || []).slice(0, MAX_FOTOS);
      var cont = $("miniaturas");
      cont.innerHTML = "";
      archivos.forEach(function (f) {
        var img = document.createElement("img");
        img.alt = "";
        img.src = URL.createObjectURL(f);
        cont.appendChild(img);
      });
      var extra = (this.files || []).length > MAX_FOTOS ? " (solo se enviarán las primeras " + MAX_FOTOS + ")" : "";
      $("cuantas").textContent = archivos.length ? archivos.length + (archivos.length === 1 ? " foto escogida" : " fotos escogidas") + extra : "JPG o PNG";
    });

    $("formulario").addEventListener("submit", function (e) {
      e.preventDefault();
      $("mensaje").hidden = true;
      var album = albumes.filter(function (a) { return a.id === sel.value; })[0];
      var nombre = $("nombre").value.trim();
      if (!album) return mensaje("Escoge el álbum o evento.", true);
      if (!nombre) return mensaje("Escribe tu nombre.", true);
      if (!archivos.length) return mensaje("Escoge al menos una foto.", true);
      if (!$("permiso").checked) return mensaje("Confirma que tienes permiso para compartir las fotos.", true);

      var boton = $("enviar");
      boton.disabled = true;
      var base = { album: album, nombre: nombre, codigo: $("codigo").value.trim(), nota: $("nota").value.trim() };
      var enviadas = 0;
      var error = null;
      archivos.reduce(function (p, f, i) {
        return p.then(function () {
          if (error) return;
          boton.textContent = "Enviando foto " + (i + 1) + " de " + archivos.length + "…";
          return enviarUna(f, base).then(function () { enviadas++; }, function (err) { error = err; });
        });
      }, Promise.resolve()).then(function () {
        boton.disabled = false;
        boton.textContent = "Enviar fotos";
        if (enviadas === archivos.length) {
          mensaje("¡Gracias! Se enviaron " + enviadas + (enviadas === 1 ? " foto" : " fotos") + ". La directiva las revisará antes de publicarlas.");
          archivos = [];
          $("fotos").value = "";
          $("miniaturas").innerHTML = "";
          $("cuantas").textContent = "JPG o PNG";
          $("nota").value = "";
        } else {
          mensaje((enviadas ? "Se enviaron " + enviadas + " de " + archivos.length + " fotos. Si vuelves a darle a «Enviar», se envían solo las que faltan. " : "") + (error ? error.message : ""), true);
          archivos = archivos.slice(enviadas);
          Array.prototype.slice.call($("miniaturas").children, 0, enviadas).forEach(function (n) { n.remove(); });
          $("cuantas").textContent = archivos.length + " por enviar";
        }
      });
    });
  }

  fetch("contenido.yml?v=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.text(); })
    .then(function (t) { iniciar(jsyaml.load(t) || {}); })
    .catch(function () { $("cerrado").hidden = false; });
})();
