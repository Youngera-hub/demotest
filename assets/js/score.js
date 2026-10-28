import { BIG5_ITEMS, NORMS, BIG5_META, FACETS, TRAIT_ZH, FACET_ZH } from "./data-big5.js";
import { AXIS_MAP, TRAIT_ORDER, bandOf } from "./copy.js";

const [NMIN, NMAX] = BIG5_META.norm_scale;
const [C1, C2, C3, C4] = BIG5_META.cubic;

const keyed = (item, v) => (item.r ? 6 - v : v);
const cubic = (t) => C1 - C2 * t + C3 * t * t - C4 * t ** 3;
const pct = (t) => (t < NMIN ? 1 : t > NMAX ? 99 : Math.round(cubic(t)));

/** 常模按区间分桶；不填年龄时取各桶平均，页面上标注为近似通用常模。 */
function avgNorm() {
  const rows = NORMS.map((b) => b.ns);
  return rows[0].map((_, i) => rows.reduce((s, r) => s + r[i], 0) / rows.length);
}

export function normFor(age) {
  if (!age) return { ns: avgNorm(), label: "通用常模（四个年龄桶平均，近似）" };
  const b = NORMS.find((x) => age >= x.min && age <= x.max) || NORMS[NORMS.length - 1];
  return { ns: b.ns, label: `同龄常模 ${b.min}–${b.max} 岁` };
}

export function scoreBig5(answers, age) {
  const { ns, label } = normFor(age);
  const raw = new Array(30).fill(0);
  for (let i = 0; i < 120; i++) raw[i % 30] += keyed(BIG5_ITEMS[i], answers[i]);

  const OFFSET = { N: 10, E: 22, O: 34, A: 46, C: 58 };
  const traits = {};
  const facets = {};
  for (const tr of TRAIT_ORDER) {
    const idx = { N: 1, E: 2, O: 3, A: 4, C: 5 }[tr];
    const domainRaw = FACETS[tr].reduce((sum, _, k) => sum + raw[(5 * k) + { N: 0, E: 1, O: 2, A: 3, C: 4 }[tr]], 0);
    const domT = 50 + (10 * (domainRaw - ns[idx])) / ns[5 + idx];
    const list = FACETS[tr].map((name, k) => {
      const r = raw[5 * k + { N: 0, E: 1, O: 2, A: 3, C: 4 }[tr]];
      const t = 50 + (10 * (r - ns[OFFSET[tr] + 1 + k])) / ns[OFFSET[tr] + 7 + k];
      return { key: name, zh: FACET_ZH[name], raw: r, t, p: pct(t), level: t < 45 ? "low" : t > 55 ? "high" : "average" };
    });
    facets[tr] = list;
    traits[tr] = { raw: domainRaw, t: domT, p: pct(domT), band: bandOf(pct(domT)), zh: TRAIT_ZH[tr] };
  }

  const axes = AXIS_MAP.map((a) => {
    const p = a.invert ? 100 - traits[a.trait].p : traits[a.trait].p;
    const left = p >= 50 ? 0 : 1;
    return { ...a, left, pctLeft: Math.round(p), pctRight: 100 - Math.round(p), win: a.label[left], clarity: Math.round(Math.abs(p - 50) * 2) };
  });
  const letter = (a) => (a.left === 0 ? a.letter[0] : a.letter[1]);
  const code = axes.slice(0, 4).map(letter).join("");
  const identity = letter(axes[4]);

  const vals = answers.filter((v) => v > 0);
  const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
  const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length || 1));
  const flags = {
    straight: vals.length > 20 && sd < 0.55,
    extremeRatio: vals.filter((v) => v === 1 || v === 5).length / (vals.length || 1),
    sd: +sd.toFixed(2),
  };

  return { traits, facets, axes, code, identity, flags, normLabel: label, answered: vals.length };
}

export function scoreAttach(answers, items) {
  const total = (want) => items.reduce((s, it, i) => s + (it.t === want ? answers[i] : 0), 0);
  const anx = total("anx"), avd = total("avd");
  const key = anx <= 18 && avd <= 18 ? "safe"
    : anx > 18 && avd <= 18 ? "preoccupied"
    : anx <= 18 && avd > 18 ? "dismissing" : "fearful";
  const toPct = (v) => Math.round(((v - 6) / 24) * 100);
  return { anx, avd, anxPct: toPct(anx), avdPct: toPct(avd), key };
}

export function scoreRiasec(answers, items) {
  const dims = {}, counts = {};
  items.forEach((it, i) => { dims[it.t] = (dims[it.t] || 0) + answers[i]; counts[it.t] = (counts[it.t] || 0) + 1; });
  const order = ["R", "I", "A", "S", "E", "C"];
  const rank = order
    .map((t) => ({ t, raw: dims[t], n: counts[t], p: Math.round(((dims[t] - counts[t]) / (4 * counts[t])) * 100) }))
    .sort((a, b) => b.raw - a.raw || order.indexOf(a.t) - order.indexOf(b.t));
  return {
    rank,
    code: rank.slice(0, 3).map((r) => r.t).join(""),
    differentiation: rank[0].raw - rank[rank.length - 1].raw,
  };
}
