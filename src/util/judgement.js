import {readFileSync, writeFileSync} from './cache.js';
import {getUidLimit} from './profile.js';
import {setPerm} from './permission.js';
import {GetLoginStat} from './security.js';

export const newToken = (uid1) => {
	if (uid1 > getUidLimit()) return -1;
	var str = readFileSync("./data/judgement/total.json", "utf8");
	var obj = JSON.parse(str);
	obj.total++;
	writeFileSync("./data/judgement/total.json", JSON.stringify(obj), (error) => {
		if (error) {
			obj.total = 0;
		}
	});
	writeFileSync(`./data/judgement/${obj.total - 1}.json`, JSON.stringify({uid: uid1}), (error) => {
		if (error) {
			obj.total = 0;
		}
	});
	return obj.total - 1;
};
// -> uid
// <- token

export const splitOperation = (ori, obj) => {
	var res = {data: []};
	if (/^[0-9]$/.test(obj.count) || /^[1-9][0-9]{0,}$/.test(obj.count)) {
		res.count = Number(obj.count);
	}
	else return {error: "数据格式错误！"};
	if (res.count == 0) {
		res.ignorable = true;
	}
	for (var i = 0; i < res.count; i++) {
		if (!obj[`k${i}`] || !obj[`v${i}`]) return {error: "数据长度错误！"};
		if (!["visit", "login", "comment", "messager", "post", "share", "upload"].includes(obj[`k${i}`])) {
			return {error: "标签类型错误！"};
		}
		res.data.push({key: obj[`k${i}`], value: obj[`v${i}`] == 'true'});
	}
	res.reason = obj.reason ? obj.reason : "";
	res.token = obj.token;
	res.original = GetLoginStat(ori);
	res.operator = ori.loginStat;
	return res;
}
// -> Object {count, reason, kxx, vxx}
// <- Object {count, reason, token, data[{key, value}]}

export const makeChange = (obj) => {
	if (!/^[0-9]$/.test(obj.token) && !/^[1-9][0-9]{0,}$/.test(obj.token)) return {error: "Token 格式错误！"};
	obj.token = Number(obj.token);
	var token = obj.token;
	var str = readFileSync("./data/judgement/total.json", "utf8");
	var aobj = JSON.parse(str);
	if (token >= aobj.token) return {error: "Token 范围错误！"};
	var uidobj = readFileSync(`./data/judgement/${token}.json`, "utf8");
	var uid = JSON.parse(uidobj).uid;
	var pp = JSON.parse(readFileSync(`./data/profile/${uid}.permission.json`, "utf8"));
	obj.uid = uid;
	for (var i = 0; i < obj.count; i++) {
		pp[obj.data[i].key] = obj.data[i].value;
	}
	if(setPerm(uid, pp)) {
		return {error: "服务器文件系统错误！"};
	}
	var err = false;
	writeFileSync(`./data/judgement/${token}.json`, JSON.stringify(obj, undefined, "\t"), (error) => {
		if (error) err = true;
	});
	return err ? {error: "服务器玩家系统错误！"} : {};
}
// -> Object {token, count, data[{key, value}]}
// <- Error-Object