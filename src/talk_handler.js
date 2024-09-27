import Router from 'express';
import {Template} from './util/template.js';
import {renderFile} from 'ejs';
import {getProfile, getUidLimit} from './util/profile.js';
import {get_private} from './util/thread.js';

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
	if (req.loginStat == -1) {
		res.redirect('/error/login_first');
	}
	else next();
});

router.get('/private/:uid', (req, res) => {
	if (!/^[1-9][0-9]{0,}$/.test(req.params.uid)) {
		res.redirect('/message/?error=invalid');
		return;
	}
	var uid = Number(req.params.uid);
	if (uid > getUidLimit()) {
		res.redirect('/message/?error=invalid');
		return;
	}
	if (getProfile(req.loginStat).relationship.banned.includes(uid) || getProfile(uid).relationship.banned.includes(req.loginStat)) {
		res.redirect('/message/?error=banned');
		return;
	}
	if (uid == req.loginStat) {
		res.redirect('/message/?error=self');
		return;
	}
	res.redirect(`/message/${get_private(req.loginStat, uid)}`);
});

function Load(req, res, th) {
	console.log('[DEBUG] Relationship: ', th, getProfile(req.loginStat).relationship.groups);
	if (th != -1 && !getProfile(req.loginStat).relationship.groups.includes(th)) {
		res.redirect('/message/?error=invalidth');
		return;
	}
	renderFile("./src/assets/contents/talk.html", {
		loadThread: th,
		user: req.loginStat
	}, (err, hypertext) => {
		res.send(Template({
			title: "信息",
			head: "",
			isLogged: true,
			uid: req.loginStat,
			isReplace: req.isReplace,
			drawer: "",
			isAdmin: req.isAdmin,
			userName: getProfile(req.loginStat).userName
		}, hypertext));
	});
}

router.post('/api', (req, res) => {
	var obj = req.body;
	if (!obj.method) {
		res.status(200).send({error: '需要提供一个方法'});
		return;
	}
	if (obj.method == 'new') {
		if (!obj.data) {
			res.status(200).send({error: '需要一个成员列表'});
			return;
		}
		if (!(obj.data instanceof Array)) {
			res.status(200).send({error: '成员列表必须是一个 Array 对象'});
		}
		
	}
})

router.get('/:thread', (req, res) => {
	if (!/[1-9][0-9]*/.test(req.params.thread)) {
		res.redirect('/message/?error=invalidth');
		return;
	}
	var n = Number(req.params.thread);
	Load(req, res, n);
});

router.get('/', (req, res) => {
	Load(req, res, -1);
});

export default router;