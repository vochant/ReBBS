import {createHash} from 'crypto';
import {getProfile} from './profile.js';

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

export const GetLoginStat = function(obj) {
	if (obj.cookies["login-cache"]) {
		if (obj.cookies["login-cache"] == "__logout__") {
			return -1;
		}
		var jso;
		try {
			jso = JSON.parse(obj.cookies["login-cache"]);
		}
		catch (err) {
			return -1;
		}
		return jso.passwd === Hash2(getPassword(jso.uid)) ? jso.uid : -1;
	}
	return -1;
}

export const UserAdminStat = function(uid) {
	if (uid == 1) return true;
	var obj = getProfile(uid);
	return obj.adminStat;
}