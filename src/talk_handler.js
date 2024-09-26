import Router from 'express';
import {Template} from './util/template.js';
import {GetLoginStat, getPassword, Hash2} from './util/security.js';
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
	if (uid == req.loginStat) {
		res.redirect('/message/?error=self');
		return;
	}
	res.redirect(`/message/${get_private(req.loginStat, uid)}`);
});

function Load(req, res, th) {
	
	if (th != -1 && !getProfile(req.loginStat).relationship.groups.includes(th)) {
		res.redirect('/message/?error=invalidth');
		return;
	}
	renderFile("./src/assets/contents/talk.html", {
		loadThread: th
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