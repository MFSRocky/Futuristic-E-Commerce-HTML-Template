"""Assemble the buyer package and marketplace ZIPs (author tool, not shipped).

release/
  NEXORA/                          ← main files folder (zipped as nexora-main-files-v1.0.0.zip)
    template/                      ← site with demo images replaced by placeholders
    documentation/index.html
    CREDITS.txt, README.txt
  nexora-main-files-v1.0.0.zip
  nexora-theme-preview.zip         ← 01_…590x300 + 02_…14_ previews (1170 px wide, ≤1500 px tall)
  nexora-thumbnail-80x80.png
  nexora-cover-2340x1560.jpg       ← 3:2 cover (Envato presentation spec, where a cover field is offered)
"""
import os, shutil, hashlib, zipfile, subprocess, glob, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REL = os.path.join(ROOT, 'release'); PKG = os.path.join(REL, 'NEXORA')
VERSION = '1.0.0'
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

shutil.rmtree(REL, ignore_errors=True); os.makedirs(PKG)
# 1. template (without demo photography)
shutil.copytree(os.path.join(ROOT, 'site'), os.path.join(PKG, 'template'), ignore=shutil.ignore_patterns('*.webp', '*.jpg', '*.jpeg', '*.png', '.DS_Store', 'Thumbs.db', 'documentation', 'vercel.json'))
subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'placeholders.py'), os.path.join(PKG, 'template', 'assets', 'images')], check=True)
# 2. docs + txt
shutil.copytree(os.path.join(ROOT, 'documentation'), os.path.join(PKG, 'documentation'))
for f in ('CREDITS.txt', 'README.txt', 'START-HERE.txt', 'CHANGELOG.md', 'LICENSE.txt'):
    shutil.copy(os.path.join(ROOT, 'pkg', f), PKG)

# 3. safety checks
demo_hashes = {sha(p) for p in glob.glob(os.path.join(ROOT, 'site', 'assets', 'images', '**', '*.*'), recursive=True) if not p.endswith('.svg')}
demo_hashes |= {sha(p) for p in glob.glob(os.path.join(ROOT, 'raw', '*'))}
problems = []
for p in glob.glob(os.path.join(PKG, '**', '*'), recursive=True):
    if os.path.isdir(p): continue
    rel = os.path.relpath(p, PKG)
    if sha(p) in demo_hashes: problems.append('DEMO IMAGE IN PACKAGE: ' + rel)
    if os.path.basename(p).startswith('.') or rel.endswith(('.py', '.map', '.log')): problems.append('UNWANTED FILE: ' + rel)
src_imgs = sorted(os.path.relpath(p, os.path.join(ROOT, 'site')) for p in glob.glob(os.path.join(ROOT, 'site', 'assets', 'images', '**', '*.*'), recursive=True))
pkg_imgs = sorted(os.path.relpath(p, os.path.join(PKG, 'template')) for p in glob.glob(os.path.join(PKG, 'template', 'assets', 'images', '**', '*.*'), recursive=True))
if src_imgs != pkg_imgs: problems.append('IMAGE SET MISMATCH: ' + str(set(src_imgs) ^ set(pkg_imgs)))
if problems: print('\n'.join(problems)); sys.exit(1)

# 4. zips (deterministic order, no hidden files)
def zipdir(src, out, arc_root):
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for base, dirs, files in os.walk(src):
            dirs.sort()
            for f in sorted(files):
                full = os.path.join(base, f); z.write(full, os.path.join(arc_root, os.path.relpath(full, src)))
zipdir(PKG, os.path.join(REL, f'nexora-main-files-v{VERSION}.zip'), 'NEXORA')
# preview spec gate (Envato: 01_ = 590x300; extras >= 570 wide (1170 recommended), <= 1500 tall, <= 20 MB; thumb 80x80; cover 3:2 >= 1170x780)
from PIL import Image
PV = os.path.join(ROOT, 'preview-assets')
prev = sorted(glob.glob(os.path.join(PV, 'theme-preview', '*.jpg')))
assert os.path.basename(prev[0]).startswith('01_') and Image.open(prev[0]).size == (590, 300), 'first preview must be 01_*.jpg 590x300'
for n, f in enumerate(prev, 1):
    w, h = Image.open(f).size
    assert os.path.basename(f).startswith(f'{n:02d}_'), f'preview numbering gap at {f}'
    assert n == 1 or (w >= 570 and h <= 1500), f'preview spec: {f} {w}x{h}'
    assert os.path.getsize(f) < 20 * 1024 * 1024
assert Image.open(os.path.join(PV, 'thumbnail', 'nexora-thumbnail-80x80.png')).size == (80, 80)
cover = os.path.join(PV, 'cover', 'nexora-cover-2340x1560.jpg'); cw, ch = Image.open(cover).size
assert cw * 2 == ch * 3 and cw >= 1170, 'cover must be 3:2, min 1170x780'
shutil.copy(cover, REL)
print(f'preview gate OK — {len(prev)} theme-preview images, cover {cw}x{ch}')
with zipfile.ZipFile(os.path.join(REL, 'nexora-theme-preview.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(glob.glob(os.path.join(ROOT, 'preview-assets', 'theme-preview', '*.jpg'))): z.write(f, os.path.basename(f))
shutil.copy(os.path.join(ROOT, 'preview-assets', 'thumbnail', 'nexora-thumbnail-80x80.png'), REL)
for f in sorted(os.listdir(REL)):
    p = os.path.join(REL, f)
    if os.path.isfile(p): print(f'{f}: {os.path.getsize(p)/1024:.0f} KB')
print('package OK — files:', sum(len(fs) for _, _, fs in os.walk(PKG)))
