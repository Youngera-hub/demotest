import json
from pathlib import Path
from ipipneo.model import (NormScale, NormCubic, Big5Neuroticism, Big5Extraversion,
                           Big5Openness, Big5Agreeableness, Big5Conscientiousness)
from ipipneo.norm import Norm
from ipipneo.reverse import IPIP_NEO_ITEMS_REVERSED_120 as IPIP_REVERSED

qs = json.loads(Path("research/questions.json").read_text(encoding="utf-8"))["questions"]

order = ["N", "E", "O", "A", "C"]
facets = {
    "N": [e.value for e in Big5Neuroticism],
    "E": [e.value for e in Big5Extraversion],
    "O": [e.value for e in Big5Openness],
    "A": [e.value for e in Big5Agreeableness],
    "C": [e.value for e in Big5Conscientiousness],
}
print("FACETS", json.dumps(facets, ensure_ascii=False))

TRAIT = {"N": "neuroticism", "E": "extraversion", "O": "openness",
         "A": "agreeableness", "C": "conscientiousness"}

# item layout: q_index (0-based) = i*30 + j  -> facet position j (0-based), block i
items = []
for idx, q in enumerate(qs):
    i, j = divmod(idx, 30)
    trait = order[j % 5]
    facet_name = facets[trait][j // 5]
    items.append({
        "id": q["id"],
        "trait": trait,
        "facet": facet_name,
        "text_en": q["text"],
        "reverse": q["id"] in IPIP_REVERSED,
    })

# 参考实现的联合常模按区间分桶，逐桶导出而非按固定年份采样
norms = []
for age in range(12, 100):
    ns = [round(float(v), 4) for v in Norm(sex="N", age=age, nquestion=120)["ns"]]
    if norms and ns == norms[-1]["ns"]:
        norms[-1]["max"] = age
    else:
        norms.append({"min": age, "max": age, "ns": ns})

out = {
    "meta": {
        "model": "IPIP-NEO-120",
        "source": "https://github.com/NeuroQuestAi/five-factor-e (MIT) / IPIP public domain (John A. Johnson)",
        "norm_scale": [NormScale.CONST_MIN.value, NormScale.CONST_MAX.value],
        "cubic": [NormCubic.CONST1.value, NormCubic.CONST2.value,
                  NormCubic.CONST3.value, NormCubic.CONST4.value],
    },
    "items": items,
    "facets": facets,
    "trait_names": TRAIT,
    "norms": norms,
}
Path("research/ipip120.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print("items:", len(items), "reversed:", sum(1 for x in items if x["reverse"]))
print("norm buckets:", [(n["min"], n["max"]) for n in norms], "ns len:", len(norms[0]["ns"]))
