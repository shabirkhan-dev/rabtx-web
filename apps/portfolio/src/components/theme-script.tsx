export const THEME_STORAGE_KEY = "theme";

/** The browser bar colour for each theme: the page background. */
export const THEME_COLORS = { dark: "#0d0d0c", light: "#fafaf8" } as const;

/** Points the theme-color meta at the page's theme, so the browser bar matches the page. */
export function syncThemeColor(theme: keyof typeof THEME_COLORS) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

/** Applies the saved theme before paint. Dark is the default, as in the design. */
export function ThemeScript() {
  const script = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",document.documentElement.dataset.theme==="light"?"${THEME_COLORS.light}":"${THEME_COLORS.dark}")})`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
