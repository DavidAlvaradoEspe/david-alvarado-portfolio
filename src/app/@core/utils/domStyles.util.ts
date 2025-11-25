export function removeDuplicateInspectorStyles(targetUrl:string) {

  const links = document.querySelectorAll(`link[href="${targetUrl}"]`);

  if (links.length > 1) {
    for (let i = 1; i < links.length; i++) {
      links[i].remove();
    }
  }
}
