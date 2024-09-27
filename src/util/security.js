import {createHash, createCipheriv, createDecipheriv} from 'crypto';
import {getProfile} from './profile.js';
import {readFileSync} from './cache.js';
import {validate as uuidvalidate} from 'uuid';

var key = JSON.parse(readFileSync('./data/profile.json', 'utf-8')).password;

export const Hash2 = function(str) {
	if (str === 1) return 1;
	const MD5 = createHash("md5"), SHA256 = createHash("sha256");
	return MD5.update("prefix5_" + str, "utf8").digest("hex") + SHA256.update("prefix256_" + str, "utf8").digest("hex");
}

export const getPassword = function(uid) {
	try {
		var obj = getProfile(uid);
	}
	catch (err) {
		return 1;
	}
	return obj.password;
}

export const EncodeSecurity = function(original) {
	const cipher = createCipheriv('aes256', key, key.slice(0, 16))
	var crypted = cipher.update(original, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

export const DecodeSecurity = function(original) {
	const cipher = createDecipheriv('aes256', key, key.slice(0, 16))
	var data = cipher.update(original, 'hex', 'utf8');
	data += cipher.final('utf8');
	return data;
}

export const GetLoginStat = function(obj) {
	if (obj.cookies["login-cache"]) {
		if (obj.cookies["login-cache"] == "__logout__") {
			return -1;
		}
		var jso;
		try {
			var dec = DecodeSecurity(obj.cookies["login-cache"]);
			jso = JSON.parse(dec);
		}
		catch (err) {
			return -1;
		}
		if (!uuidvalidate(jso.random)) return -1;
		return jso.passwd === getPassword(jso.uid) ? jso.uid : -1;
	}
	return -1;
}

export const UserAdminStat = function(uid) {
	if (uid == 1) return true;
	var obj = getProfile(uid);
	return obj.adminStat;
}