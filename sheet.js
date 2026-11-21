/* sheet.js — folha 16:9 (1920x1080): somente LETRA e DIAGRAMAS DE ACORDES, cada diagrama
 * alinhado à sílaba onde o acorde começa. Sem pauta e sem tablatura.
 */
(function (root) {
  'use strict';
  var W = 1920, H = 1080;
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#3a2713', INK2 = '#6b4a2b', ACCENT = '#a3361a';
  var SERIF = 'Georgia, "Times New Roman", "DejaVu Serif", serif';
  var SANS = '"Trebuchet MS", "DejaVu Sans", Verdana, sans-serif';
  var DS = 1.15;            // escala dos diagramas
  var ROWS = 3;             // linhas por página
  var ROW_TOP0 = 168, ROW_PITCH = 276, LYR_DY = 254;
  var LEFT_X = 206;         // centro da primeira coluna
  var RIGHT = W - 70;

  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  var measCanvas = null;
  function textW(str, font) {
    if (!measCanvas) measCanvas = document.createElement('canvas').getContext('2d');
    measCanvas.font = font;
    return measCanvas.measureText(str).width;
  }

  function Sheet(opts) {
    this.h = opts.hymn; this.arr = opts.arr; this.opts = opts;
    this.theme = opts.theme || {};
    this.pages = [];
  }

  /* ---------- letras ---------- */
  Sheet.prototype.measureOf = function (t) {
    var m = this.arr.minfo, lo = 0, hi = m.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (m[mid].t0 <= t + 0.5) lo = mid; else hi = mid - 1; }
    return lo;
  };
  Sheet.prototype.verseText = function (n, verse) {
    var ly = n.ly; if (!ly) return null;
    var s = ly[verse - 1];
    if (s) return s;
    if (!this.hasLy[n.mi] || !this.hasLy[n.mi][verse]) return ly[0] || null;
    return null;
  };
  Sheet.prototype.prepare = function () {
    var self = this, arr = this.arr;
    this.hasLy = arr.minfo.map(function () { return {}; });
    this.notes = arr.mel.map(function (n) {
      var o = { t: Math.round(n.t), ly: n.ly, mi: self.measureOf(n.t) };
      if (n.ly) n.ly.forEach(function (s, i) { if (s) self.hasLy[o.mi][i + 1] = true; });
      return o;
    });
    this.notesByMeasure = arr.minfo.map(function () { return []; });
    this.notes.forEach(function (n) { self.notesByMeasure[n.mi].push(n); });
  };

  /* ---------- colunas de um compasso ---------- */
  Sheet.prototype.measureItems = function (mi, verses) {
    var self = this, arr = this.arr, m = arr.minfo[mi], t0 = m.t0, t1 = m.t0 + m.len;
    var cols = {};
    function col(t) { var k = Math.round(t); return cols[k] || (cols[k] = { t: k, mi: mi, sylW: 0, hy: false, hasSyl: false, chord: null }); }
    col(t0);
    this.notesByMeasure[mi].forEach(function (n) {
      var best = 0, hy = false, any = false;
      verses.forEach(function (v) {
        var s = self.verseText(n, v);
        if (s) { any = true; var w = textW(s.replace(/-$/, ''), '40px ' + SERIF); if (w > best) best = w; if (/-$/.test(s)) hy = true; }
      });
      var c = col(n.t);
      if (any) { c.hasSyl = true; c.sylW = Math.max(c.sylW, best); c.hy = c.hy || hy; }
    });
    arr.chords.forEach(function (ch) {
      if (ch.t >= t0 - 0.5 && ch.t < t1 - 0.5) {
        var c = col(ch.t);
        c.chord = { w: Math.max(118, textW(ch.name, 'bold 36px ' + SANS) + 22), ci: ch.idx };
      }
    });
    return Object.keys(cols).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return cols[k]; });
  };

  Sheet.prototype.chordActiveAt = function (t) {
    var ch = this.arr.chords, r = null;
    for (var i = 0; i < ch.length; i++) { if (ch[i].t <= t + 0.5) r = ch[i]; else break; }
    return r;
  };

  Sheet.prototype.layoutRow = function (a, b, verses) {
    var self = this, arr = this.arr, cols = [], mstarts = [], mi, i, j;
    for (mi = a; mi <= b; mi++) {
      mstarts.push(cols.length);
      this.measureItems(mi, verses).forEach(function (c) { cols.push(c); });
    }
    // acorde que continua desde a linha anterior: aparece na 1ª coluna
    var t00 = arr.minfo[a].t0;
    var cont = this.chordActiveAt(t00);
    if (cont && cont.t < t00 - 0.5 && cont.t + cont.d > t00 + 0.5) {
      if (!cols.length || cols[0].t > t00 + 0.5) cols.unshift({ t: Math.round(t00), mi: a, sylW: 0, hy: false, hasSyl: false, chord: null });
      if (!cols[0].chord) { cols[0].chord = { w: Math.max(118, textW(cont.name, 'bold 36px ' + SANS) + 22), ci: cont.idx, cont: true }; }
      for (i = 1; i < mstarts.length; i++) mstarts[i]++;
    }
    var n = cols.length;
    var gaps = [];
    for (i = 0; i < n - 1; i++) {
      var dt = cols[i + 1].t - cols[i].t;
      var g = Math.max(34, Math.min(150, 26 + 0.55 * dt));
      if (cols[i + 1].mi !== cols[i].mi) g = Math.max(g, 70);
      gaps.push(g);
    }
    var cons = [];
    var sy = cols.map(function (c, k) { return c.hasSyl ? k : -1; }).filter(function (k) { return k >= 0; });
    for (i = 0; i + 1 < sy.length; i++) {
      var p = cols[sy[i]], q = cols[sy[i + 1]];
      cons.push({ i: sy[i], j: sy[i + 1], w: p.sylW / 2 + q.sylW / 2 + (p.hy ? 36 : 20) });
    }
    var cc = cols.map(function (c, k) { return c.chord ? k : -1; }).filter(function (k) { return k >= 0; });
    for (i = 0; i + 1 < cc.length; i++) {
      cons.push({ i: cc[i], j: cc[i + 1], w: (cols[cc[i]].chord.w + cols[cc[i + 1]].chord.w) / 2 + 6 });
    }
    var x = new Array(n).fill(0);
    for (j = 1; j < n; j++) {
      x[j] = x[j - 1] + gaps[j - 1];
      for (var q2 = 0; q2 < cons.length; q2++) if (cons[q2].j === j) x[j] = Math.max(x[j], x[cons[q2].i] + cons[q2].w);
    }
    var tail = 0;
    if (n) { var lc = cols[n - 1]; tail = Math.max(lc.hasSyl ? lc.sylW / 2 : 0, lc.chord ? lc.chord.w / 2 : 0) + 26; }
    return { cols: cols, x: x, minW: n ? x[n - 1] + tail : 0, mstarts: mstarts, a: a, b: b };
  };

  Sheet.prototype.paginate = function (verses) {
    var nm = this.arr.minfo.length, rows = [], a = 0;
    var avail = RIGHT - LEFT_X;
    while (a < nm) {
      var b = a, best = this.layoutRow(a, a, verses);
      while (b + 1 < nm) {
        var nxt = this.layoutRow(a, b + 1, verses);
        if (nxt.minW <= avail) { best = nxt; b++; } else break;
      }
      rows.push(best);
      a = best.b + 1;
    }
    var pages = [];
    for (var i = 0; i < rows.length; i += ROWS) pages.push(rows.slice(i, i + ROWS));
    return pages;
  };

  /* ---------- construção ---------- */
  Sheet.prototype.build = function (verse, verses) {
    this.prepare();
    var pgs = this.paginate(verses || [verse]);
    this.verse = verse;
    this.pages = pgs.map(this.drawPage.bind(this, verse));
    this.measurePage = {}; this.measureRow = {};
    var self = this;
    this.pages.forEach(function (p, pi) {
      p.rows.forEach(function (r, ri) { for (var mi = r.a; mi <= r.b; mi++) { self.measurePage[mi] = pi; self.measureRow[mi] = ri; } });
    });
    return this.pages;
  };

  Sheet.prototype.drawPage = function (verse, rowLays, pageIndex) {
    var self = this, arr = this.arr, h = this.h, T = this.theme, opts = this.opts;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';
    var defs = el('defs', null, svg);
    var g1 = el('radialGradient', { id: 'paper' + pageIndex, cx: '50%', cy: '45%', r: '75%' }, defs);
    el('stop', { offset: '0%', 'stop-color': T.paper0 || '#f3e4c3' }, g1);
    el('stop', { offset: '70%', 'stop-color': T.paper1 || '#e8d2a6' }, g1);
    el('stop', { offset: '100%', 'stop-color': T.paper2 || '#d4b684' }, g1);
    var bg = el('g', { 'class': 'bg' }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#paper' + pageIndex + ')' }, bg);
    el('rect', { x: 18, y: 18, width: W - 36, height: H - 36, fill: 'none', stroke: T.border || '#9c7a45', 'stroke-width': 3, rx: 10, opacity: 0.55 }, bg);
    el('rect', { x: 28, y: 28, width: W - 56, height: H - 56, fill: 'none', stroke: T.border || '#9c7a45', 'stroke-width': 1, rx: 6, opacity: 0.45 }, bg);

    // cabeçalho
    var hd = el('g', { 'class': 'head' }, svg);
    var num = ('00' + h.n).slice(-3);
    el('text', { x: 72, y: 84, 'font-family': SERIF, 'font-size': 52, 'font-weight': 'bold', fill: INK }, hd, num + ' — ' + h.t);
    var info = [];
    if (h.c) info.push(h.c);
    info.push('Tom: ' + arr.keyName + (arr.T ? ' (' + (arr.T > 0 ? '+' : '') + arr.T + ' st)' : '') + (arr.capo ? ' · Capotraste ' + arr.capo + 'ª casa' : ''));
    var ts0 = arr.minfo[0].ts;
    info.push(ts0[0] + '/' + ts0[1] + ' · ♩ = ' + arr.minfo[0].tempo);
    el('text', { x: 74, y: 124, 'font-family': SERIF, 'font-size': 27, 'font-style': 'italic', fill: INK2 }, hd, info.join('   •   '));
    el('text', { x: W - 72, y: 84, 'text-anchor': 'end', 'font-family': SERIF, 'font-size': 36, 'font-weight': 'bold', fill: ACCENT }, hd,
      (arr.style === 'batida' ? 'Batida' : 'Dedilhado') + ' · ' + ({ facil: 'Fácil', dificil: 'Difícil', misto: 'Misto' })[arr.level]);
    el('text', { x: W - 72, y: 124, 'text-anchor': 'end', 'font-family': SERIF, 'font-size': 24, fill: INK2 }, hd,
      (opts.voiceLabel || '') + ' · melodia: ' + (opts.instLabel || ''));

    var rows = [];
    var rowsG = el('g', { 'class': 'rows' }, svg);
    rowLays.forEach(function (lay, ri) { rows.push(self.drawRow(rowsG, lay, ri, verse)); });

    // rodapé
    var ft = el('g', { 'class': 'foot' }, svg);
    el('text', { x: 72, y: 1052, 'font-family': SANS, 'font-size': 20, fill: INK2 }, ft, 'DigitaHinos · Hinário nº 5 · violão de acompanhamento (acordes) com a melodia do soprano ao fundo');
    el('text', { x: W - 72, y: 1052, 'text-anchor': 'end', 'font-family': SANS, 'font-size': 20, fill: INK2 }, ft, 'Página ' + (pageIndex + 1));

    return { a: rows[0].a, b: rows[rows.length - 1].b, svg: svg, rows: rows };
  };

  Sheet.prototype.drawRow = function (parent, lay, ri, verse) {
    var self = this, arr = this.arr, h = this.h;
    var top = ROW_TOP0 + ri * ROW_PITCH, lyrY = top + LYR_DY;
    var g = el('g', { 'class': 'row' }, parent);
    var n = lay.cols.length, i;
    var avail = RIGHT - LEFT_X;
    var comp = lay.minW > avail ? avail / lay.minW : 1;
    var slack = Math.max(0, avail - lay.minW * comp);
    var isLast = lay.b === arr.minfo.length - 1;
    if (isLast) slack = Math.min(slack, 0.4 * lay.minW);
    var wts = [], tot = 0;
    for (i = 0; i < n - 1; i++) {
      var dt = lay.cols[i + 1].t - lay.cols[i].t;
      var wt = Math.pow(Math.max(dt, 12), 0.65) * (lay.cols[i + 1].mi !== lay.cols[i].mi ? 1.2 : 1);
      wts.push(wt); tot += wt;
    }
    var X = [LEFT_X], acc = 0;
    for (i = 1; i < n; i++) { acc += wts[i - 1]; X.push(LEFT_X + lay.x[i] * comp + slack * (acc / (tot || 1))); }
    var cx = {};
    lay.cols.forEach(function (c, k) { cx[c.t] = X[k]; });

    // linha-guia leve entre diagramas e letra
    el('line', { x1: 64, x2: W - 64, y1: lyrY + 18, y2: lyrY + 18, stroke: INK, 'stroke-width': 1, opacity: 0.18 }, g);

    // compassos: barras na zona da letra, repetições, voltas e rótulos
    var barG = el('g', { 'class': 'bars' }, g);
    var topG = el('g', {}, g);
    for (var mi = lay.a; mi <= lay.b; mi++) {
      var li = mi - lay.a, fc = lay.mstarts[li];
      var d = this.h.ms[mi];
      var xFirst = X[fc];
      var xPrev = fc > 0 ? (X[fc - 1] + X[fc]) / 2 : LEFT_X - 64;
      if (mi > lay.a || fc > 0) this.bar(barG, xPrev, lyrY, d.r && d.r.indexOf('f') >= 0 ? 'rep-start' : 'bar');
      else if (d.r && d.r.indexOf('f') >= 0) this.bar(barG, LEFT_X - 64, lyrY, 'rep-start');
      if (d.r && d.r.indexOf('b') >= 0) {
        var nextFc = li + 1 < lay.mstarts.length ? lay.mstarts[li + 1] : n;
        var lastX = X[nextFc - 1];
        var xe = nextFc < n ? (X[nextFc - 1] + X[nextFc]) / 2 : Math.min(RIGHT - 6, lastX + 54);
        this.bar(barG, xe, lyrY, 'rep-end');
      } else if (mi === lay.b && mi === arr.minfo.length - 1) {
        this.bar(barG, Math.min(RIGHT - 6, X[n - 1] + 54), lyrY, 'end');
      }
      if (d.e && d.e.t === 'start') el('text', { x: xFirst - 60, y: top + 26, 'font-family': SERIF, 'font-size': 26, 'font-style': 'italic', 'font-weight': 'bold', fill: ACCENT, 'text-anchor': 'end' }, topG, d.e.n.join(',') + 'ª');
      if (d.lb && li > 0 && fc > 0) el('text', { x: xFirst - 60, y: top + 52, 'font-family': SERIF, 'font-size': 26, 'font-style': 'italic', 'font-weight': 'bold', fill: ACCENT, 'text-anchor': 'end' }, topG, d.lb);
    }
    var rowLabel = this.h.ms[lay.a].lb || null;

    // acordes
    var dg = el('g', { 'class': 'diagrams' }, g);
    var chordEls = [];
    lay.cols.forEach(function (c, k) {
      if (!c.chord) return;
      var ch = arr.chords[c.chord.ci];
      var gEl = el('g', { 'class': 'chord', 'data-ci': ch.idx }, dg);
      self.drawDiagram(gEl, ch, X[k], top + 6);
      chordEls.push({ ci: ch.idx, g: gEl });
    });

    // letra
    var lyr = el('g', { 'class': 'lyr' }, g);
    var row = {
      a: lay.a, b: lay.b, lay: lay, top: top, lyrY: lyrY, cx: cx, X: X, g: g, lyr: lyr, chordEls: chordEls,
      cols: lay.cols.map(function (c, k) { return { t: c.t, x: X[k] }; }), label: rowLabel, syl: [], _act: null, _chord: -1
    };
    var tick0 = el('g', { 'class': 'vno' }, g);
    row.vno = el('text', { x: 72, y: lyrY, 'font-family': SERIF, 'font-size': 40, 'font-weight': 'bold', fill: ACCENT }, tick0, rowLabel ? rowLabel : verse + '.');
    row.hasLabel = !!rowLabel;
    this.drawLyrics(row, verse);

    // cabeça de reprodução (faixa na linha)
    var ph = el('g', { 'class': 'playhead', opacity: 0 }, g);
    el('rect', { x: -22, y: top - 4, width: 44, height: ROW_PITCH - 30, fill: ACCENT, opacity: 0.12, rx: 10 }, ph);
    el('line', { x1: 0, x2: 0, y1: top + 196, y2: lyrY + 20, stroke: ACCENT, 'stroke-width': 3, opacity: 0.65 }, ph);
    row.ph = ph;
    return row;
  };

  Sheet.prototype.bar = function (g, x, lyrY, type) {
    var y1 = lyrY - 40, y2 = lyrY + 14;
    if (type === 'bar') { el('line', { x1: x, x2: x, y1: y1, y2: y2, stroke: INK, 'stroke-width': 2, opacity: 0.7 }, g); return; }
    if (type === 'end') {
      el('line', { x1: x - 8, x2: x - 8, y1: y1, y2: y2, stroke: INK, 'stroke-width': 2, opacity: 0.8 }, g);
      el('line', { x1: x, x2: x, y1: y1, y2: y2, stroke: INK, 'stroke-width': 6, opacity: 0.85 }, g);
      return;
    }
    var dir = type === 'rep-start' ? 1 : -1;
    el('line', { x1: x, x2: x, y1: y1, y2: y2, stroke: INK, 'stroke-width': 6, opacity: 0.85 }, g);
    el('line', { x1: x + dir * 9, x2: x + dir * 9, y1: y1, y2: y2, stroke: INK, 'stroke-width': 2, opacity: 0.85 }, g);
    el('circle', { cx: x + dir * 20, cy: lyrY - 22, r: 3.6, fill: INK, opacity: 0.85 }, g);
    el('circle', { cx: x + dir * 20, cy: lyrY - 6, r: 3.6, fill: INK, opacity: 0.85 }, g);
  };

  Sheet.prototype.drawLyrics = function (row, verse) {
    var self = this, g = row.lyr, y = row.lyrY;
    while (g.firstChild) g.removeChild(g.firstChild);
    var items = [];
    for (var mi = row.a; mi <= row.b; mi++) {
      this.notesByMeasure[mi].forEach(function (n) {
        var x = row.cx[n.t];
        if (x == null) return;
        var s = self.verseText(n, verse);
        if (s) items.push({ t: n.t, x: x, s: s });
      });
    }
    items.sort(function (a, b) { return a.x - b.x; });
    var font = '40px ' + SERIF;
    row.syl = [];
    items.forEach(function (it, k) {
      var txt = it.s.replace(/-$/, '');
      var gg = el('g', { 'class': 'syl' }, g);
      el('text', { x: it.x, y: y, 'text-anchor': 'middle', 'font-family': SERIF, 'font-size': 40, fill: INK }, gg, txt);
      if (/-$/.test(it.s)) {
        var nx = items[k + 1];
        var w1 = textW(txt, font);
        var xa = it.x + w1 / 2, xb = nx ? nx.x - textW(nx.s.replace(/-$/, ''), font) / 2 : xa + 30;
        if (xb - xa > 12) el('text', { x: (xa + xb) / 2, y: y, 'text-anchor': 'middle', 'font-family': SERIF, 'font-size': 40, fill: INK2 }, gg, '-');
      }
      row.syl.push({ t: it.t, g: gg });
    });
    row._act = null;
    if (row.vno && !row.hasLabel) row.vno.textContent = verse + '.';
  };

  Sheet.prototype.setVerse = function (verse) {
    var self = this;
    this.verse = verse;
    this.pages.forEach(function (p) { p.rows.forEach(function (r) { self.drawLyrics(r, verse); }); });
  };

  /* ---------- diagrama de acorde ---------- */
  Sheet.prototype.drawDiagram = function (g0, c, x, y) {
    var g = el('g', { transform: 'translate(' + x + ',' + y + ') scale(' + DS + ') translate(' + (-x) + ',' + (-y) + ')' }, g0);
    var sh = c.shape, T = this.theme;
    var gw = 78, fh = 26, nf = 4, sx = gw / 5, left = x - gw / 2;
    var frets = [];
    sh.fretted.forEach(function (f) { frets.push(f.f); });
    var minF = frets.length ? Math.min.apply(null, frets) : 1;
    var maxF = frets.length ? Math.max.apply(null, frets) : 1;
    var base = (maxF > 4) ? minF : 1;
    el('rect', { 'class': 'cbg', x: left - 20, y: y - 12, width: gw + 40, height: 178, rx: 12, fill: 'none' }, g);
    el('text', { x: x, y: y + 18, 'text-anchor': 'middle', 'font-family': SANS, 'font-size': 34, 'font-weight': 'bold', fill: INK }, g, c.name);
    var top = y + 58;
    var present = {};
    sh.strings.forEach(function (st) { present[st.s] = st.f; });
    for (var s = 1; s <= 6; s++) {
      var sxp = left + (6 - s) * sx;
      if (present[s] === undefined) {
        el('path', { d: 'M' + (sxp - 5) + ' ' + (top - 16) + 'l10 10M' + (sxp + 5) + ' ' + (top - 16) + 'l-10 10', stroke: INK2, 'stroke-width': 2 }, g);
      } else if (present[s] === 0) {
        el('circle', { cx: sxp, cy: top - 11, r: 5.5, fill: 'none', stroke: s === sh.low ? (T.accent || ACCENT) : INK, 'stroke-width': s === sh.low ? 3 : 2 }, g);
      }
    }
    for (var r = 0; r <= nf; r++) el('line', { x1: left, x2: left + gw, y1: top + r * fh, y2: top + r * fh, stroke: INK, 'stroke-width': r === 0 && base === 1 ? 5 : 1.6 }, g);
    for (var k = 0; k < 6; k++) el('line', { x1: left + k * sx, x2: left + k * sx, y1: top, y2: top + nf * fh, stroke: INK, 'stroke-width': 1.6 }, g);
    if (base > 1) el('text', { x: left + gw + 6, y: top + fh * 0.7, 'font-family': SANS, 'font-size': 20, fill: INK2 }, g, base + 'ª');
    if (sh.barre) {
      var bf = sh.barre.f - base;
      var bx1 = left + (6 - sh.barre.s2) * sx, bx2 = left + (6 - sh.barre.s1) * sx;
      el('rect', { x: bx1 - 7, y: top + bf * fh + fh / 2 - 8, width: bx2 - bx1 + 14, height: 16, rx: 8, fill: INK }, g);
    }
    sh.fretted.forEach(function (f, i) {
      var px = left + (6 - f.s) * sx, py = top + (f.f - base) * fh + fh / 2;
      var isBass = (f.s === sh.low);
      el('circle', { cx: px, cy: py, r: 10.5, fill: isBass ? (T.accent || ACCENT) : INK }, g);
      el('text', { x: px, y: py + 5.5, 'text-anchor': 'middle', 'font-family': SANS, 'font-size': 15, 'font-weight': 'bold', fill: '#fff' }, g, '' + sh.fing[i]);
    });
  };

  /* ---------- animação ---------- */
  // pi = índice da página; mi = compasso; tick = posição absoluta (ticks)
  Sheet.prototype.update = function (pi, mi, tick) {
    var page = this.pages[pi]; if (!page) return;
    var ri = this.measureRow[mi], arr = this.arr;
    var chord = this.chordActiveAt(tick);
    page.rows.forEach(function (row, k) {
      if (k !== ri) {
        if (row.ph.getAttribute('opacity') !== '0') row.ph.setAttribute('opacity', 0);
        if (row._chord !== -1) { row.chordEls.forEach(function (c) { c.g.classList.remove('on'); }); row._chord = -1; }
        if (row._act != null) { row.syl.forEach(function (s) { s.g.classList.remove('on'); }); row._act = null; }
        return;
      }
      var cols = row.cols, x = cols[0].x, lo = 0, hi = cols.length - 1;
      if (tick <= cols[0].t) x = cols[0].x;
      else if (tick >= cols[hi].t) x = cols[hi].x + Math.min(40, (tick - cols[hi].t) * 0.3);
      else {
        while (lo + 1 < hi) { var mid = (lo + hi) >> 1; if (cols[mid].t <= tick) lo = mid; else hi = mid; }
        var f = (tick - cols[lo].t) / (cols[lo + 1].t - cols[lo].t);
        x = cols[lo].x + f * (cols[lo + 1].x - cols[lo].x);
      }
      row.ph.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)');
      row.ph.setAttribute('opacity', 1);
      var ci = chord ? chord.idx : -2;
      if (row._chord !== ci) {
        row.chordEls.forEach(function (c) { c.g.classList.toggle('on', c.ci === ci); });
        row._chord = ci;
      }
      var act = -1;
      for (var q = 0; q < row.syl.length; q++) { if (row.syl[q].t <= tick + 0.5) act = q; else break; }
      if (row._act !== act) {
        row.syl.forEach(function (s, idx) { s.g.classList.toggle('on', idx === act); });
        row._act = act;
      }
    });
  };

  root.Sheet = Sheet;
  root.SheetConst = { W: W, H: H };
})(typeof window !== 'undefined' ? window : this);
