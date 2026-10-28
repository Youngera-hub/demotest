import json
from pathlib import Path

ZH = {
1:"为各种事情担心。",2:"很容易和别人交朋友。",3:"想象力丰富。",4:"相信他人。",
5:"能把任务顺利完成。",6:"很容易生气。",7:"喜欢热闹的聚会。",8:"认为艺术很重要。",
9:"为了自己的目的利用别人。",10:"喜欢把东西收拾整齐。",11:"经常感到心情低落。",
12:"喜欢由我来主导。",13:"情绪体验很强烈。",14:"乐于帮助别人。",15:"信守自己的承诺。",
16:"很难主动接近别人。",17:"总是忙个不停。",18:"更喜欢变化而不是按部就班。",
19:"喜欢和别人争执。",20:"工作很努力。",21:"会放任自己纵情享乐。",22:"喜欢刺激。",
23:"喜欢读有挑战性的材料。",24:"认为自己比别人优秀。",25:"总是有备而来。",
26:"遇到情况容易慌神。",27:"由内而外散发出快乐。",28:"倾向于投票给自由派候选人。",
29:"对无家可归者心怀同情。",30:"不假思索就动手。",31:"总往最坏的情况想。",
32:"和人相处时很自在。",33:"喜欢天马行空的幻想。",34:"相信别人出于善意。",
35:"在我做的事情上表现出色。",36:"很容易被惹烦。",37:"在聚会上和很多人聊天。",
38:"能发现别人注意不到的美。",39:"为了上位而作弊。",40:"常忘记把东西放回原处。",
41:"不喜欢自己。",42:"尝试领导别人。",43:"能感受到别人的情绪。",44:"关心别人。",
45:"说真话。",46:"害怕成为注意的焦点。",47:"总是闲不住。",48:"更愿意待在熟悉的领域。",
49:"对人吼叫。",50:"付出的比人们期待的更多。",51:"很少放纵过度。",52:"主动寻求冒险。",
53:"回避哲学性的讨论。",54:"对自己的评价很高。",55:"会把计划付诸实施。",
56:"容易被事情压得喘不过气。",57:"过得很开心。",58:"认为世上没有绝对的是非对错。",
59:"同情境况比我差的人。",60:"做决定很鲁莽。",61:"害怕很多东西。",
62:"回避与别人的来往。",63:"喜欢做白日梦。",64:"相信别人说的话。",
65:"处理事情很顺手。",66:"容易发脾气。",67:"更喜欢独处。",68:"不喜欢诗歌。",
69:"占别人的便宜。",70:"房间里弄得乱七八糟。",71:"经常情绪低沉。",72:"掌控局面。",
73:"很少留意自己的情绪反应。",74:"对他人的感受漠不关心。",75:"违反规则。",
76:"只在熟人面前才感到自在。",77:"业余时间做很多事。",78:"不喜欢变化。",
79:"说别人难听的话。",80:"只做刚刚够交差的工作。",81:"很容易抵挡住诱惑。",
82:"喜欢不顾后果地玩乐。",83:"难以理解抽象的概念。",84:"自负。",85:"浪费自己的时间。",
86:"觉得自己无力应对事情。",87:"热爱生活。",88:"倾向于投票给保守派候选人。",
89:"对别人的难题不感兴趣。",90:"仓促行事。",91:"很容易感到有压力。",
92:"和别人保持距离。",93:"喜欢沉浸在自己的思绪里。",94:"不信任别人。",
95:"知道该怎样把事情做成。",96:"不容易被激怒。",97:"避开人群。",
98:"不喜欢去美术馆。",99:"阻碍别人的计划。",100:"东西随手乱放。",
101:"和自己相处得很自在。",102:"等别人来带头。",103:"不理解情绪激动的人。",
104:"不愿意为别人花时间。",105:"违背自己的承诺。",106:"不把尴尬的社交场面当回事。",
107:"喜欢清闲。",108:"习惯守着老一套。",109:"会报复别人。",
110:"在工作上花很少的时间和精力。",111:"能控制住自己的欲望。",112:"表现得疯疯癫癫。",
113:"对理论性的讨论没兴趣。",114:"夸耀自己的优点。",115:"很难开始着手做事。",
116:"在压力下仍能保持冷静。",117:"看到生活光明的一面。",118:"认为对犯罪应当从严处理。",
119:"尽量不去想那些需要帮助的人。",120:"做事不经过思考。",
}

FACET_ZH = {
"anxiety":"焦虑","anger":"愤怒易感性","depression":"抑郁倾向","self_consciousness":"自我意识","immoderation":"放纵","vulnerability":"脆弱性",
"friendliness":"友善","gregariousness":"合群","assertiveness":"支配性","activity_level":"活力水平","excitement_seeking":"寻求刺激","cheerfulness":"愉快度",
"imagination":"想象力","artistic_interests":"艺术兴趣","emotionality":"情绪感受","adventurousness":"冒险性","intellect":"思辨","liberalism":"开放性价值观",
"trust":"信任","morality":"坦率","altruism":"利他","cooperation":"合作","modesty":"谦逊","sympathy":"同情",
"self_efficacy":"自我效能","orderliness":"条理","dutifulness":"守责","achievement_striving":"成就追求","self_discipline":"自律","cautiousness":"审慎",
}

TRAIT_ZH = {"N":"神经质","E":"外向性","O":"开放性","A":"宜人性","C":"尽责性"}

src = json.loads(Path("research/ipip120.json").read_text(encoding="utf-8"))

assert set(ZH) == {i["id"] for i in src["items"]}, "translation coverage mismatch"
missing = [k for k in (i["facet"] for i in src["items"]) if k not in FACET_ZH]
assert not missing, missing

items = [
    {
        "id": i["id"],
        "t": i["trait"],
        "f": i["facet"],
        "r": 1 if i["reverse"] else 0,
        "zh": ZH[i["id"]],
        "en": i["text_en"],
    }
    for i in src["items"]
]

norms = src["norms"]

parts = []
parts.append("// AUTO-GENERATED from research/ipip120.json — do not edit by hand.\n"
             "// Item bank: International Personality Item Pool (public domain, P. John A. Johnson).\n"
             "// Norms + keying: https://github.com/NeuroQuestAi/five-factor-e (MIT).\n"
             "export const BIG5_META = " + json.dumps(src["meta"], ensure_ascii=False) + ";\n"
             "export const TRAIT_ZH = " + json.dumps(TRAIT_ZH, ensure_ascii=False) + ";\n"
             "export const FACET_ZH = " + json.dumps(FACET_ZH, ensure_ascii=False) + ";\n"
             "export const FACETS = " + json.dumps(src["facets"], ensure_ascii=False) + ";\n"
             "export const NORMS = " + json.dumps(norms, separators=(",", ":")) + ";\n"
             "export const BIG5_ITEMS = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n")

Path("assets/js/data-big5.js").parent.mkdir(parents=True, exist_ok=True)
Path("assets/js/data-big5.js").write_text("".join(parts), encoding="utf-8")
print("wrote assets/js/data-big5.js", Path("assets/js/data-big5.js").stat().st_size, "bytes")
print("reversed:", sum(i["r"] for i in items), "buckets:", len(norms))
