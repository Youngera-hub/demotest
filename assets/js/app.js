import { BIG5_ITEMS, TRAIT_ZH, FACET_ZH } from "./data-big5.js";
import { ATTACH, RIASEC, SCALE_AGREE } from "./data-more.js";
import { TRAIT_COPY, FACET_COPY, TYPES16, ATTACH_COPY, RIASEC_COPY, bandOf, TRAIT_ORDER } from "./copy.js";
import { scoreBig5, scoreAttach, scoreRiasec, normFor } from "./score.js";
import { radar, barRow, polarRow, quadrant } from "./chart.js";
import { bindRepoLinks } from "./config.js";

const KEY = "traitlens.v1";
const store = {
  read() { try { return JSON.parse(localStorage.getItem(KEY)) || { runs: [] }; } catch { return { runs: [] }; } },
  write(s) { localStorage.setItem(KEY, JSON.stringify(s)); },
};

const TESTS = {
  big5: {
    id: "big5", title: "大五人格 · 完整版", sub: "OCEAN 五维 + 30 个侧面", mins: 10, n: 120,
    kicker: "IPIP-NEO-120 · 公共领域题库",
    blurb: "心理学界使用最广的人格模型。六个侧面拆开每一维，并用年龄常模换算成百分位——你能看到自己在大致同龄人里的位置。",
    items: BIG5_ITEMS.map((i) => ({ label: TRAIT_ZH[i.t], zh: i.zh, en: i.en })),
    meta: BIG5_ITEMS,
  },
  attach: {
    id: "attach", title: "依恋风格", sub: "焦虑 × 回避 四象限", mins: 2, n: 12,
    kicker: "12 题 · 自编条目",
    blurb: "你在亲密关系里的默认策略：多担心被离开，多抗拒靠太近。两条轴交叉出安全、专注、疏离、恐惧四种位置。",
    items: ATTACH.items.map((i) => ({ zh: i.zh })),
    meta: ATTACH.items,
  },
  riasec: {
    id: "riasec", title: "霍兰德职业兴趣", sub: "RIASEC 三字码", mins: 3, n: 30,
    kicker: "30 题 · 六型兴趣环",
    blurb: "不谈能力与薪资，只看你愿意反复做什么。六类活动强度排序给出你的三字兴趣码，以及与之相邻的兴趣组合。",
    items: RIASEC.items.map((i) => ({ zh: i.zh })),
    meta: RIASEC.items,
  },
};

const S = { view: "home", test: null, idx: 0, answers: [], age: null, started: 0, theme: "light" };

/* ------------------------------------------------------------------ utils */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  $("#themeToggle")?.addEventListener("click", () => {
    S.theme = S.theme === "dark" ? "light" : "dark";
    localStorage.setItem("traitlens.theme", S.theme);
    document.documentElement.dataset.theme = S.theme;
  });
}

/* ------------------------------------------------------------------ router */
function route() {
  const h = location.hash.replace(/^#\/?/, "") || "home";
  const [name, arg] = h.split("/");
  if (name === "take" && TESTS[arg]) { start(arg); return; }
  if (name === "result") { renderResult(arg); return; }
  if (name === "method") { renderMethod(); bindRepoLinks(); return; }
  if (name === "history") { renderHistory(); return; }
  renderHome();
  document.querySelectorAll(".topnav a").forEach((a) => {
    const on = a.getAttribute("href") === `#/${name}` || (name === "home" && a.getAttribute("href") === "#/");
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
}
addEventListener("hashchange", route);

/* ------------------------------------------------------------------ home */
function renderHome() {
  S.view = "home";
  const cards = Object.values(TESTS).map((t) => `
    <a class="tile" href="#/take/${t.id}">
      <div class="kicker">${esc(t.kicker)}</div>
      <h3>${esc(t.title)}</h3>
      <p class="muted small">${esc(t.blurb)}</p>
      <div class="row"><span class="badge">${t.n} 题 · 约 ${t.mins} 分钟</span><span class="spacer"></span><span class="tiny">${esc(t.sub)} →</span></div>
    </a>`).join("");

  const last = store.read().runs[0];
  $("#view").innerHTML = `
  <section class="hero">
    <div>
      <h1>把「我是什么样的人」<br>拆成可以核对的数字</h1>
      <p class="lede">三套测评共用同一个原则：题目公开、计分公式公开、常模表随仓库分发。你在浏览器里点下的每个选项都在本地算完，不经过任何服务器。</p>
      <div class="hero-tags">
        <span class="badge">答案不上传</span><span class="badge gray">计分可复现</span>
        <span class="badge gray">MIT 开源</span><span class="badge gold">含年龄常模</span>
      </div>
      <div class="row" style="margin-top:18px">
        <a class="btn" href="#/take/big5">开始大五人格测评</a>
        <a class="btn ghost" href="#/method">先看方法与信效度</a>
      </div>
      ${last ? `<p class="tiny" style="margin-top:14px">上次测评：${new Date(last.at).toLocaleDateString("zh-CN")} ${esc(TESTS[last.test].title)}
        <a href="#/result/${last.id}">查看结果 →</a></p>` : ""}
    </div>
    <div class="card card-quiet">
      <h3>为什么不是「一次测出 16 型」</h3>
      <p class="small muted">类型是好记的入口，也是容易被误用的结论。本站把连续维度放在前面：先给你五个百分位和三十个侧面，再告诉它们各自落在哪一侧、离中点多远。</p>
      <p class="small muted">如果你只想要一个四字母标签，大五完成后会自动附赠——但它旁边永远写着每一条轴的清晰度。</p>
    </div>
  </section>

  <section><h2>选一个开始</h2><div class="grid grid-3">${cards}</div></section>

  <section class="card card-quiet">
    <h2>读结果之前</h2>
    <div class="grid grid-2">
      <div><h3>百分位不是分数</h3><p class="small muted">「外向性 78」表示在常模样本里 78% 的人得分低于你，不代表 78% 的外向含量。两端人少，中间密集，所以 50 附近挪十分比 80 附近挪十分难得多。</p></div>
      <div><h3>测的是常态行为</h3><p class="small muted">题目问的是「你通常怎样」，不是「你最好时怎样」。按三个月内的真实状态作答，比按理想自我作答更准。</p></div>
      <div><h3>会有波动</h3><p class="small muted">重测会有几百分位点的漂移，属正常测量误差。把两次结果差得很远的维度当作「正在变化的维度」，而不是当作测错了。</p></div>
      <div><h3>它不给你贴病</h3><p class="small muted">神经质高不是障碍，宜人性低不是缺陷。若某个侧面让你持续痛苦，值得找专业人士谈，而不是找量表。</p></div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ quiz */
function start(id) {
  const t = TESTS[id];
  S.view = "quiz"; S.test = id; S.idx = 0; S.started = Date.now();
  const saved = store.read().drafts?.[id];
  S.answers = saved && saved.answers?.length === t.n ? saved.answers : new Array(t.n).fill(0);
  S.age = saved?.age ?? null;
  S.idx = S.answers.findIndex((v) => !v);
  if (S.idx < 0) S.idx = t.n;

  $("#view").innerHTML = `<section id="quiz"></section>`;
  if (id === "big5" && !S.age) { renderAgeGate(t); return; }
  renderQ();
}

function renderAgeGate(t) {
  $("#quiz").innerHTML = `
    <div class="qcard">
      <div class="qnum">计分参数 · 可跳过</div>
      <h2 style="margin-top:10px">你的年龄（可选）</h2>
      <p class="muted small">IPIP-NEO 的常模按年龄分档。填了之后，每个维度的百分位会按大致同龄人计算；不填则使用通用常模。这个数字只留在你的浏览器里。</p>
      <div class="row" style="margin-top:14px">
        <label class="small muted" for="ageIn">周岁</label>
        <input id="ageIn" type="number" min="12" max="90" style="width:110px;padding:9px 12px;border-radius:10px;border:1.5px solid var(--line-2);background:var(--bg-soft);color:var(--ink);font:inherit">
        <button class="btn sm" id="ageOk">用这个年龄</button>
        <button class="btn sm ghost" id="ageSkip">不填，用通用常模</button>
      </div>
    </div>`;
  $("#ageOk").onclick = () => { const v = +$("#ageIn").value; S.age = v >= 12 && v <= 90 ? v : null; renderQ(); };
  $("#ageSkip").onclick = () => { S.age = null; renderQ(); };
}

function renderQ() {
  const t = TESTS[S.test];
  if (S.idx >= t.n) return renderReview(t);
  const q = t.items[S.idx];
  const done = S.answers.filter((v) => v > 0).length;
  $("#quiz").innerHTML = `
    <div class="progresswrap">
      <div class="pbar"><i style="width:${((S.idx + 1) / t.n) * 100}%"></i></div>
      <div class="pmeta"><span class="count">${S.idx + 1} / ${t.n}</span><span>已答 ${done}</span>
        <span class="spacer"></span><span>约 ${Math.max(1, Math.ceil((t.n - S.idx) * 5 / 60))} 分钟</span></div>
    </div>
    <div class="qcard">
      <div class="qnum">${esc(t.title)}${q.label ? ` · ${esc(q.label)}` : ""}</div>
      <p class="qtext">${esc(q.zh)}</p>
      ${q.en ? `<p class="qen">“${esc(q.en)}”</p>` : ""}
      <div class="scale" role="group" aria-label="符合程度">
        ${SCALE_AGREE.map((o) => `<button data-v="${o.v}" aria-pressed="${S.answers[S.idx] === o.v}">
            <span class="dot"></span><span class="lab">${esc(o.lab)}</span><span class="key">${o.v === 1 ? "1" : o.v === 5 ? "5" : ""}</span></button>`).join("")}
      </div>
      <div class="qfoot">
        <button class="btn ghost sm" id="prev" ${S.idx === 0 ? "disabled" : ""}>← 上一题</button>
        <button class="btn ghost sm" id="skip">暂时跳过</button>
        <span class="spacer"></span>
        <span class="hint">按 <kbd>1</kbd>–<kbd>5</kbd> 作答，<kbd>←</kbd> 返回</span>
      </div>
    </div>`;
  $("#quiz").querySelectorAll(".scale button").forEach((b) => (b.onclick = () => pick(+b.dataset.v)));
  $("#prev").onclick = () => { S.idx = Math.max(0, S.idx - 1); renderQ(); };
  $("#skip").onclick = () => { S.idx++; renderQ(); };
}

function pick(v) {
  S.answers[S.idx] = v;
  save();
  const t = TESTS[S.test];
  setTimeout(() => {
    const next = S.idx + 1;
    S.idx = next > t.n ? t.n : next;
    renderQ();
  }, 130);
}

function save() {
  const s = store.read();
  s.drafts = { ...(s.drafts || {}), [S.test]: { answers: S.answers, age: S.age, at: Date.now() } };
  store.write(s);
}

function renderReview(t) {
  const missing = S.answers.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  $("#quiz").innerHTML = `
    <div class="qcard">
      <div class="qnum">检查作答</div>
      <h2 style="margin-top:8px">${missing.length ? `还有 ${missing.length} 题没答` : "全部答完了"}</h2>
      <p class="muted small">未答的题会按「说不好」计入，但会拉低相关维度的区分度。空格可以点击补答。</p>
      <div class="review" style="margin:16px 0">
        ${S.answers.map((v, i) => `<button data-i="${i}" class="${v ? "done" : ""}">${i + 1}</button>`).join("")}
      </div>
      <div class="row">
        <button class="btn" id="finish">生成结果</button>
        <button class="btn ghost" id="back1">← 回上一题</button>
        <span class="spacer"></span>
        <span class="hint">${S.test === "big5" ? normFor(S.age).label : ""}</span>
      </div>
    </div>`;
  $("#finish").onclick = finish;
  $("#back1").onclick = () => { S.idx = t.n - 1; renderQ(); };
  $("#quiz").querySelectorAll(".review button").forEach((b) =>
    (b.onclick = () => { S.idx = +b.dataset.i; renderQ(); }));
}

function finish() {
  const t = TESTS[S.test];
  const ans = S.answers.map((v) => v || 3);
  const result = S.test === "big5" ? scoreBig5(ans, S.age)
    : S.test === "attach" ? scoreAttach(ans, t.meta) : scoreRiasec(ans, t.meta);
  const s = store.read();
  const run = { id: `${S.test}-${Date.now().toString(36)}`, test: S.test, at: Date.now(), answers: ans, age: S.age, result };
  s.runs = [run, ...(s.runs || [])].slice(0, 24);
  delete s.drafts?.[S.test];
  store.write(s);
  location.hash = `#/result/${run.id}`;
}

/* ------------------------------------------------------------------ result */
function renderResult(id) {
  S.view = "result";
  const run = store.read().runs.find((r) => r.id === id) || store.read().runs[0];
  if (!run) { location.hash = "#/"; return; }
  const t = TESTS[run.test];
  $("#view").innerHTML = `<section id="res"></section>`;
  if (run.test === "big5") drawBig5(run, t); else if (run.test === "attach") drawAttach(run, t);
  else drawRiasec(run, t);
  drawCommon(run, t);
}

function drawCommon(run, t) {
  $("#res").insertAdjacentHTML("beforeend", `
    <section class="card card-quiet no-print">
      <div class="row">
        <button class="btn" id="dl">保存结果卡 PNG</button>
        <button class="btn ghost" id="cp">复制文字摘要</button>
        <a class="btn ghost" href="#/take/${t.id}">重测一次</a>
        <span class="spacer"></span>
        <span class="tiny">${new Date(run.at).toLocaleString("zh-CN")} · ${t.title}</span>
      </div>
      <p class="tiny" style="margin-top:10px">结果卡的图片在本地生成，不含任何服务器地址；截图与分享都随你。</p>
    </section>
    <div class="warnbox"><b>再次声明</b>：这是自我探索工具，不是诊断。持续的情绪痛苦请找专业人士。</div>`);

  $("#dl").onclick = () => downloadCard(run, t);
  $("#cp").onclick = async (e) => {
    await navigator.clipboard.writeText(summaryText(run, t));
    e.target.textContent = "已复制 ✓";
    setTimeout(() => (e.target.textContent = "复制文字摘要"), 1600);
  };
}

function drawBig5(run, t) {
  const r = run.result;
  const tp = TYPES16[r.code];
  const bars = TRAIT_ORDER.map((tr) => {
    const c = TRAIT_COPY[tr], v = r.traits[tr];
    return barRow(`${c.glyph} ${esc(c.zh)} <span class="tiny">${esc(c.en)}</span>`, v.p, c.color, "", `P${v.p} · ${v.band.lab}`);
  }).join("");
  const axisRows = r.axes.map((a) => polarRow(a)).join("");
  const acc = TRAIT_ORDER.map((tr) => {
    const c = TRAIT_COPY[tr], v = r.traits[tr];
    const facets = r.facets[tr].map((f) => {
      const fc = FACET_COPY[f.key];
      return `<div class="bar-row" style="margin-bottom:11px">
        <div class="bhead"><span class="bname">${esc(f.zh)}</span><span class="bpct">P${f.p} · ${bandOf(f.p).lab}</span></div>
        <div class="track"><i style="width:${f.p}%;background:${c.color};opacity:.75"></i></div>
        <p class="tiny" style="margin:5px 0 0">${esc(f.level === "high" ? fc.hi : f.level === "low" ? fc.lo : fc.def)}</p></div>`;
    }).join("");
    return `<details class="acc"><summary>${c.glyph} ${esc(c.zh)}<span class="pill ${v.band.cls}">P${v.p} ${esc(v.band.lab)}</span></summary>
      <div class="body"><p class="small muted">${esc(c.def)}</p>
      <p class="small">${esc(v.p >= 66 ? c.hi : v.p <= 34 ? c.lo : c.mid)}</p>${facets}</div></details>`;
  }).join("");

  const combo = comboCopy(r);
  $("#res").innerHTML = `
    <div class="typecard">
      <div class="row" style="margin-bottom:6px"><span class="badge">${esc(r.identity)} · 由大五推导</span>
      <span class="badge gray">${esc(r.normLabel)}</span>
      ${r.flags.straight ? '<span class="badge" style="background:#f8d7da;color:#842029">作答过于一致</span>' : ""}</div>
      <p class="typecode">${esc(r.code + r.identity)}</p>
      <p class="typename">${esc(tp?.name || r.code)}</p>
      <p class="muted">${esc(tp?.blurb || "")}</p>
      <div class="row" style="margin-top:12px">
        <span class="tiny">五维百分位 ${TRAIT_ORDER.map((x) => `${x} ${r.traits[x].p}`).join(" · ")}</span>
      </div>
    </div>

    <section class="charts">
      <div class="card">${radar(TRAIT_ORDER.map((x) => ({ label: TRAIT_COPY[x].zh, v: r.traits[x].p })), TRAIT_ORDER.map((x) => TRAIT_COPY[x].color))}</div>
      <div class="card"><h3>五大维度</h3>${bars}
        <div class="legend"><span>0 · 低于多数人</span><span>百分位</span><span>100 · 高于多数人</span></div></div>
    </section>

    <section class="card">
      <h3>四条轴落在哪一侧</h3>
      <p class="small muted">下面四行不是另一套测试，是把同一批大五得分按常用规则映射过去。条越短说明你越靠近中点，四字母代码在这种情况下越不稳定。</p>
      <div class="polar">${axisRows}</div>
    </section>

    <section><h2>维度与 30 个侧面</h2>${acc}</section>

    <section class="grid grid-2">
      <div class="card"><h3>你的组合特征</h3>${combo.map((c) => `<p class="small">• ${esc(c)}</p>`).join("")}</div>
      <div class="card"><h3>怎么用好这张结果</h3>
        <ul class="clean small muted">
          <li>先看分离度最大的两个维度，它们最能解释你的日常行为。</li>
          <li>再看侧面：总分居中但侧面两极分化，说明这一维在不同情境下表现完全不同。</li>
          <li>把「偏高」当成成本更低的选项，而不是当成身份标签。</li>
        </ul></div>
    </section>
    ${r.flags.straight ? `<div class="warnbox" style="margin-bottom:20px">你的作答离散度极低（SD ${r.flags.sd}），可能在不区分维度地重复选同一项。建议重测一次，尽量按具体情境作答。</div>` : ""}`;
}

function comboCopy(r) {
  const p = (x) => r.traits[x].p, out = [];
  if (p("O") > 60 && p("C") < 40) out.push("开放性高而尽责性低：想法来得快、落得慢。给每个念头设一个「两周内必须产出可见东西」的硬规则。");
  if (p("O") < 40 && p("C") > 60) out.push("务实且自律：你擅长把已知方法执行到位，风险是在环境剧变时低估新路径的收益。");
  if (p("N") > 65 && p("E") < 40) out.push("情绪敏感叠加内倾：消耗常发生在独处反刍里。把担心说出来给一个具体的人，比自己想三天有效。");
  if (p("N") < 35 && p("A") < 40) out.push("稳定且直接：你在冲突里不太掉血，但别人可能需要你把语气放慢一档再说一次。");
  if (p("A") > 70 && p("C") > 70) out.push("高宜人 + 高尽责：最容易过度承接他人需求的人。给自己留一份「这周我不接」的清单。");
  if (p("E") > 65 && p("C") < 45) out.push("外向且随性：启动快、收尾弱。把收尾工作交给一个尽责性高的同伴，比逼自己更管用。");
  if (Math.abs(p("E") - 50) < 12 && Math.abs(p("N") - 50) < 12) out.push("多数维度居中：你更像「看场合的人」，环境给你的角色比量表里的你更决定行为。");
  if (!out.length) out.push("各维度之间没有出现明显的拉扯组合，你的行为跨情境比较一致——这类结果通常最难被一句标签概括。");
  const gaps = TRAIT_ORDER.map((x) => ({ x, d: Math.abs(p(x) - 50) })).sort((a, b) => b.d - a.d);
  out.unshift(`分离度最高：${TRAIT_COPY[gaps[0].x].zh} P${p(gaps[0].x)}，其次是${TRAIT_COPY[gaps[1].x].zh} P${p(gaps[1].x)}。`);
  return out;
}

function drawAttach(run) {
  const r = run.result, c = ATTACH_COPY[r.key];
  const quad = (k) => { const q = ATTACH_COPY[k]; const active = k === r.key;
    return `<div class="card ${active ? "" : "card-quiet"}" style="${active ? "border-color:var(--brand)" : ""}">
      <h3>${esc(q.name)}${active ? " ← 你" : ""}</h3><p class="small muted">${esc(q.blurb)}</p></div>`; };
  $("#res").innerHTML = `
    <div class="typecard">
      <div class="row" style="margin-bottom:6px"><span class="badge">依恋风格</span><span class="badge gray">焦虑 × 回避</span></div>
      <p class="typename">${esc(c.name)}</p><p class="muted">${esc(c.blurb)}</p>
    </div>
    <section class="grid grid-2">
      <div class="card"><h3>两条轴的强度</h3>
        ${barRow("关系焦虑（怕被离开）", r.anxPct, "var(--N)", "", `${r.anx}/30`)}
        <div style="height:14px"></div>
        ${barRow("亲密回避（抗拒靠太近）", r.avdPct, "var(--O)", "", `${r.avd}/30`)}
        <p class="tiny" style="margin-top:12px">分界取量表中点 18。接近分界的类型更容易随关系对象而切换——这不矛盾，依恋本身就是情境性的。</p></div>
      <div class="card">${quadrant(r.anx, r.avd, [[75, 24, "安全"], [225, 24, "专注"], [75, 288, "疏离"], [225, 288, "恐惧"]])}
        <p class="tiny center">横轴 = 关系焦虑 · 纵轴 = 亲密回避</p></div>
      <div class="card"><h3>可以做什么</h3><p class="small">${esc(c.tip)}</p></div>
    </section>
    <section><h2>四种位置</h2><div class="grid grid-2">${["safe", "preoccupied", "dismissing", "fearful"].map(quad).join("")}</div></section>`;
}

function drawRiasec(run) {
  const r = run.result;
  const COL = { R: "var(--N)", I: "var(--O)", A: "var(--C)", S: "var(--A)", E: "var(--E)", C: "var(--brand)" };
  const rows = r.rank.map((x) => barRow(`${x.t} · ${RIASEC_COPY[x.t].name}`, x.p, COL[x.t], "", `${x.raw}/25`)).join("");
  const top = r.code.split("");
  $("#res").innerHTML = `
    <div class="typecard">
      <div class="row" style="margin-bottom:6px"><span class="badge">霍兰德兴趣码</span><span class="badge gray">分化度 ${r.differentiation}</span></div>
      <p class="typecode">${esc(r.code)}</p>
      <p class="typename">${top.map((x) => RIASEC_COPY[x].name.split(" ")[0]).join(" · ")}</p>
      <p class="muted">前三位分别代表你最愿意反复投入精力的三类活动。分化度 ${r.differentiation}（满分 20），${r.differentiation > 10 ? "说明你的兴趣方向比较集中，代码解释力强。" : "说明六类兴趣都不弱或多头并进——单看三字码容易过度简化。"}</p>
    </div>
    <section class="card"><h3>六类强度</h3>${rows}
      <p class="tiny" style="margin-top:12px">百分位换算方式为「该型得分相对满额的比例」，本站无职业兴趣常模样本，因此不给同龄人排位。</p></section>
    <section class="grid grid-3">${top.map((x) => {
      const c = RIASEC_COPY[x];
      return `<div class="card"><h3>${esc(c.name)}</h3><p class="small muted">${esc(c.desc)}</p>
        <p class="tiny">常见方向</p><ul class="clean small">${c.jobs.slice(0, 5).map((j) => `<li>${esc(j)}</li>`).join("")}</ul></div>`;
    }).join("")}</section>`;
}

/* ------------------------------------------------------------------ history / method */
function renderHistory() {
  S.view = "history";
  const runs = store.read().runs;
  $("#view").innerHTML = `<section><h2>历史记录</h2>
    ${runs.length ? `<div class="card"><table><thead><tr><th>时间</th><th>测评</th><th>结果</th><th></th></tr></thead><tbody>
      ${runs.map((r) => `<tr><td class="tiny">${new Date(r.at).toLocaleString("zh-CN")}</td>
        <td>${esc(TESTS[r.test].title)}</td>
        <td><b>${esc(r.test === "big5" ? r.result.code + r.result.identity : r.test === "attach" ? ATTACH_COPY[r.result.key].name : r.result.code)}</b></td>
        <td><a href="#/result/${r.id}">查看 →</a></td></tr>`).join("")}</tbody></table>
      <div class="row" style="margin-top:14px"><button class="btn ghost sm" id="wipe">清空全部记录</button>
      <span class="tiny">数据只存在这台设备的浏览器里，清掉就没了。</span></div></div>`
      : `<p class="muted">还没有记录。所有结果只保存在这台设备的浏览器里。</p>`}
    <div class="row" style="margin-top:18px"><a class="btn" href="#/">去测评中心</a></div></section>`;
  const w = $("#wipe");
  if (w) w.onclick = () => { if (confirm("确认清空本机保存的全部测评记录？")) { store.write({ runs: [] }); renderHistory(); } };
}

function renderMethod() {
  $("#view").innerHTML = `
  <section><h1>方法与来源</h1><p class="lede">本站不发明量表。每一套题都能追到公开出处，计分公式与参考实现逐项对齐。</p></section>
  <section class="card"><h3>大五人格 · IPIP-NEO-120</h3>
    <p class="small muted">题库来自 International Personality Item Pool（P. John A. Johnson 编制，公共领域），120 题覆盖 5 个域 × 6 个侧面，每侧面 4 题、正反向各半。</p>
    <p class="small muted">计分：反向题按 6−x 翻转 → 侧面求和（4–20）→ 域求和（24–120）→ 用年龄常模换算 T 分 <code>T = 50 + 10(x − μ)/σ</code> → 三次多项式映射为百分位，T 超出常模区间时截断在 1 / 99。</p>
    <p class="small muted">常模表与键位表取自 <code>five-factor-e</code>（MIT），随仓库分发；本站用 <code>dev/verify.mjs</code> 与参考实现做了逐题交叉校验，35 个百分位在多组随机答案下完全一致。</p></section>
  <section class="card"><h3>四字母类型是怎么来的</h3>
    <p class="small muted">沿用 16personalities 公开说明的思路：外向 E/内向 I ← 外向性，直觉 N/实感 S ← 开放性，思考 T/情感 F ← 宜人性，判断 J/感知 P ← 尽责性，坚决 -A/动荡 -T ← 情绪稳定性（神经质反向）。它只是同一批数字的另一种读法，不是第二套测量，因此每个字母旁边都标出离中点的距离。</p></section>
  <section class="card"><h3>依恋风格 / 霍兰德兴趣</h3>
    <p class="small muted">框架为 Bartholomew 四类型模型与 Holland 六边形理论；条目由本站用中文原创编写，不复制任何付费量表题目。依恋分界取量表中点，兴趣码取前三高位并报告分化度。</p></section>
  <section class="card"><h3>局限</h3>
    <ul class="clean small muted">
      <li>自陈量表受当下状态、社会期许与理解偏差影响，一次结果的解释力有限。</li>
      <li>常模来自公开研究样本，与中文使用人群分布并不完全一致，百分位应看作近似定位。</li>
      <li>类型标签会随小分差翻转；请优先看连续维度与侧面，而不是记住四个字母。</li>
    </ul>
    <div class="row" style="margin-top:14px"><a class="btn" href="#/take/big5">开始测评</a><a class="btn ghost" href="#" data-repo>查看源码</a></div></section>`;
}

/* ------------------------------------------------------------------ share */
function summaryText(run, t) {
  const r = run.result;
  if (t.id === "big5")
    return `我在人格透镜的大五人格测评（IPIP-NEO-120）：\n` +
      TRAIT_ORDER.map((x) => `  ${TRAIT_COPY[x].zh} ${r.traits[x].p} 百分位（${r.traits[x].band.lab}）`).join("\n") +
      `\n类型读法：${r.code}${r.identity} ${TYPES16[r.code]?.name || ""}\n来源：${location.origin}${location.pathname}#/result/${run.id}`;
  if (t.id === "attach")
    return `我的依恋风格：${ATTACH_COPY[r.key].name}（焦虑 ${r.anx}/30，回避 ${r.avd}/30）\n来源：${location.origin}${location.pathname}#/result/${run.id}`;
  return `我的霍兰德兴趣码：${r.code}（分化度 ${r.differentiation}）\n来源：${location.origin}${location.pathname}#/result/${run.id}`;
}

function downloadCard(run, t) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 675;
  const g = canvas.getContext("2d");
  const r = run.result;
  const dark = S.theme === "dark";
  g.fillStyle = dark ? "#0e1118" : "#f6f4ef"; g.fillRect(0, 0, 1200, 675);
  g.fillStyle = dark ? "#eaeefb" : "#151827";
  g.font = "700 54px system-ui, 'PingFang SC', sans-serif";
  const head = t.id === "big5" ? `${r.code}${r.identity}` : t.id === "attach" ? ATTACH_COPY[r.key].name : r.code;
  g.fillText(head, 70, 120);
  g.font = "400 26px system-ui, 'PingFang SC', sans-serif";
  g.fillStyle = dark ? "#a7b0c8" : "#4a5069";
  g.fillText(t.id === "big5" ? (TYPES16[r.code]?.name || "") : t.title, 70, 168);

  if (t.id === "big5") {
    TRAIT_ORDER.forEach((x, i) => {
      const y = 240 + i * 72, c = getComputedStyle(document.documentElement).getPropertyValue(`--${x}`).trim() || "#1c6d63";
      g.fillStyle = dark ? "#cdd5ea" : "#3a4059";
      g.font = "500 24px system-ui, 'PingFang SC', sans-serif";
      g.fillText(TRAIT_COPY[x].zh, 70, y + 8);
      g.fillStyle = dark ? "#232b3f" : "#e2ddd2"; g.fillRect(250, y - 12, 780, 26);
      g.fillStyle = c; g.fillRect(250, y - 12, (780 * r.traits[x].p) / 100, 26);
      g.fillStyle = dark ? "#cdd5ea" : "#3a4059"; g.font = "600 24px ui-monospace, monospace";
      g.fillText(String(r.traits[x].p).padStart(2, " "), 1060, y + 8);
    });
  } else {
    g.font = "400 24px system-ui, 'PingFang SC', sans-serif";
    g.fillText(t.blurb, 70, 240);
  }
  g.fillStyle = dark ? "#7b849e" : "#767d96";
  g.font = "400 20px system-ui, sans-serif";
  g.fillText(`人格透镜 TraitLens · ${new Date(run.at).toLocaleDateString("zh-CN")} · 自陈式测评，非诊断`, 70, 610);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `traitlens-${t.id}-${run.id}.png`;
  a.click();
}

/* ------------------------------------------------------------------ boot */
S.theme = localStorage.getItem("traitlens.theme") || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
document.querySelector(".topbar").insertAdjacentHTML("beforeend",
  `<button class="iconbtn no-print" id="themeToggle" title="切换深浅色" aria-label="切换深浅色">◐</button>`);
applyTheme();
addEventListener("keydown", (e) => {
  if (S.view !== "quiz" || $("#quiz .scale") === null) return;
  if (["1", "2", "3", "4", "5"].includes(e.key)) { e.preventDefault(); pick(+e.key); }
  if (e.key === "ArrowLeft") { S.idx = Math.max(0, S.idx - 1); renderQ(); }
});
route();
