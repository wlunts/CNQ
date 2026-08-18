# -*- coding: utf-8 -*-
import json, re, sys

path = r"c:/Users/bongo/OneDrive/CNQ/services/china-factory-audit.html"
c = open(path, encoding="utf-8").read()
ok = True

def check(cond, msg):
    global ok
    print(("PASS" if cond else "FAIL") + ": " + msg)
    if not cond:
        ok = False

# 1. faq-item count == 13
check(len(re.findall(r'class="faq-item"', c)) == 13, "faq-item count == 13")

# 2. id uniqueness + sequence 1..13
ids = re.findall(r'id="audit-faq-(\d+)"', c)
check(len(ids) == 13, "audit-faq id count == 13")
check(ids == [str(i) for i in range(1, 14)], "audit-faq ids are 1..13 unique (got %s)" % ids)

# 3. no double period
check("documents.." not in c, "no 'documents..' double period")

# 4. JSON-LD parse
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', c, re.S)
check(m is not None, "JSON-LD script found")
if m:
    try:
        data = json.loads(m.group(1))
        graph = data.get("@graph", [])
        check(len(graph) >= 4, "@graph has >= 4 entities (got %d)" % len(graph))
        faq = next((g for g in graph if g.get("@type") == "FAQPage"), None)
        check(faq is not None, "FAQPage entity present")
        if faq:
            qs = faq.get("mainEntity", [])
            check(len(qs) == 13, "FAQPage mainEntity has 13 Questions (got %d)" % len(qs))
            names = [q.get("name") for q in qs]
            check(len(set(names)) == 13, "13 unique question names")
            # cross-check each Question name appears in visible HTML
            for q in qs:
                nm = q["name"]
                # HTML-escape & in name before search
                esc = nm.replace("&", "&amp;")
                check(esc in c, "Question in HTML: %s" % nm[:60])
        svc = next((g for g in graph if g.get("@type") == "Service"), None)
        if svc:
            asrv = svc.get("areaServed")
            check(isinstance(asrv, list), "areaServed is an array")
            if isinstance(asrv, list):
                countries = [a.get("name") for a in asrv]
                expect = ["China","Vietnam","Cambodia","Thailand","Indonesia","India","Pakistan","Sri Lanka","Bangladesh"]
                check(countries == expect, "areaServed countries correct (got %s)" % countries)
    except Exception as e:
        check(False, "JSON-LD parse error: %s" % e)

sys.exit(0 if ok else 1)
