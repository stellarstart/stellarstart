/* ==========================================================================
   StellarStart GLOBAL — shared behaviour
   1. mobile nav
   2. dotted presence map (generated, no image assets)
   3. list filtering (services + insights)
   ========================================================================== */

/* ------------------------------------------------------------- 1. nav --- */
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-nav-toggle]');
  if (!t) return;
  var links = document.querySelector('.nav__links');
  if (links) links.classList.toggle('open');
});

/* -------------------------------------------------------- 2. world map --- */
(function () {
  var host = document.querySelector('[data-map]');
  if (!host) return;

  // Equirectangular projection. 360deg of longitude = 1000 units.
  var W = 1000, PPD = W / 360, TOP = 84, BOT = -58;
  var H = (TOP - BOT) * PPD;
  var x = function (lon) { return (lon + 180) * PPD; };
  var y = function (lat) { return (TOP - lat) * PPD; };

  // Coarse land outlines (lon, lat). Deliberately simplified — the dot
  // matrix reads as a stylised map, not a cartographic one.
  var LAND = [
    [[-168,65],[-156,71],[-130,70],[-110,69],[-95,68],[-80,70],[-63,58],[-64,45],[-70,42],[-76,36],[-81,26],[-88,30],[-97,26],[-100,29],[-107,31],[-117,32],[-124,40],[-128,50],[-136,58],[-150,59],[-163,58]],
    [[-97,26],[-92,18],[-88,21],[-86,20],[-88,16],[-96,16],[-105,20],[-110,24],[-114,28],[-113,31],[-107,31],[-100,29]],
    [[-92,18],[-83,15],[-77,8],[-82,7],[-88,14]],
    [[-81,8],[-75,11],[-66,11],[-60,8],[-52,5],[-45,-2],[-38,-5],[-35,-8],[-39,-14],[-48,-25],[-53,-33],[-58,-38],[-62,-40],[-65,-45],[-68,-52],[-72,-54],[-73,-45],[-75,-35],[-71,-25],[-70,-18],[-76,-14],[-81,-6]],
    [[-55,60],[-45,60],[-20,70],[-20,78],[-35,83],[-60,80],[-70,76],[-58,65]],
    [[-24,64],[-14,64],[-14,66.5],[-24,66.5]],
    [[-10,36],[-9,44],[-2,48],[3,51],[8,54],[12,55],[18,56],[24,58],[30,58],[30,45],[26,40],[22,37],[15,37],[12,45],[7,43],[0,40],[-6,36]],
    [[5,58],[10,64],[20,70],[30,70],[31,62],[22,60],[12,59]],
    [[-6,50],[-2,50],[1,52],[-1,56],[-5,58],[-6,55]],
    [[-10,51.5],[-6,51.5],[-6,55],[-10,55]],
    [[-17,15],[-17,21],[-10,28],[0,32],[10,34],[20,32],[32,31],[35,25],[38,18],[43,12],[51,12],[43,4],[41,-2],[40,-10],[35,-20],[32,-26],[27,-34],[18,-34],[12,-17],[9,-1],[8,4],[0,5],[-8,5],[-13,9]],
    [[35,25],[38,18],[43,12],[52,16],[56,26],[48,30],[44,37],[38,37],[35,31]],
    [[26,40],[45,40],[48,46],[30,46]],
    [[30,58],[60,70],[75,73],[100,76],[130,72],[160,68],[178,66],[170,60],[155,58],[140,52],[130,44],[120,40],[100,42],[85,45],[60,45],[48,46],[31,54]],
    [[100,42],[120,40],[122,30],[118,24],[110,20],[100,22],[97,28],[92,32]],
    [[68,24],[72,20],[73,15],[77,8],[81,10],[87,21],[92,22],[89,26],[80,30],[74,32]],
    [[80,6],[82,6],[82,9.5],[80,9.5]],
    [[97,28],[105,22],[109,11],[104,10],[99,7],[98,16],[94,20]],
    [[96,5],[104,1],[110,-3],[118,-4],[128,-3],[135,-2],[141,-3],[141,-9],[131,-8],[120,-9],[110,-8],[102,-6]],
    [[120,6],[126,7],[126,18],[120,18]],
    [[130,32],[136,34],[141,40],[145,44],[141,37],[136,33]],
    [[113,-22],[114,-32],[118,-35],[129,-32],[135,-35],[141,-38],[147,-38],[153,-28],[145,-16],[137,-12],[130,-12],[122,-17]],
    [[145,-43],[148,-43],[148,-40.5],[145,-40.5]],
    [[166,-46],[172,-44],[178,-37],[174,-34],[170,-42]],
    [[43,-25],[50,-16],[49,-12],[44,-19]]
  ];

  function inside(lon, lat, poly) {
    var hit = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) hit = !hit;
    }
    return hit;
  }
  function land(lon, lat) {
    for (var i = 0; i < LAND.length; i++) if (inside(lon, lat, LAND[i])) return true;
    return false;
  }

  // ---- network -------------------------------------------------------------
  // Six desks carry a label and a ping; the rest are connected cities that
  // light up on hover. Trunk corridors carry a travelling pulse, regional
  // spokes are drawn as quiet hairlines so the map reads as a network
  // rather than a starburst.
  var CITY = [
    { n:'New York',     lon:-74.0,  lat:40.7,  s:'US matters and filings',        hub:1 },
    { n:'London',       lon:-0.13,  lat:51.5,  s:'UK HQ, StellarStart Global Ltd', hub:1 },
    { n:'New Delhi',    lon:77.2,   lat:28.6,  s:'South Asia desk',               hub:1 },
    { n:'Dubai',        lon:55.3,   lat:25.2,  s:'GCC entity and tax structuring', hub:1 },
    { n:'Nairobi',      lon:36.8,   lat:-1.29, s:'East Africa desk',              hub:1 },
    { n:'Singapore',    lon:103.8,  lat:1.35,  s:'APAC and Web3 regulatory',      hub:1 },

    { n:'Toronto',      lon:-79.4,  lat:43.7,  s:'Canada, CIPO filings' },
    { n:'San Francisco',lon:-122.4, lat:37.8,  s:'US west coast technology' },
    { n:'Mexico City',  lon:-99.1,  lat:19.4,  s:'LatAm entry' },
    { n:'Sao Paulo',    lon:-46.6,  lat:-23.6, s:'Brazil and Mercosur' },
    { n:'Dublin',       lon:-6.26,  lat:53.3,  s:'EU seat for UK groups' },
    { n:'Amsterdam',    lon:4.9,    lat:52.4,  s:'Benelux and EU structuring' },
    { n:'Frankfurt',    lon:8.68,   lat:50.1,  s:'EUIPO and DACH' },
    { n:'Zurich',       lon:8.54,   lat:47.4,  s:'Holding structures' },
    { n:'Stockholm',    lon:18.1,   lat:59.3,  s:'Nordics' },
    { n:'Madrid',       lon:-3.7,   lat:40.4,  s:'Iberia' },
    { n:'Lagos',        lon:3.4,    lat:6.5,   s:'West Africa' },
    { n:'Johannesburg', lon:28.0,   lat:-26.2, s:'Southern Africa' },
    { n:'Riyadh',       lon:46.7,   lat:24.6,  s:'Saudi market entry' },
    { n:'Hong Kong',    lon:114.2,  lat:22.3,  s:'Greater China' },
    { n:'Tokyo',        lon:139.7,  lat:35.7,  s:'Japan' },
    { n:'Sydney',       lon:151.2,  lat:-33.9, s:'Australia and NZ' }
  ];

  // corridors that carry a pulse
  var TRUNK = [[1,0],[1,2],[1,3],[1,4],[0,5],[3,4],[2,5],[5,21]];
  // quiet regional spokes
  var SPOKE = [[1,10],[1,11],[1,12],[1,13],[1,14],[1,15],[0,6],[0,7],[0,8],[0,9],
               [4,16],[4,17],[3,18],[5,19],[5,20],[2,3],[12,13],[11,12]];

  function arc(i, j, bow) {
    var x1 = x(CITY[i].lon), y1 = y(CITY[i].lat), x2 = x(CITY[j].lon), y2 = y(CITY[j].lat);
    var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * bow;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
           ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }

  // ---- canvas --------------------------------------------------------------
  var svg = ['<svg viewBox="0 0 ' + W + ' ' + H.toFixed(0) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="StellarStart GLOBAL presence across 24 countries">'];

  svg.push(
    '<defs><radialGradient id="ssGlow">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/>' +
      '<stop offset="40%" stop-color="#cfc8fb" stop-opacity=".28"/>' +
      '<stop offset="100%" stop-color="#cfc8fb" stop-opacity="0"/>' +
    '</radialGradient></defs>'
  );

  // graticule
  for (var g = -40; g <= 80; g += 20) svg.push('<line x1="0" y1="' + y(g).toFixed(1) + '" x2="' + W + '" y2="' + y(g).toFixed(1) + '" stroke="rgba(255,255,255,.03)" stroke-width="1"/>');
  for (var gl = -160; gl <= 160; gl += 20) svg.push('<line x1="' + x(gl).toFixed(1) + '" y1="0" x2="' + x(gl).toFixed(1) + '" y2="' + H.toFixed(0) + '" stroke="rgba(255,255,255,.03)" stroke-width="1"/>');

  // land dots
  var STEP = 2.45;
  for (var lat = TOP; lat >= BOT; lat -= STEP) {
    for (var lon = -180; lon <= 180; lon += STEP) {
      if (!land(lon, lat)) continue;
      svg.push('<circle class="map__dot" cx="' + x(lon).toFixed(1) + '" cy="' + y(lat).toFixed(1) + '" r="1.35"/>');
    }
  }

  SPOKE.forEach(function (r) {
    svg.push('<path class="map__arc map__arc--minor" d="' + arc(r[0], r[1], 0.22) + '"/>');
  });
  TRUNK.forEach(function (r, i) {
    svg.push('<path id="ssRoute' + i + '" class="map__arc" d="' + arc(r[0], r[1], 0.19) + '"/>');
  });

  // Comets are drawn once here and positioned every frame below.
  var TAIL = 4;
  TRUNK.forEach(function (r, i) {
    [0, 1].forEach(function (dir) {
      var g = ['<g class="map__comet" data-route="' + i + '" data-dir="' + dir + '" opacity="0">'];
      for (var t = TAIL; t >= 1; t--) {
        g.push('<circle class="map__tail" r="' + (0.5 + t * 0.17).toFixed(2) + '" opacity="' + (0.07 * (TAIL - t + 1)).toFixed(2) + '"/>');
      }
      g.push('<circle class="map__halo" r="4.6"/>');
      g.push('<circle class="map__core" r="1.6"/>');
      g.push('</g>');
      svg.push(g.join(''));
    });
  });

  CITY.forEach(function (c, i) {
    var cx = x(c.lon), cy = y(c.lat);
    if (c.hub) {
      svg.push('<circle class="map__ping" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3" style="animation-delay:' + (i * 0.62).toFixed(2) + 's"/>');
      svg.push('<circle class="map__pin-ring" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="6.5" stroke-width="1"/>');
      svg.push('<circle class="map__pin" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.9"/>');
      svg.push('<text class="map__label" x="' + (cx + 10).toFixed(1) + '" y="' + (cy + 3).toFixed(1) + '">' + c.n.toUpperCase() + '</text>');
    } else {
      svg.push('<circle class="map__pin map__pin--minor" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="1.8"/>');
    }
    svg.push('<circle data-hub="' + i + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="13" fill="transparent" style="cursor:pointer"/>');
  });

  svg.push('</svg>');
  host.innerHTML = svg.join('');

  /* ---- comet driver -------------------------------------------------------
     Hand-driven rather than SMIL so the pulse can ease out of one city, hold,
     and fade into the next, instead of sliding at a constant rate forever. */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var svgEl = host.querySelector('svg');
    var comets = [].slice.call(host.querySelectorAll('.map__comet'));
    if (reduce || !comets.length) return;

    var runs = [];
    comets.forEach(function (g, i) {
      var path = svgEl.querySelector('#ssRoute' + g.getAttribute('data-route'));
      if (!path || !path.getPointAtLength) return;
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { return; }
      if (!len) return;
      runs.push({
        g: g,
        path: path,
        len: len,
        back: g.getAttribute('data-dir') === '1',
        tail: [].slice.call(g.querySelectorAll('.map__tail')),
        travel: len / 66,                       // ~66 map units per second
        rest: 1.1 + (i % 3) * 0.4,              // pause at the far end
        t: -(i * 1.15) % 7                      // stagger the launches
      });
    });
    if (!runs.length) return;

    // eased 0..1, so the pulse leaves and arrives softly
    function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
    function fade(p) { return Math.min(1, Math.min(p, 1 - p) / 0.12); }

    var last = 0, running = true;
    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      runs.forEach(function (r) {
        r.t += dt;
        var cycle = r.travel + r.rest;
        var p = r.t / r.travel;
        if (r.t < 0) { r.g.setAttribute('opacity', '0'); return; }
        if (r.t > cycle) { r.t -= cycle; p = 0; }
        if (p > 1) { r.g.setAttribute('opacity', '0'); return; }

        r.g.setAttribute('opacity', fade(p).toFixed(3));
        var e = ease(p);
        var at = function (k) {
          var d = Math.max(0, Math.min(1, k));
          return r.path.getPointAtLength((r.back ? 1 - d : d) * r.len);
        };
        var head = at(e);
        r.g.querySelector('.map__halo').setAttribute('cx', head.x);
        r.g.querySelector('.map__halo').setAttribute('cy', head.y);
        r.g.querySelector('.map__core').setAttribute('cx', head.x);
        r.g.querySelector('.map__core').setAttribute('cy', head.y);
        r.tail.forEach(function (c, k) {
          var q = at(e - (k + 1) * 0.022);
          c.setAttribute('cx', q.x);
          c.setAttribute('cy', q.y);
        });
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // stop when off screen or in a background tab
    function setRunning(on) {
      if (on === running) return;
      running = on; last = 0;
      if (on) requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', function () { setRunning(!document.hidden); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { setRunning(es[0].isIntersecting && !document.hidden); },
        { threshold: 0 }).observe(host);
    }
  })();

  // hover tooltip
  var tip = document.createElement('div');
  tip.className = 'map__tip';
  host.appendChild(tip);
  host.querySelectorAll('[data-hub]').forEach(function (node) {
    node.addEventListener('mouseenter', function () {
      var h = CITY[+node.getAttribute('data-hub')];
      var box = host.getBoundingClientRect();
      var pt = node.getBoundingClientRect();
      tip.innerHTML = '<b>' + h.n + '</b><span>' + h.s + '</span>';
      tip.style.left = (pt.left - box.left + pt.width / 2) + 'px';
      tip.style.top = (pt.top - box.top + pt.height / 2) + 'px';
      tip.classList.add('on');
    });
    node.addEventListener('mouseleave', function () { tip.classList.remove('on'); });
  });
})();

/* ------------------------------------------------- 3. dossier tabs ------- */
(function () {
  var box = document.querySelector('[data-dossier]');
  if (!box) return;
  var tabs = box.querySelectorAll('[role="tab"]');
  var panels = box.querySelectorAll('[role="tabpanel"]');

  function open(i) {
    tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i ? 'true' : 'false'); t.tabIndex = n === i ? 0 : -1; });
    panels.forEach(function (p, n) { p.hidden = n !== i; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { open(i); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1
            : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      e.preventDefault();
      n = (n + tabs.length) % tabs.length;
      open(n); tabs[n].focus();
    });
  });
  open(0);
})();

/* ---------------------------------------------------------- 4. filters --- */
(function () {
  var root = document.querySelector('[data-filter-root]');
  if (!root) return;
  var chips = root.querySelectorAll('[data-cat]');
  var input = root.querySelector('[data-q]');
  var items = root.querySelectorAll('[data-item]');
  var empty = root.querySelector('[data-empty]');
  var count = root.querySelector('[data-count]');
  var cat = 'all';

  function apply() {
    var q = (input && input.value || '').trim().toLowerCase();
    var shown = 0;
    items.forEach(function (el) {
      var cats = (el.getAttribute('data-cats') || '').toLowerCase();
      var text = el.textContent.toLowerCase();
      var ok = (cat === 'all' || cats.indexOf(cat) > -1) && (!q || text.indexOf(q) > -1);
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.style.display = shown ? 'none' : '';
    if (count) count.textContent = shown;
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      cat = c.getAttribute('data-cat').toLowerCase();
      apply();
    });
  });
  if (input) input.addEventListener('input', apply);
  apply();
})();

/* ------------------------------------------------ 4. reveal + counters --- */
(function () {
  var root = document.querySelector('[data-reveal-root]');
  if (!root) return;
  var items = [].slice.call(root.querySelectorAll('[data-reveal]'));
  if (!items.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function count(el) {
    var to = +el.getAttribute('data-to');
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to.toLocaleString() + suffix; return; }
    var dur = 1100, t0 = 0;
    function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function show(el, i) {
    el.style.transitionDelay = (i % 6) * 0.07 + 's';
    el.classList.add('in');
    var n = el.querySelector('[data-to]');
    if (n && !n.dataset.done) { n.dataset.done = '1'; count(n); }
  }

  if (!window.IntersectionObserver) { items.forEach(show); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      show(e.target, items.indexOf(e.target));
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  items.forEach(function (el) { io.observe(el); });
})();

/* ------------------------------------------------ 5. services directory --- */
(function () {
  var root = document.querySelector('[data-svc-root]');
  if (!root) return;

  var q = root.querySelector('[data-q]');
  var fInd = root.querySelector('[data-f-ind]');
  var fJur = root.querySelector('[data-f-jur]');
  var fFee = root.querySelector('[data-f-fee]');
  var reset = root.querySelector('[data-reset]');
  var total = root.querySelector('[data-total]');
  var empty = root.querySelector('[data-empty]');
  var areas = [].slice.call(root.querySelectorAll('[data-area]'));
  var svcs = [].slice.call(root.querySelectorAll('[data-svc]'));

  function has(attr, el, val) {
    if (!val) return true;
    return (el.getAttribute(attr) || '').split('|').indexOf(val) > -1;
  }

  function apply() {
    var term = (q.value || '').trim().toLowerCase();
    var ind = fInd.value, jur = fJur.value, fee = fFee.value;
    var filtering = !!(term || ind || jur || fee);
    var shown = 0;

    areas.forEach(function (area) {
      var n = 0;
      area.querySelectorAll('[data-svc]').forEach(function (el) {
        var ok = has('data-ind', el, ind) && has('data-jur', el, jur) &&
                 (!fee || el.getAttribute('data-fee') === fee) &&
                 (!term || (el.getAttribute('data-txt') || '').indexOf(term) > -1);
        el.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      shown += n;
      area.style.display = n ? '' : 'none';
      var c = area.querySelector('[data-area-count]');
      if (c) c.textContent = n;
      // while filtering, open every area that still has results
      if (filtering) open(area, n > 0);
    });

    total.textContent = shown;
    empty.style.display = shown ? 'none' : '';
  }

  function open(area, on) {
    var hd = area.querySelector('.area__hd');
    var bd = area.querySelector('.area__bd');
    hd.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) bd.removeAttribute('hidden'); else bd.setAttribute('hidden', '');
  }

  areas.forEach(function (area) {
    area.querySelector('.area__hd').addEventListener('click', function () {
      open(area, area.querySelector('.area__hd').getAttribute('aria-expanded') !== 'true');
    });
  });

  [q, fInd, fJur, fFee].forEach(function (el) {
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });
  reset.addEventListener('click', function () {
    q.value = ''; fInd.value = ''; fJur.value = ''; fFee.value = '';
    apply();
    areas.forEach(function (a, i) { open(a, i === 0); });
  });

  document.querySelectorAll('[data-sector]').forEach(function (b) {
    b.addEventListener('click', function () {
      fInd.value = b.getAttribute('data-sector');
      apply();
      if (root.scrollIntoView) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  apply();
})();

/* ---------------------------------------------- 6. services view tabs --- */
(function () {
  var root = document.querySelector('[data-svc-root]');
  if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll('[data-view]'));
  var panes = [].slice.call(root.querySelectorAll('[data-pane]'));
  if (!tabs.length) return;

  function show(name) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-view') === name ? 'true' : 'false'); });
    panes.forEach(function (p) {
      if (p.getAttribute('data-pane') === name) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { show(t.getAttribute('data-view')); });
  });

  // choosing a sector jumps back to the service list with that filter applied
  root.querySelectorAll('[data-sector]').forEach(function (b) {
    b.addEventListener('click', function () { show('all'); });
  });
})();
