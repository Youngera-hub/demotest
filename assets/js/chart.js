export function barRow(name, p, color, note = "", badge = "") {
  return `<div class="bar-row" style="margin-bottom:4px">
    <div class="bhead"><span class="bname">${name}</span>
      <span class="bpct">${badge || `P${p}`}${note ? ` · ${note}` : ""}</span></div>
    <div class="track"><i style="width:${p}%;background:${color}"></i><span class="mid"></span></div></div>`;
}

export function polarRow(a) {
  const [l, r] = a.label;
  const left = a.left === 0;
  const winLab = left ? l : r;
  const winPct = left ? a.pctLeft : a.pctRight;
  const near = a.clarity < 10;
  return `<div>
    <div class="bhead"><span class="side win">${winLab}</span>
      <span class="bpct">${winPct}%${near ? ' <span class="pill">接近中点</span>' : ""}</span></div>
    <div class="track"><i style="width:${winPct}%;background:${left ? "var(--E)" : "var(--O)"}"></i><span class="mid"></span></div>
    <div class="legend"><span>${l}</span><span>${a.copy}</span><span>${r}</span></div></div>`;
}

/** 五维雷达图（纯 SVG，无外部依赖） */
export function radar(data, colors) {
  const cx = 160, cy = 150, R = 108, n = data.length;
  const pt = (i, rr) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon points="${data.map((_, i) => pt(i, R * f).join(",")).join(" ")}"
        fill="none" stroke="var(--line)" stroke-width="1"/>`).join("");
  const spokes = data.map((_, i) => {
    const [x, y] = pt(i, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
  }).join("");
  const poly = data.map((d, i) => pt(i, (R * Math.max(4, d.v)) / 100).join(",")).join(" ");
  const dots = data.map((d, i) => {
    const [x, y] = pt(i, (R * Math.max(4, d.v)) / 100);
    return `<circle cx="${x}" cy="${y}" r="4.5" fill="${colors[i]}" stroke="var(--card)" stroke-width="2"/>`;
  }).join("");
  const labels = data.map((d, i) => {
    const [x, y] = pt(i, R + 26);
    const anchor = Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
    return `<text x="${x}" y="${y + 4}" text-anchor="${anchor}" font-size="13" fill="var(--ink-2)"
        font-family="system-ui,sans-serif">${d.label} <tspan fill="var(--ink)" font-weight="700">${d.v}</tspan></text>`;
  }).join("");

  return `<svg viewBox="-60 -14 440 330" width="100%" role="img" aria-label="五维雷达图：${data.map((d) => `${d.label}${d.v}`).join("，")}">
    <title>五大维度百分位雷达图</title>${rings}${spokes}
    <polygon points="${poly}" fill="color-mix(in srgb,var(--brand) 22%,transparent)" stroke="var(--brand)" stroke-width="2"/>
    ${dots}${labels}</svg>`;
}

/** 依恋四象限散点：anx / avd 为 6–30 的原始分 */
export function quadrant(anx, avd, labels) {
  const pos = (v) => 20 + ((v - 6) / 24) * 260;
  const x = pos(anx), y = pos(avd);
  return `<svg viewBox="0 0 300 300" width="100%" role="img" aria-label="依恋焦虑回避四象限">
    <rect x="150" y="0" width="150" height="150" fill="color-mix(in srgb,var(--N) 9%,transparent)"/>
    <rect x="0" y="150" width="150" height="150" fill="color-mix(in srgb,var(--O) 9%,transparent)"/>
    <line x1="150" y1="0" x2="150" y2="300" stroke="var(--line-2)"/>
    <line x1="0" y1="150" x2="300" y2="150" stroke="var(--line-2)"/>
    ${labels.map(([lx, ly, t]) => `<text x="${lx}" y="${ly}" font-size="12" fill="var(--ink-3)" text-anchor="middle">${t}</text>`).join("")}
    <circle cx="${x}" cy="${y}" r="9" fill="var(--brand)" stroke="var(--card)" stroke-width="3"/>
    <text x="${Math.min(x + 14, 250)}" y="${Math.max(y - 12, 16)}" font-size="13" font-weight="700" fill="var(--ink)">你</text>
  </svg>`;
}
