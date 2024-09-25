export const htmlenc = (str) => {
	return str.replaceAll('&', '&amp;').replaceAll('>', '&gt;').replaceAll('<', '&lt;').replaceAll("'", '&#39;').replaceAll('"', '&quot;');
}