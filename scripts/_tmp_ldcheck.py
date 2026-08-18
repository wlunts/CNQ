import re, json, sys
sys.stdout.reconfigure(encoding='utf-8')

files = [
    r'tools/aql-calculator/index.html',
    r'tools/inspection-cost-calculator.html',
    r'tools/lead-time-calculator.html',
]
pat = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
for f in files:
    print('=' * 70)
    print(f)
    s = open(f, encoding='utf-8').read()
    for i, b in enumerate(pat.findall(s)):
        try:
            d = json.loads(b)
        except Exception as e:
            print(f'  block{i}: PARSE ERROR {e}'); continue
        if '@graph' in d:
            for n in d['@graph']:
                print(f'  @graph node: @type={n.get("@type")} @id={n.get("@id")}')
                if n.get('@type') == 'WebApplication':
                    print('    mainEntityOfPage:', json.dumps(n.get('mainEntityOfPage'))[:200])
                    print('    isPartOf:', json.dumps(n.get('isPartOf'))[:100])
                    print('    publisher:', json.dumps(n.get('publisher'))[:100])
        else:
            print('  standalone:', d.get('@type'), '| mainEntity:', json.dumps(d.get('mainEntity'))[:150])
