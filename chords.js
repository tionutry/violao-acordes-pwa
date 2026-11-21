/* chords.js — motor de acompanhamento (acordes) do violão.
 * Entrada: hino (hinos.json) → saída: acordes com forma no violão (dedos), batidas ou dedilhados
 * por fórmula de compasso em 3 níveis (facil, dificil, misto) e a melodia (soprano) separada.
 * Funciona no navegador (window.Arranger) e no Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Arranger = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OPEN = [0, 64, 59, 55, 50, 45, 40]; // corda 1..6 (MIDI)
  var IV = [
    [0, 4, 7], [0, 3, 7], [0, 4, 7, 10], [0, 3, 7, 10], [0, 4, 7, 11],
    [0, 3, 6], [0, 3, 6, 10], [0, 3, 6, 9], [0, 4, 8], [0, 5, 7], [0, 4, 7, 9]
  ];
  var SUFFIX = ['', 'm', '7', 'm7', '7M', 'dim', 'm7(b5)', 'dim7', 'aug', 'sus4', '6'];
  var SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  var NAME_C = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  function mod(a, n) { return ((a % n) + n) % n; }
  function fifthsFromPc(pc) { var f = (pc * 7) % 12; if (f > 6) f -= 12; return f; }
  function pcName(pc, fifths) { return (fifths > 0 ? SHARP : (fifths < 0 ? FLAT : NAME_C))[mod(pc, 12)]; }
  function chordName(root, qi, bass, fifths) {
    return pcName(root, fifths) + SUFFIX[qi] + (bass !== root ? '/' + pcName(bass, fifths) : '');
  }

  /* =================================================================
   * PADRÕES (batida e dedilhado) por fórmula de compasso
   * Cada padrão: n = nº de "casas" (slots) no compasso inteiro; h = [[slot, tipo], ...]
   * Batida:    D ↓ (todas as cordas) · U ↑ (3-4 cordas agudas) · B baixo (tônica) · b baixo alternado
   * Dedilhado: p polegar no baixo · q polegar no baixo alternado · i (3ª corda) · m (2ª) · a (1ª)
   * Compassos: '4' = 4/4 e 2/2 · '2' = 2/4 · '3' = 3/4 e 3/2 · '6' = 6/8 e 6/4 · '9' = 9/8 e 9/4 · '12' = 12/8
   * ================================================================= */
  var PAT = {
    batida: {
      '4': {
        facil: { n: 8, h: [[0, 'D'], [2, 'D'], [4, 'D'], [6, 'D']] },
        dificil: { n: 8, h: [[0, 'D'], [2, 'D'], [3, 'U'], [5, 'U'], [6, 'D'], [7, 'U']] }
      },
      '2': {
        facil: { n: 4, h: [[0, 'D'], [2, 'D']] },
        dificil: { n: 4, h: [[0, 'D'], [2, 'D'], [3, 'U']] }
      },
      '3': {
        facil: { n: 6, h: [[0, 'D'], [2, 'D'], [4, 'D']] },
        dificil: { n: 6, h: [[0, 'B'], [2, 'D'], [3, 'U'], [4, 'D'], [5, 'U']] }
      },
      '6': {
        facil: { n: 6, h: [[0, 'D'], [3, 'D']] },
        dificil: { n: 6, h: [[0, 'B'], [1, 'D'], [2, 'D'], [3, 'b'], [4, 'D'], [5, 'D']] }
      },
      '9': {
        facil: { n: 9, h: [[0, 'D'], [3, 'D'], [6, 'D']] },
        dificil: { n: 9, h: [[0, 'B'], [1, 'D'], [2, 'D'], [3, 'b'], [4, 'D'], [5, 'D'], [6, 'B'], [7, 'D'], [8, 'D']] }
      },
      '12': {
        facil: { n: 12, h: [[0, 'D'], [3, 'D'], [6, 'D'], [9, 'D']] },
        dificil: { n: 12, h: [[0, 'B'], [1, 'D'], [2, 'D'], [3, 'b'], [4, 'D'], [5, 'D'], [6, 'B'], [7, 'D'], [8, 'D'], [9, 'b'], [10, 'D'], [11, 'D']] }
      }
    },
    dedilhado: {
      '4': {
        facil: { n: 8, h: [[0, 'p'], [2, 'i'], [4, 'm'], [6, 'i']] },
        dificil: { n: 8, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'a'], [4, 'q'], [5, 'i'], [6, 'm'], [7, 'i']] }
      },
      '2': {
        facil: { n: 4, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'i']] },
        dificil: { n: 8, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'a'], [4, 'q'], [5, 'i'], [6, 'm'], [7, 'i']] }
      },
      '3': {
        facil: { n: 6, h: [[0, 'p'], [2, 'i'], [4, 'm']] },
        dificil: { n: 6, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'a'], [4, 'm'], [5, 'i']] }
      },
      '6': {
        facil: { n: 6, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'p'], [4, 'i'], [5, 'm']] },
        dificil: { n: 6, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'q'], [4, 'm'], [5, 'a']] }
      },
      '9': {
        facil: { n: 9, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'q'], [4, 'i'], [5, 'm'], [6, 'p'], [7, 'i'], [8, 'm']] },
        dificil: { n: 9, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'a'], [4, 'm'], [5, 'i'], [6, 'q'], [7, 'i'], [8, 'm']] }
      },
      '12': {
        facil: { n: 12, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'q'], [4, 'i'], [5, 'm'], [6, 'p'], [7, 'i'], [8, 'm'], [9, 'q'], [10, 'i'], [11, 'm']] },
        dificil: { n: 12, h: [[0, 'p'], [1, 'i'], [2, 'm'], [3, 'a'], [4, 'm'], [5, 'i'], [6, 'q'], [7, 'i'], [8, 'm'], [9, 'a'], [10, 'm'], [11, 'i']] }
      }
    }
  };
  var BEATS = { '4': 4, '2': 2, '3': 3, '6': 2, '9': 3, '12': 4 };

  function tsClass(ts) {
    var n = ts[0], d = ts[1];
    if (n === 12) return '12';
    if (n === 9) return '9';
    if (n === 6) return '6';
    if (n === 3) return '3';
    if (n === 2 && d === 4) return '2';
    return '4'; // 4/4, 2/2 e demais
  }
  function fullLen(ts) { return ts[0] * (384 / ts[1]); }

  function patternText(style, pat) {
    var sym = new Array(pat.n).fill('·');
    pat.h.forEach(function (x) {
      var k = x[1], s;
      if (style === 'batida') s = k === 'D' ? '↓' : (k === 'U' ? '↑' : (k === 'B' ? 'B' : 'b'));
      else s = k === 'q' ? 'p' : k;
      sym[x[0]] = s;
    });
    return sym.join(' ');
  }
  var LEVEL_NAME = { facil: 'Fácil', dificil: 'Difícil', misto: 'Misto' };
  var STYLE_NAME = { batida: 'Batida', dedilhado: 'Dedilhado' };

  /* ---------- dedos da mão esquerda ---------- */
  // notes: apenas casas > 0: [{s,f}]; all: todas as notas do acorde (para detectar cordas soltas na pestana)
  function assignFingers(notes, all) {
    var n = notes.length, i;
    if (!n) return { fing: [], barre: null };
    var minF = 99, maxF = 0;
    for (i = 0; i < n; i++) { if (notes[i].f < minF) minF = notes[i].f; if (notes[i].f > maxF) maxF = notes[i].f; }
    if (maxF - minF > 3) return null;
    var order = notes.map(function (x, k) { return k; }).sort(function (a, b) {
      return (notes[a].f - notes[b].f) || (notes[b].s - notes[a].s);
    });
    var low = order.filter(function (k) { return notes[k].f === minF; });
    var barre = null;
    if (low.length >= 2 && n >= 4) {
      var s1 = 99, s2 = 0;
      low.forEach(function (k) { s1 = Math.min(s1, notes[k].s); s2 = Math.max(s2, notes[k].s); });
      var ok = true;
      for (i = 0; i < all.length; i++) { if (all[i].s >= s1 && all[i].s <= s2 && all[i].f < minF) ok = false; }
      if (ok) barre = { f: minF, s1: s1, s2: s2 };
    }
    if (!barre && n > 4) return null;
    var fing = new Array(n), next = 2;
    if (!barre) {
      for (i = 0; i < n; i++) fing[order[i]] = i + 1;
      return { fing: fing, barre: null };
    }
    for (i = 0; i < n; i++) {
      var k2 = order[i];
      if (notes[k2].f === minF && notes[k2].s >= barre.s1 && notes[k2].s <= barre.s2) fing[k2] = 1;
      else fing[k2] = next++;
    }
    if (next - 1 > 4) return null;
    return { fing: fing, barre: barre };
  }

  /* ---------- formas de acorde (todas as cordas soando, da corda grave escolhida até a 1ª) ---------- */
  var shapeCache = {};

  function chordShapes(root, qi, bassPc, capo, easy) {
    var key = [root, qi, bassPc, capo, easy ? 1 : 0].join('|');
    if (shapeCache[key]) return shapeCache[key];
    var out = enumerate(root, qi, bassPc, capo, easy, false);
    if (!out.length) out = enumerate(root, qi, bassPc, capo, easy, true);
    out.sort(function (a, b) { return a.cost - b.cost; });
    out = out.slice(0, 14);
    shapeCache[key] = out;
    return out;
  }

  function enumerate(root, qi, bassPc, capo, easy, allowSkip) {
    var iv = IV[qi];
    var pcs = iv.map(function (x) { return mod(root + x, 12); });
    var second = pcs[1], fifth = pcs[2], seventh = pcs.length > 3 ? pcs[3] : -1;
    var out = [], seen = {};
    [6, 5, 4].forEach(function (low) {
      for (var fb = 0; fb <= 10; fb++) {
        if (mod(OPEN[low] + capo + fb, 12) !== bassPc) continue;
        var wins = [], w;
        if (fb > 0) { for (w = Math.max(1, fb - 3); w <= fb; w++) wins.push(w); }
        else { for (w = 1; w <= 8; w++) wins.push(w); }
        wins.forEach(function (w0) {
          var bassMidi = OPEN[low] + capo + fb;
          var inner = [], skipped = 0;
          function rec(s) {
            if (s < 1) { finish(); return; }
            for (var f = 0; f <= w0 + 3; f++) {
              if (f > 0 && f < w0) continue;
              var p = OPEN[s] + capo + f;
              if (p <= bassMidi) continue;
              if (pcs.indexOf(mod(p, 12)) < 0) continue;
              inner.push({ s: s, f: f, midi: p });
              rec(s - 1);
              inner.pop();
            }
            if (allowSkip && s > 1 && skipped < 2) { skipped++; rec(s - 1); skipped--; }
          }
          function finish() {
            if (!inner.length) return;
            var strings = [{ s: low, f: fb, midi: bassMidi }].concat(inner);
            var sig = strings.map(function (x) { return x.s + ':' + x.f; }).join(',');
            if (seen[sig]) return; seen[sig] = 1;
            var pitches = strings.map(function (x) { return mod(x.midi, 12); });
            var hasSecond = pitches.indexOf(second) >= 0;
            var hasFifth = pitches.indexOf(fifth) >= 0;
            var hasSev = seventh >= 0 && pitches.indexOf(seventh) >= 0;
            var fretted = strings.filter(function (x) { return x.f > 0; }).map(function (x) { return { s: x.s, f: x.f }; });
            var af = assignFingers(fretted, strings);
            if (!af) return;
            var nz = fretted.map(function (x) { return x.f; });
            var minNZ = nz.length ? Math.min.apply(null, nz) : 0, maxNZ = nz.length ? Math.max.apply(null, nz) : 0;
            var cost = 1.0 * (maxNZ - minNZ) + 0.55 * minNZ + 0.2 * maxNZ + 0.45 * fretted.length;
            if (af.barre) {
              var span = af.barre.s2 - af.barre.s1;
              cost += span <= 1 ? (easy ? 1.6 : 0.5) : (easy ? 3.4 : 1.4);
            }
            for (var a = 0; a < fretted.length; a++) {
              for (var b = a + 1; b < fretted.length; b++) {
                if (fretted[a].f === fretted[b].f && Math.abs(fretted[a].s - fretted[b].s) >= 3 && !(af.barre && af.barre.f === fretted[a].f)) cost += 1.5;
              }
            }
            if (!hasSecond) cost += 6;
            if (seventh >= 0 && !hasSev) cost += (qi === 10 ? 0.4 : 2.6);
            if (!hasFifth && qi !== 5 && qi !== 6 && qi !== 7 && qi !== 8) cost += 0.5;
            cost += 0.25 * (6 - low) + (low === 4 ? 0.3 : 0);
            cost += 0.9 * (low - strings.length); // cordas puladas no meio
            var opens = strings.filter(function (x) { return x.f === 0; }).length;
            cost -= 0.25 * opens;
            out.push({
              sig: sig, cost: cost, low: low, strings: strings, fretted: fretted,
              fing: af.fing, barre: af.barre, anchor: minNZ, pcs: pcs
            });
          }
          rec(low - 1);
        });
      }
    });
    return out;
  }

  /* ---------- compassos ---------- */
  function measureInfo(h) {
    var ms = h.ms, t = 0, ts = [4, 4], tempo = h.tp || 60, out = [];
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.b) ts = m.b;
      if (m.tp) tempo = m.tp;
      out.push({ t0: t, len: m.l, pad: m.p || 0, ts: ts.slice(), tempo: tempo, idx: i });
      t += m.l;
    }
    return out;
  }

  /* ---------- plano de acordes para um (T, capo, nível) ---------- */
  function buildChords(h, T, o) {
    var raw = h.ch.map(function (c) {
      var root = mod(c[2] + T, 12), qi = c[3], bass = mod(c[4] + T, 12);
      var pcs = IV[qi].map(function (x) { return mod(root + x, 12); });
      if (!o.slash || pcs.indexOf(bass) < 0) bass = root;
      return { t: c[0], d: c[1], root: root, qi: qi, bass: bass };
    });
    var merged = [];
    raw.forEach(function (c) {
      var l = merged[merged.length - 1];
      if (l && l.root === c.root && l.qi === c.qi && l.bass === c.bass && Math.abs(l.t + l.d - c.t) < 1) l.d += c.d;
      else merged.push(c);
    });
    return merged;
  }

  function candidates(c, capo, o) {
    var list = [];
    chordShapes(c.root, c.qi, c.root, capo, o.easy).slice(0, 12).forEach(function (s) {
      list.push({ sh: s, cost: s.cost + (c.bass !== c.root ? 1.8 : 0) });
    });
    if (c.bass !== c.root) {
      chordShapes(c.root, c.qi, c.bass, capo, o.easy).slice(0, 12).forEach(function (s) {
        list.push({ sh: s, cost: s.cost + 0.3 });
      });
    }
    return list;
  }

  function plan(h, T, capo, o) {
    var chords = buildChords(h, T, o);
    var K = chords.map(function (c) { return candidates(c, capo, o); });
    var dp = [], i, j, pj;
    for (i = 0; i < chords.length; i++) {
      var cur = [];
      for (j = 0; j < K[i].length; j++) {
        var best = Infinity, bk = -1, st = K[i][j];
        if (i === 0) best = st.cost;
        else {
          for (pj = 0; pj < K[i - 1].length; pj++) {
            var ps = K[i - 1][pj], tr = 0;
            if (ps.sh.sig !== st.sh.sig) tr = 0.35 * Math.abs(ps.sh.anchor - st.sh.anchor) + 0.2;
            var v = dp[i - 1][pj].cost + tr + st.cost;
            if (v < best) { best = v; bk = pj; }
          }
        }
        cur.push({ cost: best, back: bk });
      }
      dp.push(cur);
    }
    var pick = [], total = 0;
    if (chords.length) {
      var li = chords.length - 1, bi = 0, bv = Infinity;
      dp[li].forEach(function (x, k) { if (x.cost < bv) { bv = x.cost; bi = k; } });
      total = bv;
      for (i = li; i >= 0; i--) { pick[i] = bi; bi = dp[i][bi].back; }
    }
    chords.forEach(function (c, k) { c.sh = K[k][pick[k]].sh; });
    return { chords: chords, cost: total };
  }

  /* ---------- geração de eventos ---------- */
  function measureOfFn(minfo) {
    return function (t) {
      var lo = 0, hi = minfo.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (minfo[mid].t0 <= t + 0.5) lo = mid; else hi = mid - 1; }
      return lo;
    };
  }
  function chordAtFn(chords) {
    return function (t) {
      var lo = 0, hi = chords.length - 1, r = 0;
      while (lo <= hi) { var mid = (lo + hi) >> 1; if (chords[mid].t <= t + 0.5) { r = mid; lo = mid + 1; } else hi = mid - 1; }
      return chords[r];
    };
  }

  function altBassIndex(ch) {
    var st = ch.shape.strings, fifth = ch.pcs[2], k;
    for (k = 1; k < Math.min(3, st.length); k++) if (mod(st[k].midi, 12) === fifth) return k;
    return Math.min(1, st.length - 1);
  }
  function stringAt(ch, sNum) {
    var st = ch.shape.strings;
    for (var k = 0; k < st.length; k++) if (st[k].s === sNum) return st[k];
    return st[st.length - 1];
  }

  function hitEvents(ch, t, kind, style, vel) {
    var st = ch.shape.strings, ev = [], k;
    function push(x, hand, v, off) {
      ev.push({ t: t, role: 'acc', s: x.s, f: x.f, midi: x.midi, hand: hand, vel: Math.min(1.1, v), off: off, ci: ch.idx, kind: kind });
    }
    if (style === 'batida') {
      if (kind === 'D' || kind === 'R') {
        var sp = kind === 'R' ? 0.034 : 0.011;
        for (k = 0; k < st.length; k++) push(st[k], 'D', vel * (k === 0 ? 1.0 : 0.82 - 0.02 * k), k * sp);
      } else if (kind === 'U') {
        var n = Math.min(4, st.length), c = 0;
        for (k = st.length - 1; k >= st.length - n; k--, c++) push(st[k], 'U', vel * 0.62, c * 0.009);
      } else if (kind === 'B') {
        push(st[0], 'p', vel * 1.0, 0);
      } else if (kind === 'b') {
        push(st[altBassIndex(ch)], 'p', vel * 0.85, 0);
      }
    } else {
      if (kind === 'R') {
        for (k = 0; k < st.length; k++) push(st[k], k === 0 ? 'p' : (['', 'a', 'm', 'i'][st[k].s] || 'i'), vel * (k === 0 ? 1 : 0.7), k * 0.045);
      } else if (kind === 'p') push(st[0], 'p', vel * 0.95, 0);
      else if (kind === 'q') push(st[altBassIndex(ch)], 'p', vel * 0.78, 0);
      else if (kind === 'i') push(stringAt(ch, 3), 'i', vel * 0.62, 0);
      else if (kind === 'm') push(stringAt(ch, 2), 'm', vel * 0.64, 0);
      else if (kind === 'a') push(stringAt(ch, 1), 'a', vel * 0.68, 0);
    }
    return ev;
  }


  /* ---------- BATIDA guiada pela melodia (compassos simples) e por grupos (compassos compostos) ----------
   * Simples (2/2, 2/4, 3/4, 4/4, 3/2): cada nota da melodia recebe movimentos ↓↑ alternados.
   *   Difícil: uma semicolcheia por movimento (24 ticks; 48 se o andamento for rápido), começando sempre em ↓.
   *   Fácil:   notas curtas (≤ colcheia) como no difícil; notas maiores recebem um único ↓ por tempo (96 ticks).
   *   Misto:   como o fácil, mas a última nota de cada compasso é subdividida como no difícil.
   * Compostos (6/8, 9/8, 12/8, 6/4, 9/4): cada tempo (3 pulsos) é um grupo.
   *   Fácil:   ↓ em cada pulso (1↓ 2↓ 3↓ 4↓ 5↓ 6↓).
   *   Difícil: por grupo ↓↑ ↓↑ ↓ (4 semicolcheias + 1 colcheia).
   *   Misto:   ↓ em cada pulso e ↓↑ no final de cada grupo (1↓ 2↓ 3↓↑ 4↓ 5↓ 6↓↑).
   * ---------------------------------------------------------------------------------------------- */
  function isCompound(cls) { return cls === '6' || cls === '9' || cls === '12'; }

  function melodySegments(mel, totalTicks) {
    var segs = [], cur = 0;
    mel.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (n) {
      if (n.t - cur >= 48) segs.push({ t: cur, d: n.t - cur, rest: true });
      if (n.t + n.d > cur) { segs.push({ t: n.t, d: n.d, rest: false }); cur = n.t + n.d; }
    });
    if (totalTicks - cur >= 48) segs.push({ t: cur, d: totalTicks - cur, rest: true });
    return segs;
  }

  function segMoves(seg, level, hardRule, tempo) {
    var unit = tempo > 88 ? 48 : 24, d = seg.d, out = [], i, n;
    if (hardRule) {
      n = Math.max(1, Math.round(d / unit));
      while (n > 8) { unit *= 2; n = Math.max(1, Math.round(d / unit)); }
      for (i = 0; i < n; i++) out.push({ dt: i * unit, k: i % 2 === 0 ? 'D' : 'U' });
    } else if (d <= 60) {
      n = (unit === 24 && d >= 40) ? 2 : 1;
      for (i = 0; i < n; i++) out.push({ dt: i * 24, k: i % 2 === 0 ? 'D' : 'U' });
    } else {
      n = Math.max(1, Math.ceil((d - 24) / 96));
      for (i = 0; i < n; i++) out.push({ dt: i * 96, k: 'D' });
    }
    return out;
  }

  function melodyBatida(mel, minfo, level, totalTicks, lastT0, measureOf) {
    var segs = melodySegments(mel, totalTicks), hits = [], text = {};
    // última nota (não pausa) de cada compasso, para o nível misto
    var lastOfMeasure = {};
    segs.forEach(function (sg, i) { if (!sg.rest) lastOfMeasure[measureOf(sg.t)] = i; });
    segs.forEach(function (sg, i) {
      if (sg.t >= lastT0 - 0.5) return;
      var mi = measureOf(sg.t), tempo = minfo[mi].tempo;
      if (isCompound(tsClass(minfo[mi].ts))) return; // compostos: padrão por grupos
      var hard = level === 'dificil' || (level === 'misto' && lastOfMeasure[mi] === i);
      var mv = segMoves(sg, level, hard, tempo), str = '';
      mv.forEach(function (x, j) {
        var t = sg.t + x.dt;
        if (t >= lastT0 - 0.5) return;
        hits.push({ t: Math.round(t * 100) / 100, kind: x.k, vel: j === 0 ? 1.0 : (x.k === 'D' ? 0.84 : 0.62) });
        str += x.k === 'D' ? '↓' : '↑';
      });
      (text[mi] = text[mi] || []).push(str);
    });
    return { hits: hits, text: text };
  }

  function compoundBar(bs, full, cls, level, t0, t1, hits) {
    var n = { '6': 6, '9': 9, '12': 12 }[cls], slotT = full / n, g, k, str = [];
    function add(t, kind, vel) {
      if (t >= t0 - 0.5 && t < t1 - 0.5) hits.push({ t: Math.round(t * 100) / 100, kind: kind, vel: vel });
    }
    for (g = 0; g < n / 3; g++) {
      var gs = bs + g * 3 * slotT, u = slotT / 2;
      if (level === 'dificil') {
        add(gs, 'D', g === 0 ? 1.0 : 0.92); add(gs + u, 'U', 0.6); add(gs + 2 * u, 'D', 0.84);
        add(gs + 3 * u, 'U', 0.6); add(gs + 4 * u, 'D', 0.8);
        str.push('↓↑↓↑↓');
      } else {
        for (k = 0; k < 3; k++) add(gs + k * slotT, 'D', (g === 0 && k === 0) ? 1.0 : (k === 0 ? 0.92 : 0.78));
        if (level === 'misto') { add(gs + 2 * slotT + u, 'U', 0.6); str.push('↓ ↓ ↓↑'); }
        else str.push('↓ ↓ ↓');
      }
    }
    return str.join(' ');
  }

  function generate(h, T, capo, pl, o) {
    var minfo = measureInfo(h), chords = pl.chords, style = o.style, level = o.level, fifths;
    var majorPc = mod(h.k * 7 + T, 12);
    fifths = fifthsFromPc(majorPc);
    var outChords = chords.map(function (c, i) {
      var sh = c.sh;
      var held = sh.fretted.map(function (x, k) { return { s: x.s, f: x.f, n: sh.fing[k] }; });
      return {
        t: c.t, d: c.d, root: c.root, qi: c.qi, bass: c.bass, idx: i, pcs: sh.pcs,
        name: chordName(c.root, c.qi, c.bass, fifths),
        shape: { strings: sh.strings.map(function (x) { return { s: x.s, f: x.f, midi: x.midi }; }), low: sh.low, fretted: sh.fretted, fing: sh.fing, barre: sh.barre },
        held: held
      };
    });
    var chordAt = chordAtFn(outChords);
    var totalTicks = minfo.length ? minfo[minfo.length - 1].t0 + minfo[minfo.length - 1].len : 0;

    /* ---- batidas / dedilhados por compasso ---- */
    var mel0 = h.mel.map(function (r) { return { t: r[0], d: r[1] }; });
    var hits = [];                // {t, kind, vel}
    var measurePat = [];
    var barIndex = {}, barCount = 0;
    var phase = 0;
    var lastIdx = minfo.length - 1;
    minfo.forEach(function (m, mi) {
      var full = fullLen(m.ts), cls = tsClass(m.ts);
      if (mi === 0) phase = m.pad || (m.len < full - 0.5 ? full - m.len : 0);
      else if (m.pad) phase = m.pad;
      var t1 = m.t0 + m.len;
      var info = null;
      if (mi === lastIdx) {
        hits.push({ t: m.t0, kind: 'R', vel: 0.95 });
        measurePat[mi] = { label: STYLE_NAME[style] + ' · final', text: style === 'batida' ? '↓ (acorde final)' : 'p i m a (arpejo final)', level: level, bar: -1 };
        return;
      }
      var bs = m.t0 - phase;
      var guard = 0;
      if (style === 'batida' && !isCompound(cls)) { measurePat[mi] = { bar: -2 }; return; } // simples: guiado pela melodia (abaixo)
      if (style === 'batida') {
        var txt = '';
        while (bs < t1 - 0.5 && guard++ < 8) {
          var tx = compoundBar(bs, full, cls, level, m.t0, t1, hits);
          if (!txt) txt = tx;
          bs += full;
        }
        measurePat[mi] = { label: STYLE_NAME[style] + ' · ' + LEVEL_NAME[level], text: txt, level: level, bar: -1 };
        phase = (phase + m.len) % full;
        if (full - phase < 0.5) phase = 0;
        return;
      }
      while (bs < t1 - 0.5 && guard++ < 8) {
        var key = Math.round(bs);
        if (barIndex[key] == null) barIndex[key] = barCount++;
        var bi = barIndex[key];
        var lv = level === 'misto' ? (bi % 2 === 0 ? 'facil' : 'dificil') : level;
        var pat = PAT[style][cls][lv];
        var slotT = full / pat.n, spb = pat.n / BEATS[cls];
        pat.h.forEach(function (x) {
          var t = bs + x[0] * slotT;
          if (t >= m.t0 - 0.5 && t < t1 - 0.5) {
            var strong = (x[0] % spb) === 0;
            hits.push({ t: Math.round(t * 100) / 100, kind: x[1], vel: x[0] === 0 ? 1.0 : (strong ? 0.88 : 0.74) });
          }
        });
        if (!info) info = { label: STYLE_NAME[style] + ' · ' + LEVEL_NAME[lv], text: patternText(style, pat), level: lv, bar: bi };
        bs += full;
      }
      measurePat[mi] = info || { label: '', text: '', level: level, bar: -1 };
      phase = (phase + m.len) % full;
      if (full - phase < 0.5) phase = 0;
    });
    if (style === 'batida') {
      var lastT0 = minfo[lastIdx].t0;
      var mb = melodyBatida(mel0, minfo, level, totalTicks, lastT0, measureOfFn(minfo));
      mb.hits.forEach(function (x) { hits.push(x); });
      minfo.forEach(function (m, mi) {
        if (!measurePat[mi] || measurePat[mi].bar === -2) {
          var tx = (mb.text[mi] || []).join(' ');
          if (tx.length > 30) tx = tx.slice(0, 29) + '…';
          measurePat[mi] = { label: STYLE_NAME[style] + ' · ' + LEVEL_NAME[level], text: tx, level: level, bar: -1 };
        }
      });
    }
    // entrada de cada acorde: o toque na troca é sempre ↓ (batida) ou o baixo (dedilhado)
    outChords.forEach(function (c) {
      if (c.t >= totalTicks - 0.5) return;
      var near = hits.filter(function (x) { return Math.abs(x.t - c.t) < 13 && x.kind !== 'R'; });
      if (!near.length) { hits.push({ t: c.t, kind: style === 'batida' ? 'D' : 'p', vel: 0.9 }); return; }
      near.forEach(function (x) {
        if (style === 'batida') { if (x.kind === 'U') { x.kind = 'D'; x.vel = Math.max(x.vel, 0.84); } }
        else if (x.kind !== 'p') { x.kind = 'p'; x.vel = Math.max(x.vel, 0.9); }
      });
    });
    hits.sort(function (a, b) { return a.t - b.t; });

    var events = [], lastCi = -1;
    hits.forEach(function (x) {
      var ch = chordAt(x.t);
      var ev = hitEvents(ch, x.t, x.kind, style, x.vel);
      if (ev.length && ch.idx !== lastCi) { ev[0].muteAll = true; lastCi = ch.idx; }
      events = events.concat(ev);
    });

    /* ---- melodia (soprano) ---- */
    var mel = h.mel.map(function (r) { return { t: r[0], d: r[1], midi: r[2] + T, fer: r[3], ly: r[4] || null }; });
    mel.forEach(function (n) { events.push({ t: n.t, d: n.d, role: 'mel', midi: n.midi, vel: 1.0, hand: 'm', s: 0, f: 0, ci: chordAt(n.t).idx }); });
    events.sort(function (a, b) { return (a.t - b.t) || ((a.role === 'acc' ? 0 : 1) - (b.role === 'acc' ? 0 : 1)); });

    /* ---- estados da mão esquerda (início de cada compasso e de cada acorde) ---- */
    var times = {};
    minfo.forEach(function (m) { times[Math.round(m.t0)] = 1; });
    outChords.forEach(function (c) { times[Math.round(c.t)] = 1; });
    var states = Object.keys(times).map(Number).sort(function (a, b) { return a - b; }).map(function (t) {
      var ch = chordAt(t);
      return { t: t, held: ch.held, barre: ch.shape.barre, ci: ch.idx };
    });

    var maxFret = 0;
    outChords.forEach(function (c) { c.shape.fretted.forEach(function (f) { if (f.f > maxFret) maxFret = f.f; }); });
    var keyName = h.md ? pcName(mod(majorPc + 9, 12), fifths) + 'm' : pcName(majorPc, fifths);

    return {
      T: T, capo: capo, fifths: fifths, keyName: keyName, minfo: minfo, chords: outChords, mel: mel,
      events: events, states: states, maxFret: maxFret, total: totalTicks, measurePat: measurePat,
      style: style, level: level
    };
  }

  /* ---------- seleção automática de tom ---------- */
  function arrange(h, opts) {
    opts = opts || {};
    var style = opts.style || 'batida', level = opts.level || 'facil', mode = opts.mode || 'facil';
    var o = { easy: level === 'facil', slash: level !== 'facil', style: style, level: level };
    var melMin = 999, melMax = 0, i;
    h.mel.forEach(function (r) { if (r[2] < melMin) melMin = r[2]; if (r[2] > melMax) melMax = r[2]; });
    var cands = [];
    if (mode === 'manual') cands.push({ T: opts.T || 0, capo: opts.capo || 0, pen: 0 });
    else if (mode === 'original') { for (i = 0; i <= 5; i++) cands.push({ T: 0, capo: i, pen: 2.5 * i }); }
    else { for (i = -6; i <= 5; i++) cands.push({ T: i, capo: 0, pen: 3.5 * Math.abs(i) }); }
    var best = null;
    cands.forEach(function (c) {
      var pl = plan(h, c.T, c.capo, o);
      var pen = c.pen, hi = melMax + c.T, lo = melMin + c.T;
      if (hi > 81) pen += (hi - 81) * 3;
      if (lo < 55) pen += (55 - lo) * 3;
      var score = pl.cost + pen;
      if (!best || score < best.score) best = { score: score, pl: pl, T: c.T, capo: c.capo };
    });
    var arr = generate(h, best.T, best.capo, best.pl, o);
    arr.score = best.score;
    return arr;
  }

  return {
    OPEN: OPEN, arrange: arrange, chordShapes: chordShapes, assignFingers: assignFingers, measureInfo: measureInfo,
    pcName: pcName, chordName: chordName, PAT: PAT, tsClass: tsClass, fullLen: fullLen, patternText: patternText,
    LEVEL_NAME: LEVEL_NAME, STYLE_NAME: STYLE_NAME
  };
});
