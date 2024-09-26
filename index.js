// ReBBS System
// Copyright (C) 2009-2024 Mirekintoc Void.
// Under MIT License.

// Entry/Main

import { fileURLToPath } from 'url'
import {createServer} from 'http';
import Path from 'path'
import Express from 'express';
import {renderFile} from 'ejs';
import cors from 'cors';
import BodyParser from 'body-parser';
import CookieParser from 'cookie-parser';
import {GetLoginStat, UserAdminStat} from './src/util/security.js';
import {readFileSync} from 'fs';
import {Template} from './src/util/template.js';
import {getProfile} from './src/util/profile.js';
import {getPerm} from './src/util/permission.js';

var prof = JSON.parse(readFileSync('./data/profile.json'));

const app = Express();
app.use(cors());
app.use(BodyParser.json());
app.use(CookieParser());
app.use(BodyParser.urlencoded({extended: false}));

app.all('*', (req, res, next) => {
	req.isReplace = false;
	req.loginStat = GetLoginStat(req);
	if (req.loginStat != -1) {
		req.isAdmin = UserAdminStat(req.loginStat) ;
		if (req.isAdmin) {
			var jso = JSON.parse(req.cookies["login-cache"]);
			if (jso.replace) {
				req.loginStat = jso.replace;
				req.isReplace = true;
			}
		}
	}
	else {
		req.isAdmin = false;
	}
	if (!getPerm(req.loginStat).visit) {
		if (!req._parsedUrl.pathname.startsWith('/user_service') && req._parsedUrl.pathname.startsWith('/logout') && !req._parsedUrl.pathname.startsWith('/file') && !req._parsedUrl.pathname.startsWith('/admin') && !req._parsedUrl.pathname.startsWith('/eula')) {
			renderFile("./src/assets/contents/banned.html", {prof}, (err, hypertext) => {
				res.send(Template({
					title: "Banned",
					head: "",
					isLogged: req.loginStat != -1,
					uid: req.loginStat,
					drawer: "",
					isAdmin: req.isAdmin,
					isReplace: req.isReplace,
					userName: getProfile(req.loginStat).userName
				}, hypertext));
			});
			return;
		}
	}
	next();
});

import IndexHandler from './src/index_handler.js';
import AdminHandler from './src/admin_handler.js';
import OptionHandler from './src/settings_handler.js';
import UserHandler from './src/user_handler.js';
import ArticleHandler from './src/article_handler.js';
import {Bind} from './src/ws_handler.js';
import MessageHandler from './src/talk_handler.js';

app.use(`/admin`, AdminHandler);
// app.use(`/detail`, DetailHandler);
app.use(`/userapi`, UserHandler);
// app.use(`/drive`, DriveHandler);
app.use(`/article`, ArticleHandler);
app.use(`/message`, MessageHandler);
// app.use(`/notifications`, NotificationsHandler);
// app.use(`/share`, SharingHandler);
// app.use('/redirect', RedirectHandler);
// app.use('/tools', ToolchainHandler);
app.use('/settings', OptionHandler);
// app.use('/redirect', RedirectHandler);
app.use(`/`, IndexHandler);

// app.use('/wsserver', WSHandler);

app.use("/file", Express.static(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web')));

app.get('/favicon.ico', (req, res) => {
	res.sendFile(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web', 'favicon.ico'));
});

app.get('/apple-touch-icon.png', (req, res) => {
	res.sendFile(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web', 'apple-touch-icon.png'));
});

app.get('/error/:eid', (req, res) => {
	res.send(Template({
		title: "错误",
		head: "",
		isLogged: req.loginStat != -1,
		uid: req.loginStat,
		drawer: "",
		isReplace: req.isReplace,
		isAdmin: req.isAdmin,
		userName: getProfile(req.loginStat).userName
	}, `<script>function SetText(str){$("#out").text(str+" 秒后将自动返回主页")}setTimeout(SetText,1000,2);setTimeout(SetText,2000,1);setTimeout(()=>{location.href=location.origin;},3000);</script><div class="mdui-typo">${prof.errids[req.params.eid] ? prof.errids[req.params.eid] : "未定义的错误"}<br><div id="out">3 秒后将自动返回主页</div></div>`));
});

app.get('*', (req, res) => {
	renderFile("./src/assets/contents/404.html", {prof}, (err, hypertext) => {
		res.status(404).send(Template({
			title: "404",
			head: "",
			isLogged: req.loginStat != -1,
			uid: req.loginStat,
			drawer: "",
			isReplace: req.isReplace,
			isAdmin: req.isAdmin,
			userName: req.loginStat != -1 ? getProfile(req.loginStat).userName : "未登录"
		}, hypertext));
	});
});

const server = createServer(app);
Bind(server);
server.listen(prof.port, () => {
    console.log(`Port :${prof.port} is opened`);
});