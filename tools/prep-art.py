"""Prepare artwork for sidthaly.com.

Usage:  python3 tools/prep-art.py <image> <slug> <folder>
        e.g. python3 tools/prep-art.py ~/art/dragon.png dragon-queen covers

Writes images/<folder>/<slug>.jpg (1200 px on the long side) plus <slug>-1200.webp and <slug>-600.webp.
- Only web-size copies are published; the full-resolution original never goes on the site.
- All hidden metadata (camera, GPS, software, layers) is stripped.
- A copyright notice and the IPTC/PLUS "data mining prohibited" flag are embedded in every file.
"""
import sys, os, datetime
from PIL import Image, ImageOps

YEAR = datetime.date.today().year
NOTICE = f"© {YEAR} Sid Thaly. All rights reserved. Not licensed for AI training or data mining."
XMP = f"""<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about=""
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
  xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"
  xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
  xmpRights:Marked="True" xmpRights:WebStatement="https://sidthaly.com"
  photoshop:Credit="Sid Thaly"
  plus:DataMining="http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED">
 <dc:creator><rdf:Seq><rdf:li>Sid Thaly</rdf:li></rdf:Seq></dc:creator>
 <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">{NOTICE}</rdf:li></rdf:Alt></dc:rights>
 <xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="x-default">{NOTICE}</rdf:li></rdf:Alt></xmpRights:UsageTerms>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>""".encode("utf-8")

def exif():
    e = Image.Exif()
    e[0x013B] = "Sid Thaly"   # Artist
    e[0x8298] = NOTICE.replace("©", "(c)")   # Copyright (EXIF text is plain ASCII)
    return e.tobytes()

def clean(src):
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (12, 12, 16)); bg.paste(im, mask=im.split()[3]); im = bg
    # rebuild pixels into a fresh image so nothing from the original file is carried over
    out = Image.new("RGB", im.size); out.paste(im.convert("RGB")); return out

def fit(im, long_edge):
    w, h = im.size; s = min(1.0, long_edge / max(w, h))
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im.copy()

def main(src, slug, folder):
    base = os.path.join(os.path.dirname(__file__), "..", "images", folder); os.makedirs(base, exist_ok=True)
    im = clean(src)
    big = fit(im, 1200); small = fit(im, 600)
    big.save(os.path.join(base, f"{slug}.jpg"), "JPEG", quality=86, progressive=True, optimize=True, exif=exif(), xmp=XMP)
    big.save(os.path.join(base, f"{slug}-1200.webp"), "WEBP", quality=84, method=6, exif=exif(), xmp=XMP)
    small.save(os.path.join(base, f"{slug}-600.webp"), "WEBP", quality=82, method=6, exif=exif(), xmp=XMP)
    print(f"{slug}: {im.size[0]}x{im.size[1]} original -> {big.size[0]}x{big.size[1]} published, metadata cleaned and marked")

if __name__ == "__main__":
    if len(sys.argv) != 4: sys.exit(__doc__)
    main(*sys.argv[1:])
