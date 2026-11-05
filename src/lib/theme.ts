export const themeStorageKey = "hugsy-theme";

export const themeScript = `try{var t=localStorage.getItem("${themeStorageKey}");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
