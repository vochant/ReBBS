import Router from 'express';
import {writeFileSync as owriteFileSync} from 'fs';
import {readFileSync} from './util/cache.js';
import {setDesc, getProfile, writeProfile, getUidLimit} from './util/profile.js'

/*
config.title
config.head
config.isLogged
config.uid
config.drawer
config.isAdmin
userName
*/

const router = Router();

router.get("/descget0", (req, res) => {
	if (req.loginStat == -1) {
		res.status(403).send("");
		return;
	}
	var desc = readFileSync(`./data/profile/${req.loginStat}.md`, "utf8");
	res.send(desc);
});

router.post("/descset0", (req, res) => {
	if (req.loginStat == -1) {
		res.status(200).send({error: "用户未登录！"});
		return;
	}
	if (setDesc(req.loginStat, req.body.code)) {
		res.status(200).json({error: "服务器文件系统错误！"});
	} else {
		res.status(200).json({});
	}
});

router.post("/iconset", (req, res) => {
	if (req.loginStat == -1) {
		res.status(200).send({error: "用户未登录！"});
		return;
	}
	if (!req.body || !req.body.image) {
		res.status(200).send({error: "没有上传图片！"});
		return;
	}
	var imgData = req.body.image;
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = Buffer.from(base64Data, 'base64');
	var flag = false;
    owriteFileSync(`./web/usericon/${req.loginStat}.png`, dataBuffer, function(err) {
		flag = true;
        if (err) {
        	res.status(200).json({error: "服务器文件系统错误！"});
        } else {
        	res.status(200).json({src: `/file/usericon/${req.loginStat}.png`});
        }
	});
	if (!flag) {
		res.status(200).json({src: `/file/usericon/${req.loginStat}.png`});
	}
});

function removeItem(ori, d) {
	var res = [];
	ori.forEach((v, k) => {
		if (v != d) {
			res.push(v);
		}
	});
	return res;
}

router.post("/subscribe", (req, res) => {
	if (req.loginStat == -1) {
		res.status(200).send({error: "用户未登录！"});
		return;
	}
	var obj = req.body;
	if (!/^[1-9][0-9]{0,}$/.test(obj.uid)) {
		res.status(200).json({error: "UID 无效！"});
		return;
	}
	var uid = Number(obj.uid);
	if (uid > getUidLimit()) {
		res.status(200).json({error: "UID 无效！"});
		return;
	}
	if (uid == req.loginStat) {
		res.status(200).json({error: "对自己操作无效！"});
		return;
	}
	if (obj.value == "true") {
		if (getProfile(uid).relationship.be_subscribed.includes(req.loginStat)) {
			res.status(200).send({error: "已经关注！"});
			return;
		}
		if (getProfile(req.loginStat).relationship.banned.includes(uid)) {
			res.status(200).send({error: "不能关注拉黑的人！"});
			return;
		}
		var hprof = getProfile(uid);
		hprof.relationship.be_subscribed.push(req.loginStat);
		if (writeProfile(uid, hprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		var mprof = getProfile(req.loginStat);
		mprof.relationship.subscribed.push(uid);
		if (writeProfile(req.loginStat, mprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).send({});
	}
	else {
		if (!getProfile(uid).relationship.be_subscribed.includes(req.loginStat)) {
			res.status(200).send({error: "还没有关注！"});
			return;
		}
		var hprof = getProfile(uid);
		hprof.relationship.be_subscribed = removeItem(hprof.relationship.be_subscribed, req.loginStat);
		if (writeProfile(uid, hprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		var mprof = getProfile(req.loginStat);
		mprof.relationship.subscribed = removeItem(mprof.relationship.subscribed, uid);
		if (writeProfile(req.loginStat, mprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).send({});
	}
});

router.post("/ban", (req, res) => {
	if (req.loginStat == -1) {
		res.status(200).send({error: "用户未登录！"});
		return;
	}
	var obj = req.body;
	if (!/^[1-9][0-9]{0,}$/.test(obj.uid)) {
		res.status(200).send({error: "UID 无效！"});
		return;
	}
	var uid = Number(obj.uid);
	if (uid > getUidLimit()) {
		res.status(200).send({error: "UID 无效！"});
		return;
	}
	if (uid == req.loginStat) {
		res.status(200).json({error: "对自己操作无效！"});
		return;
	}
	if (obj.value == "true") {
		if (getProfile(req.loginStat).relationship.banned.includes(uid)) {
			res.status(200).send({error: "已经拉黑！"});
			return;
		}
		if (getProfile(uid).relationship.be_subscribed.includes(req.loginStat)) {
			res.status(200).send({error: "不能拉黑关注的人！"});
			return;
		}
		var mprof = getProfile(req.loginStat);
		mprof.relationship.banned.push(uid);
		if (writeProfile(req.loginStat, mprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).send({});
	}
	else {
		if (!getProfile(req.loginStat).relationship.banned.includes(uid)) {
			res.status(200).send({error: "还没有拉黑！"});
			return;
		}
		var mprof = getProfile(req.loginStat);
		mprof.relationship.banned = removeItem(mprof.relationship.banned, uid);
		if (writeProfile(req.loginStat, mprof)) {
			res.status(200).send({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).send({});
	}
});

export default router;