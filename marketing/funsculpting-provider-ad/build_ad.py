#!/usr/bin/env python3
"""Render the FunSculpting provider ad from the October iPhone footage.

Run from (or point --src at) the `new ad october` folder:

    python3 build_ad.py --src "path/to/new ad october"            # everything
    python3 build_ad.py --src ... --dry-run                         # resolved EDL + runtimes only
    python3 build_ad.py --src ... --cuts short --formats 9x16       # one deliverable

Pipeline (originals are only ever read):
  1. Resolve cut points: word timestamps from tx_vad.json or local whisper when available,
     otherwise the VAD boundaries in edl.json padded by 0.1 s.
  2. SDR intermediates of the selected ranges only: HLG/PQ tone map, light grade, 30 fps,
     punch-ins, CRF 16, per-clip audio cleanup with 10 ms declick fades.
  3. Concatenate, two-pass loudnorm to -14 LUFS.
  4. Per format: b-roll cutaways, reframe (4:5 crop, 16:9 blurred fill), PNG overlays,
     end card, ASS captions with highlighted keywords. H.264 High CRF 18, AAC 192k, faststart.
  5. SRT + CMX3600 EDL per cut, plus the rationale / claim notes, into FunSculpting_Ad_Final/.

Needs ffmpeg/ffprobe built with libzimg (zscale), libass and libx264, and Python 3.8+ with Pillow.
Optional: faster-whisper or openai-whisper for word-level cuts and captions.
"""
import argparse
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
CLIP_RE = re.compile(r"IMG_?(\d{4})", re.I)
FORMATS = {"9x16": (1080, 1920), "4x5": (1080, 1350), "16x9": (1920, 1080)}
CROP_4X5_Y = 0.40  # where the 4:5 window sits in the 9:16 frame (0 = top, 1 = bottom); faces sit high
PAD = 0.10

TONEMAP = {
    "arib-std-b67": "zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,"
                    "format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv",
    "smpte2084": "zscale=tin=smpte2084:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,"
                 "format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv",
}
BT709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]

# Layout per canvas: caption size / bottom margin / side margin, headline top y, headline size.
LAYOUT = {
    "9x16": dict(cap_size=72, cap_margin_v=520, cap_margin_lr=90, head_y=300, head_size=78),
    "4x5":  dict(cap_size=58, cap_margin_v=150, cap_margin_lr=90, head_y=90, head_size=68),
    "16x9": dict(cap_size=50, cap_margin_v=70, cap_margin_lr=480, head_y=70, head_size=60),
}

FONT_CANDIDATES = [
    "~/Library/Fonts/Montserrat-ExtraBold.ttf", "~/Library/Fonts/Montserrat-Bold.ttf",
    "/Library/Fonts/Montserrat-ExtraBold.ttf", "/Library/Fonts/Montserrat-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


# ---------------------------------------------------------------- helpers

def run(cmd, quiet=True):
    print("  $", " ".join(str(c) if " " not in str(c) else f'"{c}"' for c in cmd)[:300])
    res = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if res.returncode != 0:
        sys.stderr.write(res.stderr[-4000:])
        raise SystemExit(f"command failed ({res.returncode}): {cmd[0]}")
    return res


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams",
                          "-show_format", str(path)], capture_output=True, text=True, check=True).stdout
    info = json.loads(out)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    rot = 0
    for sd in v.get("side_data_list", []):
        if "rotation" in sd:
            rot = int(sd["rotation"])
    rot = rot or int(v.get("tags", {}).get("rotate", 0))
    w, h = v["width"], v["height"]
    if abs(rot) % 180 == 90:
        w, h = h, w
    return {"w": w, "h": h, "transfer": v.get("color_transfer", ""), "duration": float(info["format"]["duration"]),
            "audio": any(s["codec_type"] == "audio" for s in info["streams"])}


def find_clip(src, clip):
    for ext in ("MOV", "mov", "MP4", "mp4"):
        p = src / f"IMG_{clip}.{ext}"
        if p.exists():
            return p
    return None


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ass_color(h):
    r, g, b = hex_rgb(h)
    return f"&H00{b:02X}{g:02X}{r:02X}"


def tc(seconds, fps):
    f = int(round(seconds * fps))
    return f"{f // (3600 * fps):02d}:{f // (60 * fps) % 60:02d}:{f // fps % 60:02d}:{f % fps:02d}"


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def ass_time(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def norm(word):
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("\u2019", "'"))


# ---------------------------------------------------------------- word timings

def load_transcript(path):
    """Collect word- and segment-level timings per clip from tx_vad.json, whatever its nesting."""
    words, segs = {}, {}
    if not path.exists():
        return words, segs

    def walk(node, clip):
        if isinstance(node, dict):
            for k in ("file", "clip", "name", "path", "source", "id", "audio"):
                v = node.get(k)
                if isinstance(v, str) and CLIP_RE.search(v):
                    clip = CLIP_RE.search(v).group(1)
            has_t = isinstance(node.get("start"), (int, float)) and isinstance(node.get("end"), (int, float))
            if clip and has_t and isinstance(node.get("word"), str):
                words.setdefault(clip, []).append((float(node["start"]), float(node["end"]), node["word"].strip()))
                return
            if clip and has_t and isinstance(node.get("text"), str):
                segs.setdefault(clip, []).append((float(node["start"]), float(node["end"]), node["text"].strip()))
            for k, v in node.items():
                m = CLIP_RE.search(k) if isinstance(k, str) else None
                walk(v, m.group(1) if m else clip)
        elif isinstance(node, list):
            for v in node:
                walk(v, clip)

    walk(json.loads(path.read_text()), None)
    for d in (words, segs):
        for k in d:
            d[k] = sorted(set(d[k]))
    return words, segs


class Whisper:
    def __init__(self, model_name, cache_dir):
        self.model_name, self.cache, self.model, self.kind = model_name, cache_dir, None, None
        try:
            import faster_whisper  # noqa: F401
            self.kind = "faster"
        except ImportError:
            try:
                import whisper  # noqa: F401
                self.kind = "openai"
            except ImportError:
                pass

    def words(self, clip, path):
        cache = self.cache / f"IMG_{clip}.words.json"
        if cache.exists():
            return [tuple(w) for w in json.loads(cache.read_text())]
        if not self.kind:
            return None
        wav = self.cache / f"IMG_{clip}.16k.wav"
        run(["ffmpeg", "-y", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "16000", wav])
        print(f"  whisper ({self.kind}, {self.model_name}) on IMG_{clip}")
        out = []
        if self.kind == "faster":
            from faster_whisper import WhisperModel
            self.model = self.model or WhisperModel(self.model_name, compute_type="int8")
            segments, _ = self.model.transcribe(str(wav), language="en", word_timestamps=True)
            out = [(w.start, w.end, w.word.strip()) for s in segments for w in s.words]
        else:
            import whisper
            self.model = self.model or whisper.load_model(self.model_name)
            res = self.model.transcribe(str(wav), language="en", word_timestamps=True)
            out = [(w["start"], w["end"], w["word"].strip()) for s in res["segments"] for w in s.get("words", [])]
        cache.write_text(json.dumps(out))
        return out


def find_phrase(words, phrase, lo, hi, last=False):
    """Index range of `phrase` inside words whose start lies in [lo, hi]."""
    target = [norm(t) for t in phrase.split() if norm(t)]
    toks = [norm(w[2]) for w in words]
    hits = []
    for i in range(len(words) - len(target) + 1):
        if lo <= words[i][0] <= hi and toks[i:i + len(target)] == target:
            hits.append((i, i + len(target) - 1))
    if not hits:
        return None
    return hits[-1] if last else hits[0]


# ---------------------------------------------------------------- EDL resolution

def resolve(edl, src, cut_name, word_source):
    cut = edl["cuts"][cut_name]
    have_words = {}
    segments = []
    for sid in cut["sequence"]:
        seg = dict(edl["segments"][sid], id=sid)
        clip = seg["clip"]
        path = find_clip(src, clip)
        if path is None:
            raise SystemExit(f"missing source IMG_{clip}.MOV in {src}")
        if clip not in have_words:
            have_words[clip] = word_source(clip, path)
        words = have_words[clip]
        if seg.get("fallback_only") and words:
            continue
        if seg.get("requires_words") and not words:
            continue
        seg["path"] = path
        seg["words"] = None
        if words and seg.get("start_text"):
            a = find_phrase(words, seg["start_text"], seg["in"] - 0.5, seg["out"])
            b = find_phrase(words, seg["end_text"], seg["in"], seg["out"] + 0.5, last=False) if a else None
            if not (a and b and b[1] >= a[0]):
                raise SystemExit(f"{sid}: could not find '{seg['start_text']}' .. '{seg['end_text']}' in IMG_{clip} words; "
                                 f"fix start_text/end_text in edl.json")
            span = words[a[0]:b[1] + 1]
        elif words:
            span = [w for w in words if seg["in"] - 0.05 <= (w[0] + w[1]) / 2 <= seg["out"] + 0.05]
        else:
            span = []
        if span:
            seg["tin"] = max(0.0, span[0][0] - PAD)
            seg["tout"] = span[-1][1] + PAD
            seg["words"] = span
        else:
            seg["tin"], seg["tout"] = max(0.0, seg["in"] - PAD), seg["out"] + PAD
        segments.append(seg)

    fps = edl["fps"]
    t = 0.0
    for seg in segments:
        seg["frames"] = int(round((seg["tout"] - seg["tin"]) * fps))
        seg["dur"] = seg["frames"] / fps
        seg["start"] = t
        t += seg["dur"]
    end_frames = int(round(cut["end_card_seconds"] * fps))
    return segments, {"start": t, "frames": end_frames, "dur": end_frames / fps}, t + end_frames / fps


# ---------------------------------------------------------------- video steps

def video_chain(info, grade, punch=None):
    parts = [TONEMAP[info["transfer"]]] if info["transfer"] in TONEMAP else []
    parts += [grade, "fps=30"]
    if punch:
        parts.append(f"crop=iw/{punch}:ih/{punch}:(iw-ow)/2:(ih-oh)*0.35")
    return ",".join(p for p in parts if p)


def fit_portrait(label_in, label_out, w=1080, h=1920):
    """Cover-fit; landscape sources get a blurred fill instead of a stretch or a hard crop."""
    return (f"[{label_in}]split[fa][fb];"
            f"[fa]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},gblur=sigma=40,eq=brightness=-0.08[fbg];"
            f"[fb]scale={w}:{h}:force_original_aspect_ratio=decrease[ffg];"
            f"[fbg][ffg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[{label_out}]")


def x264(crf, preset="medium"):
    return ["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p", *BT709]


def make_intermediate(seg, edl, out, force):
    if out.exists() and not force:
        return
    info = probe(seg["path"])
    punch = edl["punch_in"] if seg.get("punch") else None
    d = seg["dur"]
    vf = (f"[0:v]{video_chain(info, edl['grade'], punch)},scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[v]")
    if info["audio"]:
        af = (f"[0:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,afftdn=nf=-25,"
              f"acompressor=threshold=-20dB:ratio=3:attack=5:release=150:makeup=2,"
              f"atrim=duration={d:.4f},apad=whole_dur={d:.4f},"
              f"afade=t=in:d=0.01,afade=t=out:st={d - 0.01:.4f}:d=0.01[a]")
        amap = ["-map", "[a]"]
    else:
        af, amap = f"anullsrc=r=48000:cl=stereo,atrim=duration={d:.4f}[a]", ["-map", "[a]"]
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{seg['tin']:.4f}", "-i", seg["path"], "-t", f"{d + 0.5:.4f}",
         "-filter_complex", f"{vf};{af}", "-map", "[v]", *amap, "-frames:v", seg["frames"],
         *x264(16), "-c:a", "pcm_s16le", "-ar", "48000", out])


def make_broll(b, src, edl, out, force):
    if out.exists() and not force:
        return
    path = find_clip(src, b["clip"])
    info = probe(path)
    frames = int(round((b["out"] - b["in"]) * edl["fps"]))
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{b['in']:.4f}", "-i", path, "-t", f"{b['out'] - b['in'] + 0.5:.4f}",
         "-filter_complex", f"[0:v]{video_chain(info, edl['grade'])}[s];" + fit_portrait("s", "v"),
         "-map", "[v]", "-an", "-frames:v", frames, *x264(16), out])


def make_end_background(edl, src, end, out, force):
    if out.exists() and not force:
        return
    ec, d = edl["end_card"], end["dur"]
    navy = edl["brand"]["navy"].lstrip("#")
    path = find_clip(src, ec["background_clip"]) if ec.get("background_clip") else None
    if path:
        info = probe(path)
        vf = (f"[0:v]{video_chain(info, edl['grade'])},trim=end_frame=1,loop=loop={end['frames']}:size=1,"
              f"setpts=N/30/TB[s];" + fit_portrait("s", "f") + ";[f]gblur=sigma=25[v]")
        inputs = ["-ss", f"{ec['background_at']:.3f}", "-i", path]
    else:
        vf, inputs = f"color=c=0x{navy}:s=1080x1920:r=30[v]", []
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex",
         f"{vf};anullsrc=r=48000:cl=stereo,atrim=duration={d:.4f}[a]",
         "-map", "[v]", "-map", "[a]", "-frames:v", end["frames"], *x264(16), "-c:a", "pcm_s16le", out])


def assemble(parts, work, name, force):
    program = work / f"{name}_program.mkv"
    audio = work / f"{name}_program_audio.wav"
    if program.exists() and audio.exists() and not force:
        return program, audio
    lst = work / f"{name}_concat.txt"
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", program])
    ln = "loudnorm=I=-14:TP=-1.5:LRA=11"
    res = subprocess.run(["ffmpeg", "-hide_banner", "-i", program, "-vn", "-af", f"{ln}:print_format=json",
                          "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(res.stderr[res.stderr.rindex("{"):res.stderr.rindex("}") + 1])
    run(["ffmpeg", "-y", "-v", "error", "-i", program, "-vn", "-af",
         f"{ln}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
         f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000",
         "-c:a", "pcm_s16le", audio])
    return program, audio


# ---------------------------------------------------------------- graphics

def find_font(explicit):
    for c in ([explicit] if explicit else []) + FONT_CANDIDATES:
        p = Path(c).expanduser()
        if p.exists():
            return p
    raise SystemExit("no bold font found; pass --font /path/to/Montserrat-ExtraBold.ttf")


def text_block(draw, lines, font, cx, y, fill, spacing=1.15):
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((cx - w / 2, y), line, font=font, fill=fill)
        y += font.size * spacing
    return y


def headline_png(text, fmt, brand, font_path, out):
    W, H = FORMATS[fmt]
    L = LAYOUT[fmt]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    font = ImageFont.truetype(str(font_path), L["head_size"])
    lines = text.split("\n")
    probe_d = ImageDraw.Draw(img)
    tw = max(probe_d.textlength(l, font=font) for l in lines)
    th = font.size * 1.15 * len(lines)
    px, py = 48, 34
    box = (W / 2 - tw / 2 - px, L["head_y"], W / 2 + tw / 2 + px, L["head_y"] + th + 2 * py)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(box, radius=26, fill=(0, 0, 0, 110))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=26, fill=hex_rgb(brand["navy"]) + (236,))
    d.rounded_rectangle((box[0], box[3] - 10, box[2], box[3]), radius=5, fill=hex_rgb(brand["gold"]) + (255,))
    text_block(d, lines, font, W / 2, box[1] + py - font.size * 0.08, hex_rgb(brand["white"]))
    img.save(out)


def end_card_png(ec, fmt, brand, font_path, out):
    W, H = FORMATS[fmt]
    s = min(W, H) / 1080
    navy, gold, white = hex_rgb(brand["navy"]), hex_rgb(brand["gold"]), hex_rgb(brand["white"])
    img = Image.new("RGBA", (W, H), navy + (215,))
    d = ImageDraw.Draw(img)
    f_brand = ImageFont.truetype(str(font_path), int(96 * s))
    f_eye = ImageFont.truetype(str(font_path), int(34 * s))
    f_head = ImageFont.truetype(str(font_path), int(74 * s))
    f_btn = ImageFont.truetype(str(font_path), int(36 * s))
    f_url = ImageFont.truetype(str(font_path), int(32 * s))
    head = ec["headline"].split("\n")
    block_h = f_brand.size * 1.3 + 40 * s + f_eye.size * 1.6 + f_head.size * 1.15 * len(head) + 70 * s + 120 * s + 60 * s + f_url.size
    y = H / 2 - block_h / 2
    y = text_block(d, ["FunSculpting"], f_brand, W / 2, y, white, 1.0)
    d.rectangle((W / 2 - 70 * s, y + 18 * s, W / 2 + 70 * s, y + 24 * s), fill=gold)
    y += 54 * s
    y = text_block(d, [ec["eyebrow"]], f_eye, W / 2, y, gold, 1.6)
    y = text_block(d, head, f_head, W / 2, y, white)
    y += 50 * s
    bw = d.textlength(ec["button"], font=f_btn) + 100 * s
    bh = 110 * s
    d.rounded_rectangle((W / 2 - bw / 2, y, W / 2 + bw / 2, y + bh), radius=bh / 2, fill=gold)
    text_block(d, [ec["button"]], f_btn, W / 2, y + bh / 2 - f_btn.size * 0.62, navy)
    y += bh + 50 * s
    if brand.get("url"):
        text_block(d, [brand["url"]], f_url, W / 2, y, white)
    img.save(out)


# ---------------------------------------------------------------- captions

def caption_chunks(segments, transcript_segs, max_words=4, max_chars=24):
    """[(start, end, text)] in program time."""
    chunks = []
    for seg in segments:
        if seg["words"]:
            timed = [(w[0] - seg["tin"], w[1] - seg["tin"], w[2]) for w in seg["words"]]
        else:
            timed = []
            spans = [s for s in transcript_segs.get(seg["clip"], [])
                     if seg["in"] - 0.05 <= (s[0] + s[1]) / 2 <= seg["out"] + 0.05]
            if not spans:
                spans = [(seg["in"], seg["out"], seg["text"])]
            for a, b, text in spans:
                toks = text.split()
                total = sum(len(t) + 1 for t in toks)
                t = a
                for tok in toks:
                    dt = (b - a) * (len(tok) + 1) / total
                    timed.append((t - seg["tin"], t + dt - seg["tin"], tok))
                    t += dt
        cur = []
        for i, w in enumerate(timed):
            cur.append(w)
            text = " ".join(x[2] for x in cur)
            nxt = timed[i + 1] if i + 1 < len(timed) else None
            brk = (nxt is None or len(cur) >= max_words or len(text) + 1 + len(nxt[2]) > max_chars
                   or re.search(r"[.,?!;:]$", w[2]) or nxt[0] - w[1] > 0.35)
            if brk:
                a = max(0.0, cur[0][0])
                b = min(seg["dur"], (nxt[0] if nxt else cur[-1][1] + 0.15))
                chunks.append((seg["start"] + a, seg["start"] + max(b, a + 0.3), text))
                cur = []
    out = []
    for i, (a, b, t) in enumerate(chunks):
        if i + 1 < len(chunks):
            b = min(b, chunks[i + 1][0])
        out.append((a, b, t))
    return out


def highlight(text, keywords, gold):
    esc = text.replace("{", "(").replace("}", ")")
    for kw in sorted(keywords, key=len, reverse=True):
        esc = re.sub(rf"(?<![\w{{]){re.escape(kw)}(?![\w}}])",
                     lambda m: f"{{\\c{gold}}}{m.group(0)}{{\\c&H00FFFFFF}}", esc, flags=re.I)
    return esc


def write_ass(chunks, fmt, font_name, edl, out):
    W, H = FORMATS[fmt]
    L = LAYOUT[fmt]
    gold = ass_color(edl["brand"]["gold"])
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, "
        "MarginV, Encoding",
        f"Style: Cap,{font_name},{L['cap_size']},&H00FFFFFF,&H00FFFFFF,&H00101010,&H64000000,-1,0,0,0,100,100,0,0,1,"
        f"{max(3, L['cap_size'] // 14)},2,2,{L['cap_margin_lr']},{L['cap_margin_lr']},{L['cap_margin_v']},1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for a, b, t in chunks:
        lines.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Cap,,0,0,0,,{{\\fad(40,0)}}{highlight(t, edl['highlight'], gold)}")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_srt(chunks, out):
    out.write_text("".join(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n\n"
                           for i, (a, b, t) in enumerate(chunks, 1)), encoding="utf-8")


def write_edl(cut, segments, end, broll, out, fps):
    rows = [f"TITLE: {cut['title']}", "FCM: NON-DROP FRAME",
            "* SOURCE TIMECODE = SECONDS FROM CLIP START AT 30 FPS (SOURCES ARE 60 FPS iPHONE HEVC)", ""]
    n = 1
    for seg in segments:
        reel = f"IMG{seg['clip']}"
        rows.append(f"{n:03d}  {reel:<8} AA/V  C        {tc(seg['tin'], fps)} {tc(seg['tin'] + seg['dur'], fps)} "
                    f"{tc(seg['start'], fps)} {tc(seg['start'] + seg['dur'], fps)}")
        rows.append(f"* FROM CLIP NAME: {seg['path'].name}")
        rows.append(f"* {seg['id'].upper()} / {seg['speaker'].upper()}{' / PUNCH-IN' if seg.get('punch') else ''}")
        n += 1
    rows.append(f"{n:03d}  BL       V     C        00:00:00:00 {tc(end['dur'], fps)} {tc(end['start'], fps)} "
                f"{tc(end['start'] + end['dur'], fps)}")
    rows.append("* END CARD (GRAPHIC OVER BLURRED IMG_1752 COVER FRAME)")
    n += 1
    for b, start in broll:
        rows.append(f"{n:03d}  IMG{b['clip']:<5} V     C        {tc(b['in'], fps)} {tc(b['out'], fps)} "
                    f"{tc(start, fps)} {tc(start + b['out'] - b['in'], fps)}")
        rows.append(f"* B-ROLL CUTAWAY ON V2, AUDIO STAYS ON A-ROLL: IMG_{b['clip']}")
        n += 1
    out.write_text("\n".join(rows) + "\n")


# ---------------------------------------------------------------- final render

def render_format(fmt, program, audio, total, broll_items, overlay_items, ass_path, fonts_dir, out):
    W, H = FORMATS[fmt]
    inputs = ["-i", program, "-i", audio]
    graph = ["[0:v]setpts=PTS-STARTPTS[b0]"]
    cur, idx = "b0", 2
    for path, start, dur in broll_items:
        inputs += ["-i", path]
        graph.append(f"[{idx}:v]setpts=PTS-STARTPTS+{start:.4f}/TB[br{idx}]")
        graph.append(f"[{cur}][br{idx}]overlay=eof_action=pass:enable='between(t,{start:.3f},{start + dur:.3f})'[b{idx}]")
        cur, idx = f"b{idx}", idx + 1
    if fmt == "4x5":
        graph.append(f"[{cur}]crop=1080:1350:0:(ih-1350)*{CROP_4X5_Y}[r]")
    elif fmt == "16x9":
        graph.append(f"[{cur}]split[m][n];"
                     f"[m]scale=1920:-2,crop=1920:1080:0:(ih-1080)*0.4,gblur=sigma=50,eq=brightness=-0.12:saturation=0.8[bg];"
                     f"[n]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0[r]")
    else:
        graph.append(f"[{cur}]null[r]")
    cur = "r"
    for png, a, b in overlay_items:
        inputs += ["-loop", "1", "-framerate", "30", "-t", f"{total:.3f}", "-i", png]
        fo = max(a + 0.2, b - 0.2)
        graph.append(f"[{idx}:v]format=rgba,fade=t=in:st={a:.3f}:d=0.2:alpha=1,fade=t=out:st={fo:.3f}:d=0.2:alpha=1[o{idx}]")
        graph.append(f"[{cur}][o{idx}]overlay=0:0:enable='between(t,{a:.3f},{b:.3f})'[g{idx}]")
        cur, idx = f"g{idx}", idx + 1
    ass_arg = str(ass_path).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
    fd = str(fonts_dir).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
    graph.append(f"[{cur}]ass='{ass_arg}':fontsdir='{fd}',setsar=1,format=yuv420p[v]")
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(graph),
         "-map", "[v]", "-map", "1:a", "-t", f"{total:.3f}",
         "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", *BT709,
         "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out])
    assert (W, H) == (probe(out)["w"], probe(out)["h"]), f"{out.name}: unexpected size"


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, default=Path.cwd(), help="folder with IMG_17xx.MOV (default: cwd)")
    ap.add_argument("--out", type=Path, help="deliverables folder (default: <src>/FunSculpting_Ad_Final)")
    ap.add_argument("--edl", type=Path, default=HERE / "edl.json")
    ap.add_argument("--cuts", default="flagship,short")
    ap.add_argument("--formats", help="override formats, e.g. 9x16,4x5")
    ap.add_argument("--words", choices=["auto", "off"], default="auto",
                    help="auto: tx_vad.json word timings, else local whisper if installed; off: VAD times only")
    ap.add_argument("--whisper-model", default="small.en")
    ap.add_argument("--font", help="bold TTF/OTF for overlays and captions")
    ap.add_argument("--dry-run", action="store_true", help="print the resolved edit and stop")
    ap.add_argument("--force", action="store_true", help="rebuild cached intermediates")
    args = ap.parse_args()

    src = args.src.resolve()
    out_dir = (args.out or src / "FunSculpting_Ad_Final").resolve()
    work = src / "_work" / "build"
    work.mkdir(parents=True, exist_ok=True)
    edl = json.loads(args.edl.read_text())

    tx_words, tx_segs = load_transcript(src / "tx_vad.json") if args.words == "auto" else ({}, {})
    if not tx_segs and (src / "_work" / "tx_vad.json").exists():
        tx_words, tx_segs = load_transcript(src / "_work" / "tx_vad.json")
    whisper = Whisper(args.whisper_model, work) if args.words == "auto" else None

    def word_source(clip, path):
        if args.words == "off":
            return None
        return tx_words.get(clip) or whisper.words(clip, path)

    print(f"word timings: {'tx_vad.json' if tx_words else (whisper.kind + ' whisper') if whisper and whisper.kind else 'none (VAD times + 0.1 s pad)'}")

    font_path = find_font(args.font)
    font_name = ImageFont.truetype(str(font_path), 20).getname()[0]
    print(f"font: {font_path} ({font_name})")
    out_dir.mkdir(parents=True, exist_ok=True)

    for cut_name in args.cuts.split(","):
        cut = edl["cuts"][cut_name]
        segments, end, total = resolve(edl, src, cut_name, word_source)
        print(f"\n== {cut['title']}: {len(segments)} segments, {total:.1f} s")
        for s in segments:
            print(f"  {s['start']:6.2f}s  IMG_{s['clip']} {s['tin']:7.2f}-{s['tout']:7.2f}  {s['dur']:5.2f}s  "
                  f"{s['id']:<11} {'[words]' if s['words'] else '[vad]  '} {'punch' if s.get('punch') else ''}")
        print(f"  {end['start']:6.2f}s  end card {end['dur']:.2f}s")
        if args.dry_run:
            continue

        parts = []
        for s in segments:
            p = work / f"seg_{s['id']}_{s['clip']}_{s['tin']:.2f}_{s['tout']:.2f}_{int(bool(s.get('punch')))}.mkv"
            make_intermediate(s, edl, p, args.force)
            parts.append(p)
        endbg = work / f"endbg_{end['frames']}.mkv"
        make_end_background(edl, src, end, endbg, args.force)
        parts.append(endbg)
        program, audio = assemble(parts, work, cut_name, args.force)

        broll, broll_items = [], []
        for s in segments:
            for b in s.get("broll", []):
                if find_clip(src, b["clip"]) is None:
                    print(f"  skip b-roll IMG_{b['clip']} (missing)")
                    continue
                start = s["start"] + b["at"]
                bp = work / f"broll_{b['clip']}_{b['in']:.2f}_{b['out']:.2f}.mkv"
                make_broll(b, src, edl, bp, args.force)
                broll.append((b, start))
                broll_items.append((bp, start, min(b["out"] - b["in"], s["start"] + s["dur"] - start)))

        chunks = caption_chunks(segments, tx_segs)
        write_srt(chunks, out_dir / f"{cut['file']}.srt")
        write_edl(cut, segments, end, broll, out_dir / f"{cut['file']}.edl", edl["fps"])

        for fmt in (args.formats.split(",") if args.formats else cut["formats"]):
            gfx = work / f"gfx_{fmt}"
            gfx.mkdir(exist_ok=True)
            overlays = []
            for s in segments:
                for i, o in enumerate(s.get("overlays", [])):
                    png = gfx / f"head_{s['id']}_{i}.png"
                    headline_png(o["text"], fmt, edl["brand"], font_path, png)
                    until = s["dur"] if o["until"] is None else min(o["until"], s["dur"])
                    overlays.append((png, s["start"] + o["at"], s["start"] + until))
            ecard = gfx / "end_card.png"
            end_card_png(edl["end_card"], fmt, edl["brand"], font_path, ecard)
            overlays.append((ecard, end["start"], total))
            ass = work / f"{cut_name}_{fmt}.ass"
            write_ass(chunks, fmt, font_name, edl, ass)
            mp4 = out_dir / f"{cut['file']}_{fmt}.mp4"
            print(f"  render {mp4.name}")
            render_format(fmt, program, audio, total, broll_items, overlays, ass, font_path.parent, mp4)

    if not args.dry_run:
        for doc in ("CREATIVE_RATIONALE.md", "CLAIMS_VERIFICATION.md"):
            shutil.copy(HERE / doc, out_dir / doc)
        print(f"\ndeliverables in {out_dir}")


if __name__ == "__main__":
    main()
