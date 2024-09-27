import Router from 'express';
import {Template} from './util/template.js';
import {GetLoginStat, getPassword, Hash2, EncodeSecurity, DecodeSecurity} from './util/security.js';
import {readFileSync, writeFileSync} from './util/cache.js';
import {renderFile} from 'ejs';
import Identicon from 'identicon.js';
import {createHash} from 'crypto';
import {getPerm} from './util/permission.js';
import {getProfile, getUidLimit} from './util/profile.js';
import markdown from './util/markdown.js';
import {queryPosts, renderSubsc, renderFans, renderPosts} from './util/personal_util.js';
import {htmlenc} from './util/htmlenc.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

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

router.all('/login', (req, res, next) => {
	if (req.loginStat != -1) {
		res.redirect('/error/logout_first');
	}
	else next();
});

router.all('/regist', (req, res, next) => {
	if (req.loginStat != -1) {
		res.redirect('/error/logout_first');
	}
	else next();
});

router.all('/logout', (req, res, next) => {
	if (req.loginStat == -1) {
		res.redirect('/error/login_first');
	}
	else next();
});

router.get('/login', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/login.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "登录",
			head: "",
			isLogged: false,
			isReplace: req.isReplace,
			uid: -1,
			drawer: "",
			isAdmin: false,
			userName: "未登录"
		}, hypertext));
	});
});

router.get('/regist', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/regist.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "注册",
			head: "",
			isLogged: false,
			isReplace: req.isReplace,
			uid: -1,
			drawer: "",
			isAdmin: false,
			userName: "未登录"
		}, hypertext));
	});
});

router.get('/eula', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/eula.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "EULA",
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.get('/markdown', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/markdown.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "Markdown 帮助文档",
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.post('/userapi', (req, res) => {
	var obj = req.body, uid;
	var reversed_map = JSON.parse(readFileSync("./data/profile/reversed_mapping.json"));
	if (!obj.method) {
		res.status(200).json({error: "需要提供一个方法！"});
		return;
	}
	if (obj.method == "login") {
		if (req.loginStat != -1) {
			res.status(200).json({error: "已经登录，无需重复登录！"});
			return;
		}
		else {
			if (!obj.user) {
				res.status(200).json({error: "需要提供一个用户！"});
				return;
			}
			if (reversed_map.userdb[obj.user] != undefined) {
				uid = reversed_map.userdb[obj.user];
			}
			else {
				res.status(200).json({error: "用户不存在！"});
				return;
			}
		}
		if (!getPerm(uid).login) {
			res.status(200).json({error: "该用户不具备鉴权登录权限！"});
			return;
		}
		if (Hash2(obj.passwd) === getPassword(uid)) {
			res.cookie("login-cache", EncodeSecurity(JSON.stringify({
				random: uuidv4(),
				uid: uid,
				passwd: Hash2(obj.passwd)
			})), {maxAge: 400 * 60 * 60 * 24});
			res.status(200).json({});
		}
		else res.status(200).json({error: "用户名或密码错误！"});
	}
	else if (obj.method == "regist") {
		if (req.loginStat != -1) {
			res.status(200).json({error: "已经登录，无需重复登录！"});
			return;
		}
		uid = reversed_map.used + 1;
		reversed_map.used++;
		var err = false;
		if (reversed_map.userdb[obj.user]) {
			res.status(200).json({error: "用户名已经被使用！"});
			return;
		}
		if (!/^[\w!@#\$%\^&\*\(\)-\+=\[\]\{\}\\\|;:'",<\.>/\?~`]{6,}$/.test(obj.passwd)) {
			res.status(200).json({error: "密码必须仅由大小写字母、数字和部分特殊符号组成，且至少为6位！"});
			return;
		}
		if (obj.user.includes('@')) {
			res.status(200).json({error: "用户名不能包含字符@！"});
			return;
		}
		writeFileSync(`./data/profile/${uid}.overrides.json`, "{}", (error) => {
			if (error) {
				err = true;
			}
		});
		if (err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		writeFileSync(`./data/profile/${uid}.md`, "", (error) => {
			if (error) {
				err = true;
			}
		});
		if (err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		writeFileSync(`./data/profile/${uid}.permission.json`, JSON.stringify({
			visit: true,
			comment: true,
			messager: true,
			post: true,
			share: true,
			upload: true,
			login: true
		}), (error) => {
			if (error) {
				err = true;
			}
		}, "\t");
		if (err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		writeFileSync(`./data/profile/${uid}.json`, JSON.stringify({
			userName: obj.user,
			adminStat: false,
			password: Hash2(obj.passwd),
			realName: "",
			born: [],
			certify: "",
			posts: [],
			job: 0,
			company: "",
			gender: 0,
			region: "",
			group_pub: true,
			blog: {
				title: `${obj.user} 的博客`,
				certify: "",
				posts: []
			},
			relationship: {
				subscribed: [],
				be_subscribed: [],
				banned: [],
				groups: [],
				contact: {}
			}
		}), (error) => {
			if (error) {
				err = true;
			}
		}, "\t");
		if (err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		const MD5 = crypto.createHash("md5");
		MD5.update(obj.user);
		let img = new Identicon(MD5.digest('hex')).toString()
		var dataBuffer = Buffer.from(img, 'base64');
		writeFileSync(`./web/usericon/${uid}.png`, dataBuffer, function(error) {
			if (error) {
			  err = true;
			}
		});
		if (err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		reversed_map.userdb[obj.user] = uid;
		writeFileSync("./data/profile/reversed_mapping.json", JSON.stringify(reversed_map), (error) => {
			if (error) {
				err = true;
			}
		});
		if(err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		res.cookie("login-cache", EncodeSecurity(JSON.stringify({
			uid: uid,
			passwd: Hash2(obj.passwd),
			random: uuidv4()
		})), {maxAge: 400 * 60 * 60 * 24});
		res.status(200).json({});
	}
	else if (obj.method == "logout") {
		if (req.loginStat == -1) {
			res.status(200).json({error: "用户未登录！"});
			return;
		}
		res.cookie("login-cache", "__logout__");
		res.status(200).json({});
	}
	else {
		res.status(200).json({error: "用户操作未定义！"});
	}
});

router.get('/logout', (req, res) => {
	if (req.loginStat == -1) {
		res.redirect('/error/login_first');
		return;
	}
	res.cookie("login-cache", "__logout__");
	res.redirect('/');
});

router.get('/custom_logout', (req, res) => {
	if (!req.isReplace) {
		res.redirect('/error/repl_first');
		return;
	}
	var obj = JSON.parse(DecodeSecurity(req.cookies["login-cache"]));
	res.cookie("login-cache", EncodeSecurity(JSON.stringify({uid: obj.uid, passwd: obj.passwd, random: obj.random})), 114 * 1000 * 60 * 60 * 24);
	res.redirect('/');
});

router.get('/user/:uid', (req, res) => {
	if (!/^[1-9][0-9]{0,}$/.test(req.params.uid)) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uid = Number(req.params.uid);
	if (uid > getUidLimit()) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uprof = getProfile(uid);
	var myprof = getProfile(req.loginStat);
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/homepage.html", {
		prof,
		in_count: uprof.relationship.be_subscribed.length,
		out_count: uprof.relationship.subscribed.length,
		username: uprof.userName,
		uid,
		req,
		group_public: uprof.group_pub,
		subscribed: req.loginStat == -1 ? false : myprof.relationship.subscribed.includes(uid),
		banned: req.loginStat == -1 ? false : myprof.relationship.banned.includes(uid),
		markdown,
		userdesc: uprof.certify,
		readFileSync,
		queryPosts,
		be_subsc: req.loginStat == -1 ? false : myprof.relationship.be_subscribed.includes(uid)
	}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: `${uprof.userName}的个人主页`,
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
})

router.get('/user/:uid/subscribes', (req, res) => {
	if (!/^[1-9][0-9]{0,}$/.test(req.params.uid)) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uid = Number(req.params.uid);
	if (uid > getUidLimit()) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uprof = getProfile(uid);
	var myprof = getProfile(req.loginStat);
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	var pageLimit = Math.ceil(uprof.relationship.subscribed.length / 20);
	if (pageLimit == 0) pageLimit = 1;
	if (req.query.page) {
		if (!/^[1-9][0-9]{0,}$/.test(req.query.page)) {
			res.redirect(`/user/${uid}/subscribes`);
			return;
		}
		req.query.page = Number(req.query.page);
		if (req.query.page < 0) {
			res.redirect(`/user/${uid}/subscribes?page=1`);
			return;
		}
		if (req.query.page > pageLimit) {
			res.redirect(`/user/${uid}/subscribes?page=${pageLimit}`);
			return;
		}
	}
	renderFile("./src/assets/contents/personal_io.html", {
		prof,
		in_count: uprof.relationship.be_subscribed.length,
		out_count: uprof.relationship.subscribed.length,
		username: uprof.userName,
		uid,
		req,
		group_public: uprof.group_pub,
		subscribed: myprof.relationship.subscribed.includes(uid),
		banned: myprof.relationship.banned.includes(uid),
		markdown,
		userdesc: uprof.certify,
		readFileSync,
		queryPosts,
		be_subsc: myprof.relationship.be_subscribed.includes(uid),
		contents: renderSubsc(req.loginStat, uid, req.query.page ? req.query.page : 1)
	}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: `${uprof.userName}的关注`,
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
})

router.get('/user/:uid/fans', (req, res) => {
	if (!/^[1-9][0-9]{0,}$/.test(req.params.uid)) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uid = Number(req.params.uid);
	if (uid > getUidLimit()) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uprof = getProfile(uid);
	var myprof = getProfile(req.loginStat);
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	var pageLimit = Math.ceil(uprof.relationship.be_subscribed.length / 20);
	if (pageLimit == 0) pageLimit = 1;
	if (req.query.page) {
		if (!/^[1-9][0-9]{0,}$/.test(req.query.page)) {
			res.redirect(`/user/${uid}/fans`);
			return;
		}
		req.query.page = Number(req.query.page);
		if (req.query.page < 0) {
			res.redirect(`/user/${uid}/fans?page=1`);
			return;
		}
		if (req.query.page > pageLimit) {
			res.redirect(`/user/${uid}/fans?page=${pageLimit}`);
			return;
		}
	}
	renderFile("./src/assets/contents/personal_io.html", {
		prof,
		in_count: uprof.relationship.be_subscribed.length,
		out_count: uprof.relationship.subscribed.length,
		username: uprof.userName,
		uid,
		req,
		group_public: uprof.group_pub,
		subscribed: myprof.relationship.subscribed.includes(uid),
		banned: myprof.relationship.banned.includes(uid),
		markdown,
		userdesc: uprof.certify,
		readFileSync,
		queryPosts,
		be_subsc: myprof.relationship.be_subscribed.includes(uid),
		contents: renderFans(req.loginStat, uid, req.query.page ? req.query.page : 1)
	}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: `${uprof.userName}的粉丝`,
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
});

router.get('/user/:uid/articles', (req, res) => {
	if (!/^[1-9][0-9]{0,}$/.test(req.params.uid)) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uid = Number(req.params.uid);
	if (uid > getUidLimit()) {
		res.redirect('/error/user_not_found');
		return;
	}
	var uprof = getProfile(uid);
	var myprof = getProfile(req.loginStat);
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	var pageLimit = Math.ceil(uprof.posts.length / 20);
	if (pageLimit == 0) pageLimit = 1;
	if (req.query.page) {
		if (!/^[1-9][0-9]{0,}$/.test(req.query.page)) {
			res.redirect(`/user/${uid}/articles`);
			return;
		}
		req.query.page = Number(req.query.page);
		if (req.query.page < 0) {
			res.redirect(`/user/${uid}/articles?page=1`);
			return;
		}
		if (req.query.page > pageLimit) {
			res.redirect(`/user/${uid}/articles?page=${pageLimit}`);
			return;
		}
	}
	renderFile("./src/assets/contents/personal_articles.html", {
		prof,
		in_count: uprof.relationship.be_subscribed.length,
		out_count: uprof.relationship.subscribed.length,
		username: uprof.userName,
		uid,
		req,
		group_public: uprof.group_pub,
		subscribed: myprof.relationship.subscribed.includes(uid),
		banned: myprof.relationship.banned.includes(uid),
		markdown,
		userdesc: uprof.certify,
		readFileSync,
		renderPosts,
		be_subsc: myprof.relationship.be_subscribed.includes(uid),
		page: req.query.page ? req.query.page : 1
	}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: `${uprof.userName}的帖子`,
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
});

router.get('/about', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/about.html", {prof}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: "关于",
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
});

router.get('/help', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/help.html", {prof}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: "帮助",
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName,
		}, hypertext));
	});
});

export default router;