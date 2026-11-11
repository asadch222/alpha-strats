"""Builds the blog pages from the article files in this folder.

Run from the project folder:   python3 blog/build.py

Each article in posts-*.md starts with a line:
    === address-name | Category | Title
followed by a summary line starting with ">", then the text.
In the text: "## " starts a section heading, "- " a bullet, "1. " a numbered item, **bold** is bold.
"""
import glob, html, re, os

V = '20'                      # bump when styles or scripts change, so browsers reload them
DATE = 'November 2026'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def inline(t):
    t = html.escape(t, quote=False)
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)

def render(body):
    out, mode = [], None
    def close():
        nonlocal mode
        if mode: out.append(f'</{mode}>'); mode = None
    for line in body.strip().split('\n'):
        s = line.strip()
        if not s: close(); continue
        if s.startswith('## '): close(); out.append(f'<h2>{inline(s[3:])}</h2>')
        elif s.startswith('- '):
            if mode != 'ul': close(); out.append('<ul>'); mode = 'ul'
            out.append(f'<li>{inline(s[2:])}</li>')
        elif re.match(r'\d+\. ', s):
            if mode != 'ol': close(); out.append('<ol>'); mode = 'ol'
            item = re.sub(r"^\d+\. ", "", s)
            out.append(f'<li>{inline(item)}</li>')
        else: close(); out.append(f'<p>{inline(s)}</p>')
    close()
    return '\n'.join(out)

posts = []
for f in sorted(glob.glob(os.path.join(ROOT, 'blog', 'posts-*.md'))):
    for chunk in open(f).read().split('\n=== ')[0:]:
        chunk = chunk.lstrip('= ').strip()
        if not chunk: continue
        head, rest = chunk.split('\n', 1)
        slug, cat, title = [x.strip() for x in head.split('|', 2)]
        summary, body = rest.strip().split('\n', 1)
        words = len(re.findall(r'\w+', body))
        posts.append(dict(slug=slug, cat=cat, title=title, summary=summary.lstrip('> ').strip(), body=body, words=words, mins=max(3, round(words / 200))))

def page(name, title, desc, body, page_id='blog'):
    open(os.path.join(ROOT, name), 'w').write(f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<link rel="icon" type="image/svg+xml" href="logo.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css?v={V}">
</head>
<body data-page="{page_id}" data-live="off">
<script src="layout.js?v={V}"></script>

<main id="top">
{body}
</main>

<script>renderFooter()</script>
<script src="config.js?v={V}"></script>
<script src="auth.js?v={V}"></script>
</body>
</html>
''')

def card(p):
    tone = 'c' if p['cat'] == 'Crypto' else 's'
    return f'''<a class="panel bcard" data-cat="{p['cat']}" href="blog-{p['slug']}.html"><span class="bcat {tone}">{p['cat']}</span><h3>{html.escape(p['title'])}</h3><p>{html.escape(p['summary'])}</p><em>{p['mins']} min read · Advanced</em></a>'''

# ---- one page per article
for p in posts:
    related = [q for q in posts if q['cat'] == p['cat'] and q is not p][:3]
    tone = 'c' if p['cat'] == 'Crypto' else 's'
    body = f'''<article class="post">
  <a class="post-back" href="blog.html">← All articles</a>
  <span class="bcat {tone}">{p['cat']}</span>
  <h1>{html.escape(p['title'])}</h1>
  <p class="post-sum">{html.escape(p['summary'])}</p>
  <p class="post-meta">AlphaStrats Research · {DATE} · {p['mins']} min read · Advanced</p>
  <div class="post-body">
{render(p['body'])}
  </div>
  <p class="note post-note">This article is education, not financial advice. It describes how markets tend to behave; it does not predict what any market will do. Trading involves risk of loss.</p>
  <div class="panel cta-band"><div><h3>See these ideas on live markets</h3><p>Open any coin or stock for a live chart, funding, open interest and a plain-English reading.</p></div><a class="btn btn-primary" href="chart.html">Open a live chart</a></div>
</article>
<section class="section">
  <div class="section-head"><div><h2>Keep reading</h2></div><a class="btn btn-ghost" href="blog.html">All articles</a></div>
  <div class="bgrid">{''.join(card(q) for q in related)}</div>
</section>'''
    page(f"blog-{p['slug']}.html", f"{p['title']} — AlphaStrats", p['summary'], body)

# ---- index
cats = ['All'] + sorted({p['cat'] for p in posts})
index = f'''<section class="phero small">
  <p class="eyebrow">Blog</p>
  <h1>Research and guides for serious traders.</h1>
  <p class="lede">{len(posts)} in-depth articles on crypto and US stocks: positioning, volatility, market structure and risk. Written to be understood, not to impress.</p>
</section>
<section class="section tight">
  <div class="seg" id="blogSeg">{''.join(f'<button class="{"is-active" if c == "All" else ""}" data-c="{c}">{c}{"" if c == "All" else " (" + str(sum(1 for p in posts if p["cat"] == c)) + ")"}</button>' for c in cats)}</div>
  <div class="bgrid" id="blogGrid" style="margin-top:18px">{''.join(card(p) for p in posts)}</div>
</section>
<script>
document.getElementById('blogSeg').addEventListener('click', function (e) {{
  var b = e.target.closest('button'); if (!b) return;
  this.querySelectorAll('button').forEach(function (x) {{ x.classList.toggle('is-active', x === b); }});
  document.querySelectorAll('#blogGrid .bcard').forEach(function (c) {{ c.hidden = b.dataset.c !== 'All' && c.dataset.cat !== b.dataset.c; }});
}});
</script>'''
page('blog.html', 'Blog: crypto and US stock research — AlphaStrats', 'In-depth articles on crypto and US stock trading: funding, open interest, volatility, leveraged ETFs, earnings, breadth and risk.', index)
print(len(posts), 'articles,', sum(p['words'] for p in posts), 'words')
