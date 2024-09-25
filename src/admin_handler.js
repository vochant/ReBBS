import Router from 'express';
import {Template} from './util/template.js';
import {GetLoginStat, UserAdminStat} from './util/security.js';
import {getProfile, getUidLimit} from './util/profile.js';
import {readFileSync, writeFileSync} from 'fs';
import {renderFile} from 'ejs';
import {newToken, makeChange, splitOperation} from './util/judgement.js';

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

router.all('*', (req, res, next) => {
	if (!req.loginStat) res.redirect('/error/login_first')
	else if (!req.isAdmin) res.redirect('/error/no_op');
	else next();
});

router.get('/', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/admin.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "后台管理",
			head: "",
			isLogged: true,
			isReplace: req.isReplace,
			uid: req.loginStat,
			drawer: readFileSync("./src/assets/partial/admin_sidebar.html", "utf8"),
			isAdmin: true,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.post('/custom_login', (req, res) => {
	if (req.isReplace) {
		res.status(200).json({error: "请先结束当前替换！"});
		return;
	}
	if (req.body.uid == req.loginStat) {
		res.status(200).json({error: "禁止替换自己！"});
		return;
	}
	if (UserAdminStat(req.body.uid) && req.loginStat != 1) {
		res.status(200).json({error: "禁止替换其他管理员！"});
		return;
	}
	if (!/^[1-9][0-9]{0,}$/.test(req.body.uid)) {
		res.status(200).json({error: "UID 无效！"});
		return;
	}
	if (req.body.uid > getUidLimit()) {
		res.status(200).json({error: "UID 不在范围内！"});
		return;
	}
	var obj = JSON.parse(req.cookies["login-cache"]);
	res.cookie("login-cache", JSON.stringify({
		uid: obj.uid,
		passwd: obj.passwd,
		replace: req.body.uid
	}), {maxAge: 114 * 1000 * 60 * 60 * 24});
	res.status(200).json({});
});

router.post('/api0', (req, res) => {
	var obj = req.body;
	if (!/^[1-9][0-9]{0,}$/.test(obj.uid)) {
		res.status(200).json({error: "UID 格式错误！"});
		return;
	}
	obj.uid = Number(obj.uid);
	if (obj.uid > getUidLimit()) {
		res.status(200).json({error: "UID 范围错误！"});
		return;
	}
	if (getProfile(obj.uid).adminStat) {
		if (req.loginStat != 1 && req.loginStat != obj.uid) {
			res.status(200).json({error: "您无权执行该操作！"});
			return;
		}
	}
	var token = newToken(obj.uid);
	if (token == -1) {
		res.status(200).json({error: "服务器文件系统错误！"});
		return;
	}
	res.status(200).json({token: token});
});

router.post('/api1', (req, res) => {
	var obj = req.body;
	var spobj = splitOperation(req, obj);
	if (spobj.error) {
		res.status(200).json(spobj);
		return;
	}
	res.status(200).json(makeChange(spobj));
});

export default router;