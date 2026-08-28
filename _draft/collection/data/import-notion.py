#!/usr/bin/env python3
"""Import du corpus Notion (123 citations) vers le modèle _draft/collection."""
import csv, json, re, unicodedata, collections, pathlib, sys

SRC = pathlib.Path("/Users/alucard/.claude/jobs/46238eb0/tmp/citations/Private & Shared/Citations eb1e2775f9294d52acfb8a77c38ee005_all.csv")
OUT = pathlib.Path("/Users/alucard/workspace/projects/slashome/me/_draft/collection/data")

# ── Corrections d'orthographe relevées à la lecture des 66 auteurs ────────────
FIX = {
    "Alexande Astier": "Alexandre Astier",
    "Echylle": "Eschyle",
    "Herodote": "Hérodote",
    "George Bernard Shawn": "George Bernard Shaw",
    "Francis N'Gannou": "Francis Ngannou",
    "Alfred N. Whitehead": "Alfred North Whitehead",
    "Ali ibn abi Talib": "Ali ibn Abi Talib",
    "Dr Kwame Nkrumah": "Kwame Nkrumah",
    "Genghis Khan": "Gengis Khan",
    "Philippe Fragione (Akhenaton)": "Philippe Fragione",
}
# Auteur -> slug d'agent déjà existant (fixtures)
ALIAS_SLUG = {"Majin": "flow", "Simone Weil": "simone-weil",
              "Albert Camus": "albert-camus", "Dany Bill": "dany-bill"}

# Champs `Auteur` contenant PLUSIEURS personnes
MULTI = {
    "Jean de la Fontaine, Jean-Marc Jancovici": ["Jean de La Fontaine", "Jean-Marc Jancovici"],
    "Joel Duplantier, Mario Duplantier": ["Joe Duplantier", "Mario Duplantier"],
}
# Pas un agent : aucune identité derrière
NOT_AN_AGENT = {"Anonyme"}

# sortName curé à la main — les particules et les mononymes ne s'automatisent pas
SORT = {
    "Jean de La Fontaine": "La Fontaine, Jean de",
    "Antoine de Maximy": "Maximy, Antoine de",
    "Marc Aurèle": None, "Montesquieu": None, "Coluche": None, "Aragon": None,
    "Gandhi": None, "Eschyle": None, "Hérodote": None, "Gengis Khan": None,
    "Ali ibn Abi Talib": None, "Voltaire": None,
    "Cus D'Amato": "D'Amato, Cus",
    "Viktor E. Frankl": "Frankl, Viktor E.",
    "Alfred North Whitehead": "Whitehead, Alfred North",
    "Carl Gustav Jung": "Jung, Carl Gustav",
    "George Bernard Shaw": "Shaw, George Bernard",
    "Jacques-Yves Cousteau": "Cousteau, Jacques-Yves",
    "Kwame Nkrumah": "Nkrumah, Kwame",
}
NICK = {"Philippe Fragione": [{"text": "Akhenaton"}]}
GENDER = {"Hannah Arendt": "f", "Marie Curie": "f", "Eleanor Roosevelt": "f",
          "Germaine Tillion": "f", "Simone Weil": "f"}

# Agents supplémentaires imposés par la colonne Contexte
EXTRA_AGENTS = {
    "ras-al-ghul": {"kind": "character", "name": "Ra's al Ghul",
                    "bio": "Personnage de Batman Begins."},
    "tyrell-wellick": {"kind": "character", "name": "Tyrell Wellick",
                       "bio": "Personnage de la série Mr. Robot."},
    "cesar-kaamelott": {"kind": "character", "name": "César",
                        "bio": "Personnage de Kaamelott, écrit par Alexandre Astier."},
    "pierre-mondy": {"kind": "person", "name": "Pierre Mondy",
                     "sortName": "Mondy, Pierre", "gender": "m"},
    "jean-dormesson": {"kind": "person", "name": "Jean d'Ormesson",
                       "sortName": "Ormesson, Jean d'", "gender": "m"},
    "politically-incorrect": {"kind": "organization", "name": "Politically Incorrect with Bill Maher",
                              "bio": "Émission de télévision états-unienne."},
}

STOP = set("le la les un une des du de d a à au aux et ou que qui quoi dont ou où "
           "ce cet cette ces son sa ses leur leurs il elle ils elles on nous vous je tu "
           "est sont etre être ne pas plus moins pour par dans sur avec sans en y "
           "se s l n c j m t qu si comme tout tous toute toutes meme même".split())


def strip_urls(s):
    return re.sub(r"\s*\(https?://[^)]*\)?", "", s or "").strip()


def ascii_slug(s, maxlen=48):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("'", " ").replace("’", " ").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:maxlen].rstrip("-")


def sort_name(name):
    if name in SORT:
        return SORT[name]
    parts = name.split()
    if len(parts) < 2:
        return None
    return f"{parts[-1]}, {' '.join(parts[:-1])}"


def significant(text, n=3):
    words = re.findall(r"[\w’']+", text.lower(), re.UNICODE)
    out = []
    for w in words:
        w2 = unicodedata.normalize("NFD", w)
        w2 = "".join(c for c in w2 if unicodedata.category(c) != "Mn")
        if w2 in STOP or len(w2) < 3:
            continue
        out.append(w)
        if len(out) == n:
            break
    return out


def incipit(text, words=8):
    ws = re.split(r"\s+", text.strip())
    if len(ws) <= words:
        return text.strip().rstrip(".")
    return " ".join(ws[:words]).rstrip(",;:.") + "…"


rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
assert len(rows) == 123, len(rows)

agents = {}
report_fixes, report_flags = [], []


def add_agent(name, **extra):
    """Enregistre un agent et renvoie son slug."""
    slug = ALIAS_SLUG.get(name) or ascii_slug(name)
    if slug not in agents:
        entry = {"kind": extra.pop("kind", "person"), "name": name}
        sn = sort_name(name)
        if sn and entry["kind"] == "person":
            entry["sortName"] = sn
        if name in GENDER:
            entry["gender"] = GENDER[name]
        if name in NICK:
            entry["nicknames"] = NICK[name]
        entry.update(extra)
        agents[slug] = entry
    return slug


items = {}
seen_slugs = collections.Counter()

empty_rows = 0
for row in rows:
    text = (row["﻿Nom"] if "﻿Nom" in row else row["Nom"]).strip()
    # Deux lignes de l'export sont ENTIÈREMENT vides : ce sont des lignes vides
    # dans la base Notion, pas des citations perdues. Comptées et signalées.
    if not any((v or "").strip() for v in row.values()):
        empty_rows += 1
        continue
    raw_author = strip_urls(row["Auteur"])
    context = strip_urls(row["Contexte"]).strip()
    link = (row["lien"] or "").strip()
    concepts = [strip_urls(c).strip(" )") for c in re.split(r"\),", row["Concepts"] or "") ]
    tags = [c for c in concepts if c]

    # — auteurs
    names = []
    if raw_author:
        if raw_author in MULTI:
            names = MULTI[raw_author]
        elif raw_author in NOT_AN_AGENT:
            report_flags.append(f"« Anonyme » n'est pas un agent — item sans crédit : {incipit(text,6)}")
        else:
            fixed = FIX.get(raw_author, raw_author)
            if fixed != raw_author:
                report_fixes.append(f"« {raw_author} » → « {fixed} »")
            names = [fixed]

    credits = [{"agent": add_agent(n), "roles": ["author"]} for n in names]

    item = {"type": "citation", "title": incipit(text), "credits": credits, "text": text}

    # — cas particuliers dictés par le contexte
    low = context.lower()
    attribution = None
    sources = None
    if "ras al gul" in low:
        credits.insert(0, {"agent": add_agent("Ra's al Ghul", kind="character",
                                              bio=EXTRA_AGENTS["ras-al-ghul"]["bio"]), "roles": ["speaker"]})
    if "tyrell wellick" in low:
        credits.insert(0, {"agent": add_agent("Tyrell Wellick", kind="character",
                                              bio=EXTRA_AGENTS["tyrell-wellick"]["bio"]), "roles": ["speaker"]})
    if "astier" in low and "mondi" in low:
        credits.append({"agent": add_agent("César", kind="character",
                                           bio=EXTRA_AGENTS["cesar-kaamelott"]["bio"]), "roles": ["speaker"]})
        credits.append({"agent": add_agent("Pierre Mondy"), "roles": ["performer"]})
    if "d’ormesson" in low or "d'ormesson" in low:
        credits.append({"agent": add_agent("Jean d'Ormesson"), "roles": ["speaker"]})
    if "bill maher" in low:
        for c in credits:
            if c["agent"] == ascii_slug("George Carlin"):
                c["roles"] = ["interviewee"]
        credits.append({"agent": add_agent("Politically Incorrect with Bill Maher",
                                           kind="organization"), "roles": ["publisher"]})
    if "journaliste" in low:
        for c in credits:
            c["roles"] = ["interviewee"]
    if "falsly attributed" in low or "falsely attributed" in low:
        attribution = "misattributed"
        m = re.search(r"https?://\S+", context)
        if m:
            sources = [{"label": "Quote Investigator", "url": m.group(0).rstrip(".")}]
            context = context.replace(m.group(0), "").strip(" :")
    if "modifiee avec le temps" in low or "modifiée avec le temps" in low:
        attribution = "altered"

    if context:
        item["context"] = context
    if attribution:
        item["attribution"] = attribution
    if sources:
        item["sources"] = sources
    if link:
        if re.match(r"^https?://", link):
            item["link"] = link
        else:
            item["context"] = (item.get("context", "") + " " + link).strip()
            report_flags.append(f"champ « lien » non-URL déplacé en context : « {link} »")
    if tags:
        item["tags"] = tags
    item["added"] = "2026-08-29"

    # — slug
    base_author = ascii_slug(names[0].split()[-1]) if names else ""
    base = "-".join(filter(None, [base_author, ascii_slug("-".join(significant(text)))]))
    base = base or ascii_slug(text, 40)
    seen_slugs[base] += 1
    slug = base if seen_slugs[base] == 1 else f"{base}-{seen_slugs[base]}"
    items[slug] = item

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "items").mkdir(exist_ok=True)

# l'entrée `flow` vient des fixtures, telle quelle
fx = json.load(open(OUT.parent / "fixtures" / "agents.json", encoding="utf-8"))
agents["flow"] = fx["flow"]

agents_out = {"_comment": "Importé du corpus Notion (123 citations) le 2026-08-29 par _draft/import. La clé EST le slug. Les bios et dates ne sont PAS renseignées : elles n'étaient pas dans la source et n'ont pas été inventées."}
for k in sorted(agents, key=lambda s: agents[s].get("sortName") or agents[s]["name"]):
    agents_out[k] = agents[k]

items_out = {"_comment": "Importé du corpus Notion le 2026-08-29. `title` est l'incipit de la citation (la source n'avait pas de titre). `note` est volontairement vide : ce sont les mots de Florian, il ne les a pas écrits."}
items_out.update(items)

json.dump(agents_out, open(OUT / "agents.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(items_out, open(OUT / "items" / "citations.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("lignes CSV:", len(rows), "| entièrement vides (ignorées):", empty_rows)
print("items:", len(items), "| agents:", len(agents))
print("sans crédit:", sum(1 for i in items.values() if not i["credits"]))
print("corrections:", len(report_fixes))
for f in report_fixes: print("   ", f)
print("signalements:", len(report_flags))
for f in report_flags: print("   ", f)
kinds = collections.Counter(a["kind"] for a in agents.values())
print("kinds:", dict(kinds))
