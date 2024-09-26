import {readFileSync, writeFileSync} from './cache.js';

export const getPerm = (uid) => {
	if (uid == -1) return {
		visit: true,
		comment: true,
		messager: true,
		post: true,
		share: true,
		upload: true
	};
	return JSON.parse(readFileSync(`./data/profile/${uid}.permission.json`, "utf8"));
};

export const setPerm = (uid, json) => {
	if (uid == -1) return true;
	var err = false;
	writeFileSync(`./data/profile/${uid}.permission.json`, JSON.stringify(json), (error) => {
		if (error) {
			err = true;
		}
	});
	return err;
}