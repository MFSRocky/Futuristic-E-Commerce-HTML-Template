"""Static audit: links, anchors, assets, ids, alts, labels, CSS class coverage (author QA tool)."""
import re, os, glob
from html.parser import HTMLParser
SITE = 'site'
pages = sorted(glob.glob(SITE + '/*.html'))
css = open(SITE + '/assets/css/style.css').read()
js = ''.join(open(f).read() for f in glob.glob(SITE + '/assets/js/*.js'))
css_classes = set(re.findall(r'\.(-?[_a-zA-Z][\w-]*)', re.sub(r'url\([^)]*\)', '', css)))
problems = []
class P(HTMLParser):
    def __init__(s): super().__init__(); s.tags = []; s.ids = []; s.classes = set(); s.h = []; s.labels_for = set(); s.inputs = []; s.cur_label = 0; s.text_btn = []
    def handle_starttag(s, t, a):
        a = dict(a); s.tags.append((t, a))
        if 'id' in a: s.ids.append(a['id'])
        for c in (a.get('class') or '').split(): s.classes.add(c)
        if re.match(r'h[1-6]$', t): s.h.append(int(t[1]))
        if t == 'label':
            s.cur_label += 1
            if a.get('for'): s.labels_for.add(a['for'])
        if t in ('input', 'select', 'textarea') and a.get('type') not in ('hidden', 'submit'):
            s.inputs.append((a, s.cur_label > 0))
    def handle_endtag(s, t):
        if t == 'label': s.cur_label -= 1
all_classes = set(); ids_by_page = {}
for pth in pages:
    html = open(pth).read(); p = P(); p.feed(html); name = os.path.basename(pth)
    ids_by_page[name] = set(p.ids); all_classes |= p.classes
    dup = {i for i in p.ids if p.ids.count(i) > 1}
    if dup: problems.append(f'{name}: duplicate ids {dup}')
    if p.h.count(1) != 1: problems.append(f'{name}: {p.h.count(1)} h1')
    for t, a in p.tags:
        if t == 'img' and 'alt' not in a: problems.append(f'{name}: img without alt {a.get("src")}')
        if t == 'img' and not (a.get('width') and a.get('height')): problems.append(f'{name}: img w/o dimensions {a.get("src")}')
        if t in ('a', 'link', 'script', 'img', 'source'):
            u = a.get('href') or a.get('src')
            if not u or u.startswith(('http', 'mailto:', 'tel:', 'data:', 'javascript')): continue
            path, _, frag = u.split('?')[0].partition('#')
            if path and not os.path.exists(os.path.join(SITE, path)): problems.append(f'{name}: broken {u}')
            if t == 'a' and u == '#': problems.append(f'{name}: dead href="#"')
        if t == 'a' and a.get('target') == '_blank' and 'noopener' not in (a.get('rel') or ''): problems.append(f'{name}: _blank w/o noopener')
    for a, wrapped in p.inputs:
        if not (wrapped or a.get('aria-label') or a.get('aria-labelledby') or a.get('id') in p.labels_for): problems.append(f'{name}: unlabeled {a.get("id") or a.get("name") or a}')
    # buttons w/o accessible name
    for m in re.finditer(r'<(button|a)\b([^>]*)>(.*?)</\1>', html, re.S):
        inner = re.sub(r'<svg.*?</svg>', '', m.group(3), flags=re.S); txt = re.sub(r'<[^>]+>', '', inner).strip()
        if not txt and 'aria-label' not in m.group(2) and 'aria-labelledby' not in m.group(2): problems.append(f'{name}: nameless <{m.group(1)}> {m.group(2)[:60]}')
# anchors (#frag) across pages
for pth in pages:
    for u in re.findall(r'href="([\w-]+\.html)#([\w-]+)"', open(pth).read()):
        if u[1] not in ids_by_page.get(u[0], set()): problems.append(f'{os.path.basename(pth)}: missing anchor {u[0]}#{u[1]}')
    for frag in re.findall(r'href="#([\w-]+)"', open(pth).read()):
        if frag not in ids_by_page[os.path.basename(pth)]: problems.append(f'{os.path.basename(pth)}: missing in-page anchor #{frag}')
# classes from JS templates
js_classes = set()
for m in re.finditer(r'class="([^"]+)"', js):
    for c in re.split(r'[\s\'"+]+', m.group(1)):
        if re.match(r'^[a-z][\w-]*$', c): js_classes.add(c)
for m in re.finditer(r"classList\.(?:add|toggle|remove)\('([\w-]+)'", js): js_classes.add(m.group(1))
used = all_classes | js_classes
IGNORE = {'js', 'sr-only'}
missing = sorted(c for c in used if c not in css_classes and c not in IGNORE)
print('PROBLEMS:', len(problems)); [print(' ', x) for x in problems[:60]]
print('CLASSES WITHOUT CSS RULE:', len(missing)); print(' ', ' '.join(missing))
