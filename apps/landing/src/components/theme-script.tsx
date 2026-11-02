export const THEME_KEY = "theme";

/** Applies a saved theme before first paint, so there's no flash. Without one, the system setting wins. */
export function ThemeScript() {
	const script = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
