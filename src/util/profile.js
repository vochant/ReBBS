import {readFileSync, writeFileSync} from 'fs';

export const getProfile = function(uid) {
	if (uid == -1) return {userName: "未登录"};
	var source = JSON.parse(readFileSync(`./data/profile/${uid}.overrides.json`, "utf8"));
	var target = JSON.parse(readFileSync(`./data/profile/${uid}.json`, "utf8"));
	return Object.assign(target, source);
}

export const setProfile = function(uid, k, v) {
	var err = false;
	if (uid == -1) return true;
	var target = JSON.parse(readFileSync(`./data/profile/${uid}.json`, "utf8"));
	target[k] = v;
	writeFileSync(`./data/profile/${uid}.json`, JSON.stringify(target, undefined, "\t"), (error) => {
		if (error) {
			err = true;
		}
	});
	return err;
}

export const writeProfile = function(uid, value) {
	var err = false;
	if (uid == -1) return true;
	writeFileSync(`./data/profile/${uid}.json`, JSON.stringify(value, undefined, "\t"), (error) => {
		if (error) {
			err = true;
		}
	});
	return err;
}

export const setDesc = function(uid, content) {
	var err = false;
	if (uid == -1) return true;
	writeFileSync(`./data/profile/${uid}.md`, content, (error) => {
		if (error) {
			err = true;
		}
	});
	return err;
}

export const getUidLimit = () => {
	var reversed_map = JSON.parse(readFileSync("./data/profile/reversed_mapping.json"));
	return reversed_map.used;
}