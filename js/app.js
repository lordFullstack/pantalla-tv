(function () {
  "use strict";
  var PT = window.PT;
  var q = new URLSearchParams(location.search);
  var stage = document.getElementById("stage");
  var view = document.getElementById("view");
  var bar = document.getElementById("bar");
  var curtain = document.getElementById("curtain");

  /* ---------- utilidades ---------- */
  var money = function (n) { return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  var toMin = function (s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function fmt12(s) {
    var p = s.split(":"), h = +p[0], m = p[1], ap = h >= 12 ? "pm" : "am";
    return (h % 12 || 12) + ":" + m + " " + ap;
  }

  /* Hora: ?t=16:30 simula otra hora para probar */
  var offset = 0;
  if (q.get("t")) {
    var tp = q.get("t").split(":"), d0 = new Date();
    d0.setHours(+tp[0], +(tp[1] || 0), 0, 0);
    offset = d0 - new Date();
  }
  var now = function () { return new Date(Date.now() + offset); };

  /* Momento del día → qué lista de escenas toca */
  function context() {
    var S = PT.schedule, t = now().getHours() * 60 + now().getMinutes(), mode = q.get("mode");
    if (!mode) {
      if (t >= toMin(S.kitchenOpen) && t < toMin(S.close)) mode = "noche";
      else if (t >= toMin(S.juiceOpen) && t < toMin(S.kitchenOpen)) mode = "tarde";
      else if (t >= toMin(S.dayFrom) && t < toMin(S.juiceOpen)) mode = "promo";
      else mode = "cerrado";
    }
    return { mode: mode, theme: (mode === "noche" || mode === "cerrado") ? "night" : "day" };
  }

  function nextTime(hhmm) {
    var d = now(), p = hhmm.split(":"), t = new Date(d);
    t.setHours(+p[0], +p[1], 0, 0);
    if (t <= d) t.setDate(t.getDate() + 1);
    return t;
  }

  /* ---------- piezas reutilizables ---------- */
  function brand(which) {
    var word = '<span class="word"><small>Pa&#39;</small><b>COMER</b></span>';
    var subWord = '<span class="sub"><small>Pa&#39;</small><b>TOMAR</b></span>';
    var sub = which === "tomar"
      ? '<span class="sub img"><img src="' + PT.logos.tomar + '" alt="Pa&#39;TOMAR" data-word="' + subWord.replace(/"/g, "&quot;") +
        '" onerror="this.parentNode.outerHTML=this.dataset.word"></span>' : "";
    return '<div class="brandmark" data-a="rise" style="--d:0s">' +
      '<img src="' + PT.logos.comer + '" alt="Pa&#39;COMER" data-word="' + word.replace(/"/g, "&quot;") +
      '" onerror="this.outerHTML=this.dataset.word">' + sub + "</div>";
  }
  function photo(key, cls, d) {
    return '<figure class="photo ' + cls + '" style="--d:' + (d || 0) + 's"><img src="' + PT.img[key] + '" alt=""></figure>';
  }
  /* Sticker con video de la sección; si el archivo no existe, usa la foto (o nada). */
  /* Insignia que avisa desde qué hora está disponible cada sección (solo si todavía no abre) */
  function when(c, kind) {
    var S = PT.schedule, now_ = now().getHours() * 60 + now().getMinutes();
    var at = kind === "cocina" ? S.kitchenOpen : S.juiceOpen;
    if (now_ >= toMin(at) && now_ < toMin(S.close)) return "";
    return '<div class="when" data-a="pop" style="--d:.9s">Desde las ' + fmt12(at) + "</div>";
  }
  /* Si el navegador bloquea la reproducción automática, se muestra un ▶ sobre el video;
     cualquier toque o tecla del control remoto (OK) lo arranca. */
  function markBlocked(v, e) {
    if (e && e.name !== "NotAllowedError") return;
    if (v.parentNode && v.parentNode.classList) v.parentNode.classList.add("blocked");
  }
  document.addEventListener("playing", function (e) {
    var f = e.target.parentNode; if (f && f.classList) f.classList.remove("blocked");
  }, true);
  ["pointerdown", "keydown"].forEach(function (ev) {
    addEventListener(ev, function () {
      [].forEach.call(document.querySelectorAll("video"), function (v) { if (v.paused) v.play().catch(function () {}); });
    });
  });
  var sectionPick = {};
  function videoSticker(key, cls, fallbackImg, d) {
    var fb = fallbackImg
      ? '<img src="' + PT.img[fallbackImg] + '" alt="">' : "";
    var src = PT.sectionVideos[key];
    if (src.push) { sectionPick[key] = (sectionPick[key] || 0) + 1; src = src[(sectionPick[key] - 1) % src.length]; }
    return '<figure class="photo ' + cls + '" style="--d:' + (d || 0) + 's">' +
      '<video src="' + src + '" muted loop playsinline preload="auto" data-fb="' +
      (fallbackImg ? "1" : "0") + '"></video></figure>';
  }
  function playAll(el) {
    var vids = [].slice.call(el.querySelectorAll("video[data-fb]"));
    vids.forEach(function (v) {
      v.muted = true; v.defaultMuted = true;
      v.addEventListener("error", function () {
        var fig = v.parentNode;
        if (v.dataset.fb === "1") fig.innerHTML = '<img src="' + PT.img.canastas + '" alt="">';
        else fig.remove();
      });
      var tries = 0;
      (function go() { var p = v.play(); if (p && p.catch) p.catch(function (e) { markBlocked(v, e); if (tries++ < 20 && !v._stop) setTimeout(go, 500); }); })();
      /* si el navegador lo pausa solo, se reanuda mientras la escena siga en pantalla */
      v.addEventListener("pause", function () { if (!v._stop) setTimeout(function () { if (!v._stop) v.play().catch(function () {}); }, 300); });
    });
    return { cleanup: function () { vids.forEach(function (v) { v._stop = true; v.pause(); }); } };
  }

  function dotList(list, one) {
    return '<ul class="flavors' + (one ? " one" : "") + '">' + list.map(function (f, i) {
      return '<li data-a="rise" style="--d:' + (0.35 + i * 0.07) + 's"><span class="dot" style="--c:' + f[1] + '"></span>' + f[0] + "</li>";
    }).join("") + "</ul>";
  }
  function rows(items, d0) {
    return items.map(function (it, i) {
      return '<div class="row" data-a="rise" style="--d:' + (d0 + i * 0.12) + 's"><div><h3>' + it.name + "</h3>" +
        (it.desc ? "<p>" + it.desc + "</p>" : "") + "</div>" +
        (it.price ? '<span class="p">' + money(it.price) + "</span>" : "") + "</div>";
    }).join("");
  }

  /* ---------- escenas ---------- */
  var STICKER_COLORS = ["#E3262E", "#FF8A00", "#F4C20D", "#8DBF2E", "#8E2B8F", "#FF5A8A", "#E8601C", "#1FA24B", "#C21E56", "#F2A900"];
  var SCENES = {};

  SCENES.club = {
    label: "Club", dur: 17, tone: ["sun", "ember"],
    html: function () {
      var slots = "";
      for (var i = 0; i < PT.club.goal; i++) {
        slots += '<div class="slot"><div class="st" style="--i:' + i + ";--c:" + STICKER_COLORS[i % 10] + ";--rot:" + ((i % 3) - 1) * 4 + 'deg">' +
          '<svg viewBox="0 0 100 100"><use href="#slice"/></svg><span class="n">' + (i + 1) + "</span></div></div>";
      }
      return brand("tomar") +
        '<div class="txt"><h1 data-a="rise" style="--d:.1s">Club de <em>Jugos</em></h1>' +
        '<p class="lead" data-a="rise" style="--d:.25s">Cada jugo que compras te regala un sticker en la app.</p>' +
        '<div class="stickergrid">' + slots + "</div>" +
        '<p class="win">Con ' + PT.club.goal + " stickers, <em>tu jugo va por la casa.</em></p></div>" +
        photo("batidos", "");
    }
  };

  /* Gancho del Club: titular gigante + premios instantáneos en grande */
  SCENES.gancho = {
    label: "Gratis", dur: 16, tone: ["ember", "coal"],
    html: function () {
      var H = PT.club.hook, drops = "";
      for (var i = 0; i < 12; i++) {
        drops += '<div class="drop" style="--x:' + (i * 8.6 + (i % 3) * 2) + "%;--s:" + (88 + (i * 37) % 60) + "px;--t:" + (11 + (i * 5) % 7) +
          "s;--d:-" + ((i * 3.1) % 11).toFixed(1) + "s;--c:" + STICKER_COLORS[i % 10] + '"><svg viewBox="0 0 100 100"><use href="#slice"/></svg></div>';
      }
      var words = H.title.split(" ").map(function (w, i) {
        return '<span class="w' + (/gratis/i.test(w) ? " hot" : "") + '" style="--i:' + i + '">' + w + "</span>";
      }).join(" ");
      var pw = H.prizesTitle.split(" "), last = pw.pop();
      var medals = PT.club.prizes.map(function (p, i) {
        var d = i * 0.45;
        return '<div class="medal" style="--d:' + d + 's"><div class="disc"><div class="disc-in" style="--d:' + d + 's">' +
          '<div class="face front" style="--d:' + d + 's">?</div>' +
          '<div class="face back"><img src="' + PT.img[p.img] + '" alt=""></div></div></div>' +
          "<h3>" + p.name + '</h3><span class="tag" style="--d:' + (2.2 + d) + 's">' + H.tag + "</span></div>";
      }).join("");
      return drops + brand("tomar") +
        '<h1 class="hook">' + words + "</h1>" +
        '<p class="hook-sub" data-a="rise" style="--d:1.1s">' + H.sub + "</p>" +
        '<div class="g-left"><h2 data-a="rise" style="--d:1.5s">' + pw.join(" ") + " <em>" + last + "</em></h2>" +
        '<p data-a="rise" style="--d:1.9s">' + H.note + "</p></div>" +
        '<div class="g-medals">' + medals + "</div>";
    }
  };

  SCENES.premios = {
    label: "Premios", dur: 15, tone: ["ember", "coal"],
    html: function () {
      var subs = ["Sin juntar los " + PT.club.goal, "Sin juntar los " + PT.club.goal, "Sin juntar los " + PT.club.goal];
      var medals = PT.club.prizes.map(function (p, i) {
        return '<div class="medal"><div class="disc"><div class="disc-in" style="--d:' + (i * 0.45) + 's">' +
          '<div class="face front" style="--d:' + (i * 0.45) + 's">?</div>' +
          '<div class="face back"><img src="' + PT.img[p.img] + '" alt=""></div></div></div>' +
          "<h3>" + p.name + "</h3></div>";
      }).join("");
      return brand("tomar") +
        '<div class="txt"><h1 data-a="rise" style="--d:.1s">Premios<br><em>al instante</em></h1>' +
        '<p class="lead" data-a="rise" style="--d:.3s">Entre los stickers que ganas hay 3 de la suerte. Si te sale uno, es tuyo ya, sin juntar los ' + PT.club.goal + ".</p></div>" +
        '<div class="medals">' + medals + "</div>";
    }
  };

  function countScene(o) {
    return {
      label: o.label, dur: 16, tone: o.tone,
      html: function () {
        var tgt = nextTime(o.at), today = tgt.getDate() === now().getDate();
        var side = o.reel
          ? '<div class="reel">' + [0, 1, 2].map(function (c) {
              var set = o.reel[c].concat(o.reel[c]);
              return '<div class="col"><div class="col-in" style="--t:' + (52 + c * 14) + 's">' +
                set.map(function (k) { return '<div class="it"><img src="' + PT.img[k] + '" alt=""></div>'; }).join("") + "</div></div>";
            }).join("") + "</div>"
          : photo(o.photo, "", 0.1);
        return brand(o.brand) +
          '<div class="txt"><h1 data-a="rise" style="--d:.1s">' + o.title(today) + '<span class="big">' + fmt12(o.at) + "</span></h1>" +
          '<div class="cd" data-a="rise" style="--d:.35s" data-target="' + tgt.getTime() + '">' +
          '<div class="cu"><b data-u="h">00</b><i>horas</i></div><div class="cu"><b data-u="m">00</b><i>minutos</i></div><div class="cu"><b data-u="s">00</b><i>segundos</i></div></div></div>' +
          side;
      },
      mount: function (el) {
        var cd = el.querySelector(".cd"), tgt = +cd.dataset.target;
        function tick() {
          var s = Math.max(0, Math.floor((tgt - Date.now() - offset) / 1000));
          cd.querySelector('[data-u="h"]').textContent = pad(Math.floor(s / 3600));
          cd.querySelector('[data-u="m"]').textContent = pad(Math.floor(s % 3600 / 60));
          cd.querySelector('[data-u="s"]').textContent = pad(s % 60);
        }
        tick();
        var iv = setInterval(tick, 1000);
        return { cleanup: function () { clearInterval(iv); } };
      }
    };
  }
  SCENES.abrimos = countScene({
    label: "Jugos 3:30", brand: "tomar", tone: ["teal", "coal"], at: PT.schedule.juiceOpen,
    title: function (today) { return (today ? "Hoy" : "Mañana") + ", jugos<br>desde las"; },
    reel: [["michelada", "jugo1", "laguna", "oreo"], ["batidos", "jugo2", "michelada", "laguna"], ["oreo", "laguna", "jugo1", "batidos"]]
  });
  SCENES.cocina = countScene({
    label: "Asados 6:00", brand: "comer", tone: ["ember", "coal"], at: PT.schedule.kitchenOpen,
    title: function () { return "Hoy, asados<br>desde las"; },
    photo: "chorizo"
  });
  SCENES.cocina.html = (function (orig) {
    return function () {
      return orig().replace('class="photo "', 'class="photo cocina-photo" ');
    };
  })(SCENES.cocina.html);

  SCENES.jugos = {
    label: "Jugos", dur: 16, tone: ["sun", "teal"],
    html: function (c) {
      var M = PT.menu, lim = M.limonadas, pat = M.patillazo;
      return brand("tomar") + when(c, "jugos") + photo("jugo1", "") +
        '<div class="panel" style="left:620px;width:570px"><h2 data-a="rise" style="--d:.1s">' + M.jugos.title + "</h2>" +
        '<div class="price" data-a="rise" style="--d:.2s">' + money(M.jugos.price) + "</div>" + dotList(M.jugos.flavors) + "</div>" +
        '<div class="panel" style="left:1250px;width:570px"><h2 data-a="rise" style="--d:.2s">' + lim.title + "</h2>" +
        '<div class="price" data-a="rise" style="--d:.3s">' + money(lim.price) + "<small>hasta " + money(lim.priceMax) + "</small></div>" + dotList(lim.flavors) + "</div>" +
        '<div class="ribbon" data-a="slide" style="--d:.9s"><h3>' + pat.title + "</h3><p>" + pat.desc + '</p><span class="p">' + money(pat.price) + "</span></div>";
    }
  };
  /* la foto del panel ocupa la columna izquierda; el cocina-photo va a la derecha */
  SCENES.cocteles = {
    label: "Cócteles", dur: 16, tone: ["teal", "coal"],
    html: function (c) {
      var M = PT.menu;
      return brand("tomar") + when(c, "jugos") + photo("michelada", "p1") + photo("laguna", "p2", 0.2) +
        '<div class="grp a"><div class="head"><h2 data-a="rise" style="--d:.1s">' + M.micheladas.title + '</h2><span class="p" data-a="rise" style="--d:.2s">' + money(M.micheladas.price) + "</span></div>" +
        '<div class="chips">' + M.micheladas.flavors.map(function (f, i) { return '<span data-a="pop" style="--d:' + (0.3 + i * 0.1) + 's">' + f + "</span>"; }).join("") + "</div></div>" +
        '<div class="grp b"><div class="head"><h2 data-a="rise" style="--d:.4s">' + M.cocteles.title + '</h2><span class="p" data-a="rise" style="--d:.5s">' + money(M.cocteles.price) + "</span></div>" +
        '<div style="margin-top:14px">' + rows(M.cocteles.items.map(function (x) { return { name: x.name, desc: x.desc }; }), 0.55) + "</div></div>";
    }
  };

  SCENES.asados = {
    label: "Asados", dur: 18, tone: ["ember", "ember"],
    html: function (c) {
      var M = PT.menu.asados;
      return brand("comer") + when(c, "cocina") +
        '<div class="list"><h1 data-a="rise" style="--d:.1s">' + M.title + "</h1>" + rows(M.items, 0.3) + "</div>" +
        videoSticker("asados", "a1", null, 0.3) + photo("canastas", "a2", 0.6);
    },
    mount: function (el) { return playAll(el); }
  };

  SCENES.barril = {
    label: "Barril", dur: 15, tone: ["sun", "coal"],
    html: function (c) {
      var M = PT.menu.barril, w = "BARRIL · BARRIL · BARRIL · BARRIL · BARRIL · BARRIL · ";
      return '<div class="backdrop"><div>' + w + w + "</div><div>" + w + w + "</div></div>" + brand("comer") + when(c, "cocina") +
        '<div class="txt"><h1 data-a="rise" style="--d:.1s">' + M.title + "</h1><ul>" +
        M.items.map(function (n, i) { return '<li data-a="slide" style="--d:' + (0.35 + i * 0.18) + 's">' + n + "</li>"; }).join("") +
        '</ul><p class="note" data-a="rise" style="--d:1s">' + M.note + "</p></div>" +
        videoSticker("barril", "", null, 0.3);
    },
    mount: function (el) { return playAll(el); }
  };

  var videoIx = 0;
  SCENES.video = {
    label: "Video", dur: 14, tone: ["sun", "coal"],
    html: function () {
      var v = PT.videos[videoIx++ % PT.videos.length];
      return brand("tomar") +
        '<div class="txt"><h1 data-a="rise" style="--d:.1s">Pa&#39; tomar<br><em>lo bueno</em></h1>' +
        '<div class="big" data-a="rise" style="--d:.3s">Juguería ' + fmt12(PT.schedule.juiceOpen) + " a " + fmt12(PT.schedule.close) + "</div></div>" +
        '<figure class="photo"><video src="' + v.src + '" muted playsinline loop preload="auto"></video></figure>';
    },
    mount: function (el) {
      var vid = el.querySelector("video");
      vid.muted = true; vid.defaultMuted = true; vid.playsInline = true;
      /* El navegador puede frenar la reproducción automática: se reintenta hasta que arranque */
      var tries = 0, retry = null;
      vid.addEventListener("pause", function () { if (!vid._stop) setTimeout(function () { if (!vid._stop) vid.play().catch(function () {}); }, 300); });
      function start() {
        var p = vid.play();
        if (p && p.catch) p.catch(function () {
          markBlocked(vid, arguments[0]);
          if (tries++ < 20) retry = setTimeout(start, 500);
        });
      }
      ["pointerdown", "keydown"].forEach(function (ev) { addEventListener(ev, start, { once: true }); });
      return new Promise(function (res) {
        var done = false;
        function go() {
          if (done) return; done = true;
          var portrait = vid.videoHeight > vid.videoWidth;
          el.classList.add(portrait || !vid.videoWidth ? "portrait" : "landscape");
          var dur = isFinite(vid.duration) ? Math.min(Math.max(vid.duration, 8), PT.videoMaxSeconds) : 14;
          start();
          res({ dur: dur, cleanup: function () { vid._stop = true; clearTimeout(retry); vid.pause(); vid.removeAttribute("src"); vid.load(); } });
        }
        vid.addEventListener("loadedmetadata", go);
        setTimeout(go, 2500);
      });
    }
  };

  /* ---------- luces de la terraza ---------- */
  (function lights() {
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1920 112");
    var posts = [-20, 480, 960, 1440, 1940], sag = 46, html = "", n = 0;
    for (var s = 0; s < posts.length - 1; s++) {
      var x0 = posts[s], x1 = posts[s + 1], y0 = 8, cx = (x0 + x1) / 2, cy = y0 + sag * 2;
      html += '<path d="M' + x0 + " " + y0 + " Q" + cx + " " + cy + " " + x1 + " " + y0 + '"/>';
      for (var k = 1; k < 7; k++) {
        var t = k / 7, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y0;
        html += '<ellipse class="bulb" cx="' + x.toFixed(1) + '" cy="' + (y + 13).toFixed(1) + '" rx="8" ry="11" style="animation-delay:' + ((n++ * 0.37) % 3.4).toFixed(2) + 's"/>';
      }
    }
    svg.innerHTML = html;
    document.getElementById("lights").appendChild(svg);
  })();

  /* ---------- escala al tamaño real de la pantalla ----------
     Los navegadores de algunas TV informan mal el tamaño al abrir la página, así que se
     toma el menor valor reportado y se recalcula todo el tiempo.
     Ajuste manual: tecla + / - del control, o agregar ?z=0.8 al enlace (se recuerda). */
  var userZ = 1;
  try {
    if (q.get("z")) localStorage.setItem("pt_z", q.get("z"));
    userZ = parseFloat(localStorage.getItem("pt_z")) || 1;
  } catch (e) { if (q.get("z")) userZ = parseFloat(q.get("z")) || 1; }
  function size(vals) {
    var ok = vals.filter(function (v) { return v && v > 0 && isFinite(v); });
    return ok.length ? Math.min.apply(null, ok) : 0;
  }
  function fit() {
    var d = document.documentElement, vv = window.visualViewport || {};
    var w = size([innerWidth, d.clientWidth, vv.width]), h = size([innerHeight, d.clientHeight, vv.height]);
    if (!w || !h) return;
    var k = Math.min(w / 1920, h / 1080) * userZ;
    stage.style.transform = "translate(-50%,-50%) scale(" + k + ")";
  }
  ["resize", "orientationchange", "load", "fullscreenchange"].forEach(function (ev) { addEventListener(ev, fit); });
  if (window.visualViewport) visualViewport.addEventListener("resize", fit);
  setInterval(fit, 1000);
  fit();
  function zoomBy(dz) {
    userZ = Math.max(.3, Math.min(2, Math.round((userZ + dz) * 100) / 100));
    try { localStorage.setItem("pt_z", userZ); } catch (e) {}
    fit();
  }

  /* ---------- barra inferior ---------- */
  function renderBar(list, pos, dur) {
    bar.innerHTML = list.map(function (id, i) {
      var on = i === pos;
      return '<button class="pill' + (on ? " on" : "") + '" data-i="' + i + '">' + SCENES[id].label +
        (on ? '<i><b style="--dur:' + dur + 's"></b></i>' : "") + "</button>";
    }).join("") +
      '<div class="contact"><div><small>Juguería ' + fmt12(PT.schedule.juiceOpen) + " · Asados " + fmt12(PT.schedule.kitchenOpen) + " – " + fmt12(PT.schedule.close) + "</small>" +
      '<span style="display:flex;align-items:center;gap:12px"><svg><use href="#phone"/></svg>' + PT.phone + "</span></div></div>";
  }
  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".pill"); if (b) jump(+b.dataset.i);
  });

  /* ---------- cortina ---------- */
  var TONE_BG = { sun: "#FFC21A", teal: "#066F70", ember: "#C21F28", coal: "#17110D" };
  function sweep(tone) {
    var cols = ["#C21F28", "#FFC21A", "#066F70", TONE_BG[tone]];
    curtain.innerHTML = cols.map(function (c) { return '<b style="background:' + c + '"></b>'; }).join("");
    var bars = [].slice.call(curtain.children), D = 1400, step = 100;
    var anims = bars.map(function (b, i) {
      return b.animate([
        { transform: "translateX(-120%) skewX(-14deg)" },
        { transform: "translateX(0) skewX(-14deg)", offset: .46 },
        { transform: "translateX(0) skewX(-14deg)", offset: .54 },
        { transform: "translateX(120%) skewX(-14deg)" }
      ], { duration: D, delay: i * step, easing: "cubic-bezier(.65,0,.35,1)", fill: "both" });
    });
    return {
      mid: new Promise(function (r) { setTimeout(r, D * .5 + (bars.length - 1) * step); }),
      done: Promise.all(anims.map(function (a) { return a.finished; })).then(function () { curtain.innerHTML = ""; })
    };
  }

  /* ---------- motor ---------- */
  var mode = null, list = [], pos = -1, token = 0, timer = null, busy = false, paused = false, cleanup = null;

  function step(d) {
    if (busy) return;
    var c = context();
    if (c.mode !== mode) { mode = c.mode; list = PT.playlists[mode]; pos = d > 0 ? 0 : list.length - 1; }
    else pos = (pos + d + list.length) % list.length;
    show(c);
  }
  function jump(i) {
    if (busy) return;
    var c = context(); mode = c.mode; list = PT.playlists[mode]; pos = i; show(c);
  }

  function show(c) {
    var my = ++token, id = list[pos], def = SCENES[id], tone = def.tone[c.theme === "day" ? 0 : 1];
    clearTimeout(timer); busy = true;
    var first = !stage.dataset.tone, sw = first ? null : sweep(tone);
    return (first ? Promise.resolve() : sw.mid).then(function () {
      if (my !== token) return;
      if (cleanup) { cleanup(); cleanup = null; }
      stage.dataset.tone = tone;
      view.innerHTML = "";
      var el = document.createElement("section");
      el.className = "scene s-" + id + (id === "cocina" ? " s-count" : id === "abrimos" ? " s-count" : "");
      el.innerHTML = def.html(c);
      view.appendChild(el);
      return Promise.resolve(def.mount ? def.mount(el, c) : null).then(function (m) {
        if (my !== token) { if (m && m.cleanup) m.cleanup(); return; }
        var dur = (m && m.dur) || def.dur;
        cleanup = m && m.cleanup;
        renderBar(list, pos, dur);
        busy = false;
        if (!paused) timer = setTimeout(function () { step(1); }, dur * 1000);
        else timer = null;
      });
    }).then(function () { if (sw) sw.done.then(function () { busy = false; }); });
  }

  /* ---------- control: teclado / toque (opcional, la pantalla va sola) ---------- */
  addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") step(1);
    else if (e.key === "ArrowLeft" || e.key === "PageUp") step(-1);
    else if (e.key === " ") {
      paused = !paused; stage.classList.toggle("paused", paused);
      if (paused) { clearTimeout(timer); timer = null; } else step(1);
    } else if (/^[1-9]$/.test(e.key) && list[+e.key - 1]) jump(+e.key - 1);
    else if (e.key === "+" || e.key === "=") zoomBy(.05);
    else if (e.key === "-" || e.key === "_") zoomBy(-.05);
    else if (e.key === "0") { userZ = 1; try { localStorage.removeItem("pt_z"); } catch (er) {} fit(); }
    else if (e.key === "f") { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  });

  /* Actualización automática: cada 5 minutos pregunta al servidor si hay versión nueva
     (el número ?v= de index.html) y, si cambió, se recarga sola. Así los cambios llegan
     a la TV sin tocarla. */
  var curVer = ((document.currentScript && document.currentScript.src || "").match(/[?&]v=(\d+)/) || [])[1];
  function checkUpdate() {
    if (!curVer || !window.fetch || location.protocol === "file:") return;
    fetch(location.pathname + "?_=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var m = t.match(/app\.js\?v=(\d+)/);
        if (m && m[1] !== curVer) location.reload();
      })
      .catch(function () {});
  }
  setInterval(checkUpdate, 5 * 60 * 1000);

  /* Recarga diaria antes de abrir, para que la pantalla nunca se degrade */
  setInterval(function () {
    var n = now(); if (n.getHours() === 5 && n.getMinutes() === 30 && n.getSeconds() < 30 && !q.get("t")) location.reload();
  }, 30000);
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(function () {}); } catch (e) {}

  step(1);
  if (q.get("scene")) { var ix = list.indexOf(q.get("scene")); if (ix >= 0) { busy = false; pos = ix; show(context()); } }
})();
