import { readFileSync } from "./cache.js";

export const getSizeDec = function(size) {
	if (size < 1000) return size + 'B';
	if (size < 1000000) return (size / 1000).toFixed(2) + 'KB';
	if (size < 1000000000) return (size / 1000000).toFixed(2) + 'MB';
	if (size < 1000000000000) return (size / 1000000000).toFixed(2) + 'GB';
	return (size / 100000000000).toFixed(2) + 'TB';
}

export const getSizeBin = function(size) {
	if (size < 10000) return size + 'B';
	if (size < 1048576) return (size / 1024).toFixed(2) + 'KiB';
	if (size < 1073741824) return (size / 1048576).toFixed(2) + 'MiB';
	if (size < 1099511627776) return (size / 1073741824).toFixed(2) + 'GiB';
	return (size / 1099511627776).toFixed(2) + 'TiB';
}

export const getSize = function(size) {
	if (size < 5120) return size + 'B';
	return `${size}B ${getSizeDec(size)} ${getSizeBin(size)}`;
}

export const dispFile = function(data) {
	let suffix = data.name.includes('.') ? '.' + data.name.split('.').slice(-1)[0] : '无后缀';
	return `<b>类型: </b>${data.mimetype} (${suffix})<br><b>大小: </b>${getSize(data.size)}`;
}

export const isImage = function(id) {
	let file = JSON.parse(readFileSync(`./data/drive/${id}.json`, 'utf-8'));
	return file.mimetype.startsWith('image/');
}