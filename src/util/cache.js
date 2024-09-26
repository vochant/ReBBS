import {readFileSync as readSync, writeFileSync as writeSync} from 'fs';

let cache = {};

export const readFileSync = function(path, encode) {
	if (cache[path]) return cache[path];
	let res = readSync(path, encode);
	if (res.length <= 1048576) {
		cache[path] = res;
	}
	return res;
}

export const writeFileSync = function(path, content, extra) {
	writeSync(path, content, extra);
	if (cache[path]) cache[path] = content;
}