#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import io, re, json, subprocess

ROOT=Path(".")
MAX_BYTES=79000
MAX_WIDTH=800
EXTS={".jpg",".jpeg",".png",".webp"}
SKIP={".git","node_modules",".github"}
assets=[]
for p in ROOT.rglob("*"):
    if not p.is_file() or p.suffix.lower() not in EXTS or any(x in SKIP for x in p.parts):
        continue
    out=p if p.suffix.lower()==".webp" else p.with_suffix(".webp")
    with Image.open(p) as im:
        im.load()
        has_alpha=("A" in im.getbands()) or ("transparency" in im.info)
        im=im.convert("RGBA" if has_alpha else "RGB")
        if im.width>MAX_WIDTH:
            nh=round(im.height*MAX_WIDTH/im.width)
            im=im.resize((MAX_WIDTH,nh),Image.Resampling.LANCZOS)
        quality=84
        while True:
            buf=io.BytesIO()
            im.save(buf,format="WEBP",quality=quality,method=6)
            if len(buf.getvalue())<MAX_BYTES:
                break
            if quality>35:
                quality-=5
            elif im.width>320:
                nw=max(320,round(im.width*.88))
                nh=max(1,round(im.height*nw/im.width))
                im=im.resize((nw,nh),Image.Resampling.LANCZOS)
                quality=65
            else:
                raise RuntimeError(f"Cannot compress below 80KB: {p}")
        out.write_bytes(buf.getvalue())
        assets.append({"from":str(p),"to":str(out),"bytes":len(buf.getvalue()),"width":im.width,"height":im.height,"quality":quality})

# Update every in-repository text reference before removing original files.
text_exts={".html",".css",".js",".json",".webmanifest",".xml",".md",".txt"}
for f in ROOT.rglob("*"):
    if not f.is_file() or f.suffix.lower() not in text_exts or any(x in SKIP for x in f.parts):
        continue
    try: s=f.read_text(encoding="utf-8")
    except (UnicodeDecodeError,OSError): continue
    old=s
    for a in assets:
        s=s.replace(Path(a["from"]).name,Path(a["to"]).name)
    s=s.replace("image/jpeg","image/webp").replace("image/png","image/webp")
    if s!=old: f.write_text(s,encoding="utf-8")

for a in assets:
    if Path(a["from"]) != Path(a["to"]):
        Path(a["from"]).unlink()
report={"converted":len(assets),"total_bytes":sum(x["bytes"] for x in assets),"largest_bytes":max((x["bytes"] for x in assets),default=0),"assets":assets}
Path("image-optimization-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({k:report[k] for k in ("converted","total_bytes","largest_bytes")},ensure_ascii=False))
