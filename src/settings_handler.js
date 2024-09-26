import Router from 'express';
import {Template} from './util/template.js';
import {GetLoginStat, getPassword, Hash2} from './util/security.js';
import {readFileSync, writeFileSync} from './util/cache.js';
import {renderFile} from 'ejs';
import {getProfile, setProfile} from './util/profile.js';
import {getJobString} from './util/getj.js'
import highlightjs from 'highlight.js';
import {getPerm} from './util/permission.js';

/*
config.title
config.head
config.isLogged
config.uid
config.drawer
config.isAdmin
userName
*/

function isInteger(obj) {
	return /^0$/.test(obj) || /^[1-9][0-9]{0,}$/.test(obj)
}

const router = Router();

router.all('*', (req, res, next) => {
	if (req.loginStat == -1) {
		res.redirect('/error/login_first');
	}
	else next();
});

router.post('/security_api', (req, res) => {
	var obj = req.body, pf = getProfile(req.loginStat);
	if (obj.password !== getPassword(req.loginStat)) {
		res.status(200).json({error: "密码不匹配！"});
		return;
	}
	if (obj.id == "userName") {
		var reversed_map = JSON.parse(readFileSync("./data/profile/reversed_mapping.json"));
		if (/^[1-9][0-9]{0,}$/.test(obj.value)) {
			res.status(200).json({error: "用户名不能为纯数字！"});
			return;
		}
		if (reversed_map.userdb[obj.value]) {
			res.status(200).json({error: "用户名已经被使用！"});
			return;
		}
		reversed_map.userdb[pf.userName] = undefined;
		reversed_map.userdb[obj.value] = req.loginStat;
		if (setProfile(req.loginStat, "userName", obj.value)) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		var err = false;
		writeFileSync("./data/profile/reversed_mapping.json", JSON.stringify(reversed_map), (error) => {
			if (error) {
				err = true;
			}
		});
		if(err) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).json({});
	} else if (obj.id == "password") {
		if(!/^[\w!@#\$%\^&\*\(\)-\+=\[\]\{\}\\\|;:'",<\.>/\?~`]{6,}$/.test(obj.value)) {
			res.status(200).json({error: "密码必须仅由大小写字母、数字和部分特殊符号组成，且至少为6位！"});
			return;
		}
		if (setProfile(req.loginStat, "password", obj.value)) {
			res.status(200).json({error: "服务器文件系统错误！"});
			return;
		}
		res.status(200).json({});
	} else {
		res.status(200).json({error: "操作未定义！"});
	}
})

router.post('/api', (req, res) => {
	var obj = req.body;
	if (obj.id == "realName" || obj.id == "certify" || obj.id == "company" || obj.id == "mail" || obj.id == "region") {
		if (obj.id == "mail") {
			if (!/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/.test(obj.value)) {
				res.status(200).json({error: "数据格式错误！"});
				return;
			}
		}
		if (setProfile(req.loginStat, obj.id, obj.value)) {
			res.status(200).json({error: "服务器文件系统错误！"});
		} else {
			res.status(200).json({});
		}
		return;
	}
	else if (obj.id == "gender") {
		if (!/^[0-3]{1}$/.test(obj.value)) {
			res.status(200).json({error: "数据范围错误！"});
			return;
		}
		var val = Number(obj.value);
		if (setProfile(req.loginStat, obj.id, val)) {
			res.status(200).json({error: "服务器文件系统错误！"});
		} else {
			res.status(200).json({});
		}
		return;
	}
	else if (obj.id == "group_pub") {
		if (setProfile(req.loginStat, obj.id, obj.value == "true")) {
			res.status(200).json({error: "服务器文件系统错误！"});
		} else {
			res.status(200).json({isgp: true});
		}
		return;
	}
	else if (obj.id == "born") {
		if (!/^((([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29))$/.test(obj.value)) {
			res.status(200).json({error: "数据格式错误！"});
			return;
		}
		var sp = obj.value.split('-');
		if (sp.length != 3) {
			res.status(200).json({error: "数据格式错误！"});
			return;
		}
		var y4 = Number(sp[0]), m2 = Number(sp[1]), d2 = Number(sp[2]);
		if (y4.toString() == "NaN" || m2.toString() == "NaN" || d2.toString() == "NaN") {
			res.status(200).json({error: "数据格式错误！"});
			return;
		}
		if (setProfile(req.loginStat, obj.id, [y4, m2, d2])) {
			res.status(200).json({error: "服务器文件系统错误！"});
		} else {
			res.status(200).json({});
		}
		return;
	}
	else if (obj.id == "phone") {
		if (!/^1[3-8]\d{9}$/.test(obj.value)) {
			res.status(200).json({error: "数据格式错误"});
			return;
		}
		var pno = Number(obj.value);
		if (pno.toString() == "NaN") {
			res.status(200).json({error: "数据格式错误"});
			return;
		}
		if (!isInteger(pno)) {
			res.status(200).json({error: "数据格式错误"});
			return;
		}
		if (setProfile(req.loginStat, obj.id, Number(obj.value))) {
			res.status(200).json({error: "服务器文件系统错误！"});
		} else {
			res.status(200).json({});
		}
		return;
	}
	else if (obj.id == "job") {
		if (!isInteger(obj.value)) {
			res.status(200).json({error: "数据格式错误"});
			return;
		}
		var iid = Number(obj.value);
		if (iid > 35 || iid < 0) {
			res.status(200).json({error: "数据格式错误"});
			return;
		}
		setProfile(req.loginStat, obj.id, iid)
		res.status(200).json({result: getJobString(req.loginStat)})
	}
});

router.get('/data_api', (req, res) => {
	var obj = getProfile(req.loginStat);
	if (obj.userName == "未登录") res.send({
		userName: "未登录",
		mail: "",
		phone: "",
		adminStat: false,
		realName: "",
		certify: "",
		jobs: "",
		company: "",
		region: "",
		gender: 0,
		blog: {
			title: "未定义",
			certify: "",
		}
	});
	else res.send({
		userName: obj.userName,
		adminStat: obj.adminStat,
		realName: obj.realName,
		phone: obj.phone,
		born: obj.born,
		certify: obj.certify,
		region: obj.region,
		gender: obj.gender,
		job: getJobString(req.loginStat),
		company: obj.company,
		mail: obj.mail,
		blog: {
			title: obj.title,
			certify: obj.certify
		}
	});
});

router.get('/', (req, res) => {
	res.redirect('/settings/info');
})

router.get('/profile', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	var uprof = getProfile(req.loginStat);
	renderFile("./src/assets/contents/settings_per.html", {prof, group_public: uprof.group_pub}, (err, hypertext) => {
		res.send(Template({
			title: "设置",
			head: "",
			isLogged: true,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: readFileSync("./src/assets/partial/settings_sidebar.html"),
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.get('/info', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	var image = {url: `/file/usericon/${req.loginStat}.png`};
	renderFile("./src/assets/contents/settings_info.html", {prof, image}, (err, hypertext) => {
		res.send(Template({
			title: "设置",
			head: "",
			isLogged: true,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: readFileSync("./src/assets/partial/settings_sidebar.html"),
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.get('/security', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/settings_sec.html", {prof}, (err, hypertext) => {
		res.send(Template({
			title: "设置",
			head: "",
			isLogged: true,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: readFileSync("./src/assets/partial/settings_sidebar.html"),
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

router.get('/permission', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	renderFile("./src/assets/contents/settings_op.html", {prof, highlightjs, permission_json: JSON.stringify(getPerm(req.loginStat), undefined, '\t'), isAdmin: req.isAdmin}, (err, hypertext) => {
		res.send(Template({
			title: "设置",
			head: "",
			isLogged: true,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: readFileSync("./src/assets/partial/settings_sidebar.html"),
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
});

export default router;