#!/usr/bin/env python3
"""Generate stand-in footage that copies the iPhone MOV format (HEVC 10-bit HLG/BT.2020,
1920x1080 stored with -90 rotation, 60 fps) so build_ad.py can be tested without the real clips.

    python3 make_test_footage.py /tmp/fake_october [--words]

--words also writes a tx_vad.json with fake word timings to exercise the word-anchored cuts.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    edl = json.loads((HERE / "edl.json").read_text())
    need = {}
    for seg in edl["segments"].values():
        need[seg["clip"]] = max(need.get(seg["clip"], 0), seg["out"] + 1.5)
        for b in seg.get("broll", []):
            need[b["clip"]] = max(need.get(b["clip"], 0), b["out"] + 1.5)
    for i, (clip, dur) in enumerate(sorted(need.items())):
        landscape = clip == "1752"
        path = out / f"IMG_{clip}.MOV"
        if path.exists():
            continue
        rot = [] if landscape else ["-display_rotation:v:0", "-90"]
        subprocess.run(["ffmpeg", "-y", "-v", "error",
                        "-f", "lavfi", "-i", f"testsrc2=s=1920x1080:r=60:d={dur:.2f}",
                        "-f", "lavfi", "-i", f"sine=f={220 + 40 * i}:r=48000:d={dur:.2f}",
                        "-c:v", "libx265", "-preset", "ultrafast", "-crf", "32", "-pix_fmt", "yuv420p10le",
                        "-x265-params", "log-level=error",
                        "-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc",
                        "-c:a", "aac", "-ac", "2", "-shortest", str(path) + ".tmp.mov"], check=True)
        # Rotation is container metadata; add it on a stream-copy remux like the iPhone writes it.
        subprocess.run(["ffmpeg", "-y", "-v", "error", *rot, "-i", str(path) + ".tmp.mov", "-c", "copy",
                        str(path)], check=True)
        Path(str(path) + ".tmp.mov").unlink()
        print("made", path)

    if "--words" in sys.argv:
        tx = []
        for sid, seg in edl["segments"].items():
            if seg.get("fallback_only"):
                continue
            toks = seg["text"].split()
            a, b = seg["in"], seg["out"]
            if seg.get("start_text"):  # put the anchored phrase in the middle of the long take
                a, b = (a + 2, a + 5) if sid == "mike_box" else (a + 10, a + 14)
            step = (b - a) / len(toks)
            words = [{"word": t, "start": round(a + k * step, 3), "end": round(a + (k + 0.8) * step, 3)}
                     for k, t in enumerate(toks)]
            tx.append({"file": f"IMG_{seg['clip']}.MOV", "segments": [{"start": a, "end": b, "text": seg["text"],
                                                                        "words": words}]})
        (out / "tx_vad.json").write_text(json.dumps(tx, indent=1))
        print("made", out / "tx_vad.json")


if __name__ == "__main__":
    main()
