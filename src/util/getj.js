import {readFileSync, writeFileSync} from 'fs';
import {getProfile, setProfile} from './profile.js'

export const getJobString = (uid) => {
	if (uid == -1) return "未定义";
	var obj = getProfile(uid);
	var sic = JSON.parse(readFileSync(`./data/static/jobs.json`, "utf8"));
	return sic.data[obj.job];
}