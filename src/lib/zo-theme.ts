// Single source of truth for this site's theme.
//
// Edit `src/theme.json` to restyle the whole site. These tokens generate the
// site's CSS custom properties (`:root` light + `.dark`).
//
// Token names are the shadcn token set (background, foreground, primary, …),
// without the leading `--`. Light and dark each carry the full palette.

import theme from "../theme.json";

type TokenMap = Record<string, string>;

function cssVars(map: TokenMap): string {
  return Object.entries(map)
    .map(([name, value]) => `--${name}: ${value};`)
    .join("");
}

// Generate the variable blocks the site reads. `.dark` is toggled by the site's
// existing theme provider (it adds/removes the class on <html>).
const style = document.createElement("style");
style.id = "zo-theme-vars";
style.textContent = `:root{${cssVars(theme.light)}}\n.dark{${cssVars(theme.dark)}}`;
document.head.appendChild(style);
