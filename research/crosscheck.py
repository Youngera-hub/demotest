import json, random
from pathlib import Path
from ipipneo.ipipneo import IpipNeo

random.seed(20261028)
NODE = {"openness": "O", "conscientiousness": "C", "extraversion": "E",
        "agreeableness": "A", "neuroticism": "N"}

cases = []
for k in range(8):
    age = [25, 18, 25, 34, 50, 67, 12, 44][k]
    if k == 0:
        picks = [3] * 120
    elif k == 1:
        picks = [random.choice([1, 5]) for _ in range(120)]
    else:
        picks = [random.randint(1, 5) for _ in range(120)]

    answers = {"answers": [{"id_question": i + 1, "id_select": v} for i, v in enumerate(picks)]}
    out = IpipNeo(120).compute(sex="N", age=age, answers=json.loads(json.dumps(answers)), compare=True)

    nodes = {}
    for pers in out["person"]["result"]["personalities"]:
        nodes.update(pers)
    domains, facets = {}, {}
    for name, label in NODE.items():
        node = nodes[name]
        domains[label] = round(node[label], 2)
        facets[label] = {t["trait"]: round(v, 2)
                         for t in node["traits"] for _, v in t.items()
                         if _ not in ("trait", "score")}
    reversed_items = out["person"]["result"]["compare"]["user_answers_reversed"]
    cases.append({"age": age, "answers": picks, "domains": domains, "facets": facets,
                  "keyed": [r["id_select"] for r in sorted(reversed_items, key=lambda x: x["id_question"])]})

Path("dev/expected.json").write_text(json.dumps(cases, ensure_ascii=False), encoding="utf-8")
print("wrote dev/expected.json cases =", len(cases))
