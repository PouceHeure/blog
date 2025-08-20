import os, re
import yaml
from datetime import datetime

PROJECTS_DIR = "../content/projects"
OUTPUT_LATEX = "../latex/projects_beamer.tex"
BASE_URL = "http://localhost:1313"
IMAGES_DIR = "../static"  # used only for local images starting with "/"


# --- LaTeX helpers ---
def tex_escape(text: str) -> str:
    if not text:
        return ""
    conv = {
        "&":  r"\&", "%":  r"\%", "$":  r"\$", "#":  r"\#",
        "_":  r"\_", "{":  r"\{", "}":  r"\}",
        "~":  r"\textasciitilde{}", "^":  r"\textasciicircum{}",
        "\\": r"\textbackslash{}",
    }
    regex = re.compile('|'.join(re.escape(k) for k in conv))
    return regex.sub(lambda m: conv[m.group()], text)

def extract_frontmatter(path):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    if not lines or lines[0].strip() != "---":
        return None
    yaml_lines = []
    for line in lines[1:]:
        if line.strip() == "---":
            break
        yaml_lines.append(line)
    return yaml.safe_load("".join(yaml_lines)) or {}

def parse_date(d):
    if not d: return datetime.min
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try: return datetime.strptime(str(d), fmt)
        except ValueError: pass
    try: return datetime.fromisoformat(str(d))
    except: return datetime.min

def is_remote_image(path: str) -> bool:
    s = (path or "").lower()
    return s.startswith("http://") or s.startswith("https://")

def local_image_path(image_field: str) -> str | None:
    """Return a filesystem path for local images, or None for remote/empty."""
    if not image_field:
        return None
    if is_remote_image(image_field):
        return None
    if image_field.startswith("/"):
        return os.path.normpath(os.path.join(IMAGES_DIR, image_field.lstrip("/")))
    return os.path.normpath(os.path.join(IMAGES_DIR, image_field))

def main():
    # Collect projects
    projects = []
    for filename in os.listdir(PROJECTS_DIR):
        if filename.endswith(".md"):
            fm = extract_frontmatter(os.path.join(PROJECTS_DIR, filename))
            if fm:
                projects.append({
                    "date": parse_date(fm.get("date")),
                    "title": fm.get("title","Untitled"),
                    "description": fm.get("description",""),
                    "tags": fm.get("tags", []),
                    "image": fm.get("image", ""),
                    "slug": os.path.splitext(filename)[0],
                })
    projects.sort(key=lambda x: x["date"], reverse=True)

    # --- Beamer preamble with your brand colors & white titles ---
    lines = [
        r"\documentclass[aspectratio=169]{beamer}",
        r"\usetheme{Madrid}",
        r"\usepackage{xcolor}",
        r"\usepackage{graphicx}",
        r"\usepackage{ragged2e}",
        r"\PassOptionsToPackage{hyphens}{url}",
        r"\usepackage{url}",
        r"\urlstyle{same}",
        # Define brand colors (from your CSS)
        r"\definecolor{primary}{HTML}{0057B8}",
        r"\definecolor{secondary}{HTML}{6C757D}",
        r"\definecolor{success}{HTML}{28A745}",
        r"\definecolor{info}{HTML}{17A2B8}",
        r"\definecolor{warning}{HTML}{FFCC00}",
        r"\definecolor{danger}{HTML}{D9534F}",
        r"\definecolor{light}{HTML}{F4F4F4}",
        r"\definecolor{dark}{HTML}{1A1A1A}",
        # Apply: white titles on primary background
        r"\setbeamercolor{structure}{fg=primary}",
        r"\setbeamercolor{frametitle}{bg=primary, fg=white}",
        r"\setbeamercolor{title}{bg=primary, fg=white}",
        r"\setbeamercolor{titlelike}{bg=primary, fg=white}",
        r"\setbeamercolor{author}{fg=white}",
        r"\setbeamercolor{date}{fg=white}",
        r"\setbeamercolor{subtitle}{fg=white}",
        r"\setbeamercolor{block title}{bg=light, fg=dark}",
        r"\setbeamercolor{block body}{bg=light!60, fg=dark}",
        r"\setbeamercolor{normal text}{fg=dark}",
        r"\setbeamercolor{itemize item}{fg=primary}",
        r"\hypersetup{colorlinks=true, linkcolor=primary, urlcolor=info}",
        r"\setbeamertemplate{navigation symbols}{}",
        r"\setbeamertemplate{footline}[frame number]",
        r"\setbeamerfont{frametitle}{series=\bfseries,size=\Large}",
        r"\title{Projects Overview}",
        rf"\author{{{tex_escape(BASE_URL)}}}",
        r"\date{}",
        r"\begin{document}",
        r"\begin{frame}",
        r"\titlepage",
        r"\end{frame}",
    ]

    # --- Frames ---
    for p in projects:
        url = f"{BASE_URL}/projects/{p['slug']}"
        title = tex_escape(p["title"])
        desc  = tex_escape(p["description"])
        tags  = tex_escape(", ".join(p["tags"]))
        date_str = p["date"].strftime("%Y-%m-%d") if p["date"] != datetime.min else "N/A"

        image_field = p["image"] or ""
        remote = is_remote_image(image_field)
        img_local = local_image_path(image_field) if not remote else None
        latex_img_path = (img_local.replace(os.sep, "/") if img_local and os.path.exists(img_local) else None)

        # FRAME START
        lines.append(rf"\begin{{frame}}[t]{{{title} \ \textcolor{{light}}{{\normalsize({date_str})}}}}")
        lines.append(r"\vspace{-0.35em}")
        lines.append(r"\begin{columns}[T,onlytextwidth]")

        # LEFT: image with subtle border
        lines.append(r"\begin{column}{0.52\textwidth}")
        lines.append(r"\centering")
        if latex_img_path:
            lines.append(r"\setlength{\fboxsep}{0pt}%")
            lines.append(r"\setlength{\fboxrule}{0.8pt}%")
            lines.append(r"\color{light}\fbox{")
            lines.append(rf"\includegraphics[width=\linewidth,height=0.62\textheight,keepaspectratio]{{{latex_img_path}}}")
            lines.append(r"}")
        elif remote:
            lines.append(r"\small\textit{Image online:}\\[0.3em]")
            lines.append(rf"\url{{{image_field}}}")
        else:
            lines.append(r"\small\textit{No image provided}")
        lines.append(r"\end{column}")

        # RIGHT: content blocks
        lines.append(r"\begin{column}{0.46\textwidth}")
        if desc:
            lines.append(r"\begin{block}{Description}")
            lines.append(r"\justifying\small " + desc)
            lines.append(r"\end{block}")
        lines.append(r"\begin{block}{Details}")
        if tags:
            lines.append(r"\small \textbf{Tags:} " + tags + r"\\[0.4em]")
        lines.append(r"\small \textbf{Link:} \url{" + url + r"}")
        lines.append(r"\end{block}")
        lines.append(r"\end{column}")

        lines.append(r"\end{columns}")
        lines.append(r"\end{frame}")  # FRAME END

    lines.append(r"\end{document}")

    os.makedirs(os.path.dirname(OUTPUT_LATEX), exist_ok=True)
    with open(OUTPUT_LATEX, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Beamer file created: {OUTPUT_LATEX}")

if __name__ == "__main__":
    main()
