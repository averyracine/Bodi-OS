"""Builds a single-file, clickable preview of the CV Capital site from the running production server."""
import base64, io, json, re, sys, urllib.request, urllib.parse
from bs4 import BeautifulSoup, Comment
from PIL import Image

import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else HERE
PUBLIC = os.path.abspath(os.path.join(HERE, "..", "..", "public"))
BASE = "http://localhost:5000"
OUT = os.path.join(OUTDIR, "cv-capital-site-preview.html")

TOKEN = os.environ["CV_SESSION_TOKEN"]  # a valid CRM session token (see README)
def get(path, auth=False):
    req = urllib.request.Request(BASE + path, headers={"Cookie": "cv_session=" + TOKEN} if auth else {})
    return urllib.request.urlopen(req).read().decode("utf-8")

def route_name(path):
    path = path.split("#")[0].split("?")[0]
    if path in ("", "/"):
        return "home"
    return path.strip("/").replace("/", "-")

paths = re.findall(r"<loc>https?://[^/<]+(/[^<]*)</loc>", get("/sitemap.xml"))
paths = ["/"] + [p for p in paths if p not in ("", "/")]
routes = {route_name(p) for p in paths}

_img_cache = {}
def data_uri(local_path, width=1400, q=74):
    if local_path in _img_cache:
        return _img_cache[local_path]
    im = Image.open(PUBLIC + local_path).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    uri = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    _img_cache[local_path] = uri
    return uri

def clean(node):
    for s in node.find_all("script"):
        s.decompose()
    for c in node.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for img in node.find_all("img"):
        src = img.get("src", "")
        if src.startswith("/_next/image"):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(src).query)
            src = q["url"][0]
        if src.startswith("/"):
            img["src"] = data_uri(src)
        for a in ("srcset", "sizes", "data-nimg"):
            if a in img.attrs and a != "sizes":
                del img[a]
        if "sizes" in img.attrs:
            del img["sizes"]
    for a in node.find_all("a"):
        href = a.get("href", "")
        if href.startswith("/") and not href.startswith("//"):
            path, _, frag = href.partition("#")
            name = route_name(path)
            if name in routes:
                a["href"] = "#" + name
                if frag:
                    a["data-scroll"] = frag
        elif href.startswith("#") and href[1:] not in routes:
            a["data-scroll"] = href[1:]
    return node

pages = {}
titles = {}
header_home = header_solid = footer = mobilebar = None
for p in paths:
    html = get(p)
    soup = BeautifulSoup(html, "html.parser")
    name = route_name(p)
    titles[name] = soup.title.get_text() if soup.title else "CV Capital"
    main = clean(soup.find("main"))
    pages[name] = main.decode_contents()
    if name == "home":
        header_home = clean(soup.find("header")).decode_contents()
        footer = str(clean(soup.find("footer")))
        bar = soup.find("div", class_="sm:hidden")
        mobilebar = str(clean(bar))
    if name == "services":
        header_solid = clean(soup.find("header")).decode_contents()

_home = get("/")
_css_href = re.search(r'/_next/static/css/[^"]+\.css', _home).group(0)
# ---------------- CRM ----------------
crm_pages, crm_titles = {}, {}
crm_shell = {}
queue, seen = ["/crm"], set()
while queue:
    p = queue.pop(0)
    if p in seen: continue
    seen.add(p)
    html = get(p, auth=True)
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        h = a["href"].split("?")[0].split("#")[0]
        if h.startswith("/crm") and not h.startswith("/crm/login") and h not in seen:
            queue.append(h)
    name = route_name(p)
    routes.add(name)
    crm_titles[name] = soup.title.get_text() if soup.title else "CRM"
    lay = soup.find("main").parent
    crm_pages[name] = soup.find("main")
    if p == "/crm":
        crm_shell = {"aside": lay.find("aside", recursive=False), "mhead": lay.find("header", recursive=False), "bnav": lay.find("nav", recursive=False)}
for k in list(crm_pages):
    crm_pages[k] = clean(crm_pages[k]).decode_contents()
for k in crm_shell:
    crm_shell[k] = str(clean(crm_shell[k]))
titles.update(crm_titles)

css = get(_css_href)
css = re.sub(r"@font-face\{[^}]*\}", "", css)
css = re.sub(r"\.__variable_[a-z0-9]+\{[^}]*\}", "", css)

extra_css = """
:root{--font-display:"Newsreader",ui-serif,Georgia,serif;--font-body:"Instrument Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
body{background:var(--color-paper);color:var(--color-ink);font-size:16px}
header.sticky{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:70;background:#161513}
.pv-strip{background:#161513;color:rgba(245,242,237,.82);font:500 12.5px/1.4 var(--font-body);text-align:center;padding:8px 16px}
.pv-strip b{color:#fff;font-weight:600}
.pv-strip a{color:#fff;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
#pv-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#161513;color:#f5f2ed;padding:10px 16px;border-radius:999px;font:500 14px/1.3 var(--font-body);opacity:0;pointer-events:none;transition:opacity .2s;z-index:80;max-width:calc(100vw - 32px);text-align:center}
#pv-toast.on{opacity:1}
@media (min-width:1024px){#pv-toast{bottom:24px}}
.pv-demo{margin-top:16px;border-radius:10px;background:var(--color-sand-100);padding:12px 14px;font-size:13px;color:var(--color-stone)}
main{min-height:60vh}
"""

pricing = [
    {"key": "kitchen", "label": "Kitchen remodel", "sizeLabel": "Kitchen size", "sizes": ["Small (under 150 sq ft)", "Medium (150–250 sq ft)", "Large (250+ sq ft)"], "startingAt": 17000, "range": None},
    {"key": "bathroom", "label": "Bathroom remodel", "sizeLabel": "Bathroom type", "sizes": ["Powder room", "Guest / hall bath", "Primary bath"], "startingAt": 7500, "range": None},
    {"key": "wholeHome", "label": "Whole-home renovation", "sizeLabel": "Home size", "sizes": ["Under 1,800 sq ft", "1,800–3,000 sq ft", "3,000–4,500 sq ft", "4,500+ sq ft"], "startingAt": 50000, "range": [50000, 500000]},
    {"key": "addition", "label": "Home addition", "sizeLabel": "Addition size", "sizes": ["Under 400 sq ft", "400–800 sq ft", "800+ sq ft"], "startingAt": 50000, "range": None},
    {"key": "adu", "label": "ADU / casita", "sizeLabel": "Unit size", "sizes": ["Studio (under 450 sq ft)", "1 bed (450–750 sq ft)", "2 bed (750+ sq ft)"], "startingAt": 75000, "range": None},
    {"key": "customHome", "label": "Ground-up custom home", "sizeLabel": "Home size", "sizes": ["Under 3,000 sq ft", "3,000–5,000 sq ft", "5,000+ sq ft"], "startingAt": None, "range": None},
    {"key": "outdoor", "label": "Outdoor living (patio, pergola, outdoor kitchen)", "sizeLabel": "Scope", "sizes": ["Single feature", "Several features", "Full backyard"], "startingAt": None, "range": None},
    {"key": "commercial", "label": "Commercial / tenant improvement", "sizeLabel": "Space size", "sizes": ["Under 2,000 sq ft", "2,000–10,000 sq ft", "10,000+ sq ft"], "startingAt": None, "range": None},
]
finishes = [
    {"key": "essential", "label": "Essential", "description": "Quality materials, functional improvements, clean finishes and efficient construction."},
    {"key": "premium", "label": "Premium", "description": "Custom cabinetry, upgraded fixtures, stone countertops, designer finishes and bigger layout changes."},
    {"key": "luxury", "label": "Luxury / Bespoke", "description": "Fully custom interiors, natural stone, architectural changes and high-end materials throughout."},
]
disclaimer = "This is a planning-level figure, not a quote. Every property is unique. Final pricing depends on scope, square footage, material selections, site access, permits and complexity, and is set in a written proposal after an on-site consultation. Starting prices apply to qualifying project scopes."

nav = [("Home", "home"), ("Services", "services"), ("Projects", "projects"), ("Process", "process"), ("Why CV", "why-cv"),
       ("Our Story", "our-story"), ("Financing", "financing"), ("FAQ", "faq"), ("Contact", "contact")]

script = open(HERE + "/preview.js").read()
data = {"titles": titles, "headerHome": header_home, "headerSolid": header_solid, "pricing": pricing,
        "finishes": finishes, "disclaimer": disclaimer, "nav": nav}

templates = "\n".join(f'<template id="r-{n}">{h}</template>' for n, h in pages.items())
templates += "\n" + "\n".join(f'<template id="r-{n}" data-crm="1">{h}</template>' for n, h in crm_pages.items())
crm_script = open(HERE + "/crm.js").read()

out = f"""<title>CV Capital Site Preview</title>
<meta name="description" content="Clickable preview of the new builtbycv.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300&family=Instrument+Sans:wght@400;500;600&display=swap">
<style>{css}{extra_css}</style>
<div id="pv-site">
<div class="pv-strip"><b>Preview</b> of the new builtbycv.com · Forms show a demo result and don't send anything · <a href="#crm">See the team CRM demo →</a></div>
<header class="sticky top-0 z-50 transition-colors duration-300 border-b border-line bg-paper/95 text-ink backdrop-blur" id="pv-header"></header>
<div id="pv-menu-slot"></div>
<main id="main"></main>
{footer}
{mobilebar}
</div>
<div id="pv-crm" hidden class="min-h-screen bg-sand-50 text-ink">
<div class="pv-strip"><b>Demo CRM</b> with sample customers · Changes aren't saved · <a href="#home">← Back to the website</a></div>
<div class="lg:grid lg:min-h-screen lg:grid-cols-[15rem_1fr]">
{crm_shell["aside"]}
{crm_shell["mhead"]}
<main id="crm-main" class="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 [&_.grid>*]:min-w-0"></main>
{crm_shell["bnav"]}
</div>
<div id="pv-toast" role="status" aria-live="polite"></div>
</div>
{templates}
<script id="pv-data" type="application/json">{json.dumps(data).replace("</", "<\\/")}</script>
<script>{crm_script}</script>
<script>{script}</script>
"""
open(OUT, "w").write(out)
print(f"{len(out)/1e6:.2f} MB, {len(pages)} pages")
