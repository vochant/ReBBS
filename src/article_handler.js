import Router from 'express';
import {Template} from './util/template.js';
import {readFileSync, writeFileSync} from 'fs';
import {renderFile} from 'ejs';
import {getProfile} from './util/profile.js';
import markdown from './util/markdown.js';

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

function renderTags(obj) {
	var tags = "";
	for (var j = 0; j < obj.tags.length; j++) {
		tags += `
<div class="mdui-chip">
<a href="/article/tags/${obj.tags[j].id}" class="mdui-chip-title blog-tag">
	${obj.tags[j].title}
</a>
</div> `;
	}
	return tags;
}

router.get('/:aid', (req, res) => {
	var prof = JSON.parse(readFileSync("./data/profile.json"));
	if (!/^[0]$/.test(req.params.aid) && !/^[1-9][0-9]{0,}$/.test(req.params.aid)) {
		res.redirect('/error/not_found');
		return;
	}
	var id = Number(req.params.aid);
	var obj = JSON.parse(readFileSync("./data/res/article/total.json", 'utf8'));
	if (id >= obj.count || obj.removed.includes(id)) {
		res.redirect('/error/not_found');
		return;
	}
	var aid = req.params.aid;
	var arprof = JSON.parse(readFileSync(`./data/res/article/${req.params.aid}.json`, "utf8"));
	var uid = arprof.author;
	var uprof = getProfile(uid);
	var myprof = getProfile(req.loginStat);
	renderFile("./src/assets/contents/article.html", {
		prof,
		title: arprof.title,
		in_count: uprof.relationship.be_subscribed.length,
		out_count: uprof.relationship.subscribed.length,
		username: uprof.userName,
		postTime: arprof.time,
		tags: renderTags(arprof),
		uid,
		req,
		subscribed: req.loginStat == -1 ? false : myprof.relationship.subscribed.includes(uid),
		markdown,
		desc: uprof.certify,
		readFileSync,
		aid,
		arprof,
		be_subsc: req.loginStat == -1 ? false : myprof.relationship.be_subscribed.includes(uid)
	}, (err, hypertext) => {
		if(err) console.log(err);
		res.send(Template({
			title: `${arprof.title}`,
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

router.post('/api', (req, res) => {
	if (req.loginStat == -1) {
		res.status(200).json({error: "用户未登录！"});
		return;
	}
	if (!req.body.method) {
		res.status(200).json({error: "未知操作！"});
	}
})

export default router;