import { readFileSync } from "node:fs";
import { scoreBig5 } from "../assets/js/score.js";
import { BIG5_ITEMS, FACETS } from "../assets/js/data-big5.js";

const cases = JSON.parse(readFileSync(new URL("./expected.json", import.meta.url), "utf-8"));
let bad = 0, notes = 0;

for (const [i, c] of cases.entries()) {
  // 1) 反向键位逐题比对
  const mineKeyed = c.answers.map((v, q) => (BIG5_ITEMS[q].r ? 6 - v : v));
  const diff = mineKeyed.filter((v, q) => v !== c.keyed[q]).length;
  if (diff) { console.log(`case ${i}: ${diff} 道题的键位与参考实现不一致`); bad++; }

  // 2) 35 个百分位比对
  const mine = scoreBig5(c.answers, c.age);
  for (const tr of ["O", "C", "E", "A", "N"]) {
    if (Math.abs(c.domains[tr] - mine.traits[tr].p) > 0.6) {
      console.log(`case ${i} domain ${tr}: expected ${c.domains[tr]} got ${mine.traits[tr].p}`); bad++;
    }
    FACETS[tr].forEach((name, k) => {
      const e = c.facets[tr][k + 1], g = mine.facets[tr][k].p;
      if (Math.abs(e - g) > 0.6) { console.log(`case ${i} facet ${tr}/${name}: expected ${e} got ${g}`); bad++; }
    });
    notes += 1 + FACETS[tr].length;
  }
}
console.log(bad === 0
  ? `PASS — ${cases.length} 组随机答案：键位 120/120 一致，${notes} 个百分位与 five-factor-e 参考实现一致（容差 0.6）`
  : `FAIL — ${bad} 处偏差`);
process.exit(bad ? 1 : 0);
