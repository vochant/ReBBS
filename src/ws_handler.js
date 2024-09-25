import Router from 'express';
import expressWs from 'express-ws';
import markdown from './util/markdown.js';
import {getProfile} from './util/profile.js';
import {getPerm} from './util/permission.js';
import {create_msg, get_msg, get_hundreds, mark_unread, check_new, get_thread_info} from './util/thread.js';
import {readFileSync} from 'fs';
import 'moment';

const router = Router();
expressWs(router);

let rmap = {}, view = {};

router.ws('', (conn, req) => {
	if (!req.loginStat || req.loginStat == -1) {
		sendMsg(conn, 'eh', 'login_first');
		return;
	}
	else if (!getPerm(req.loginStat).messager) {
		sendMsg(conn, 'eh', 'banned');
		return;
	}
	else {
		rmap['u' + req.loginStat] = conn;
		view['u' + req.loginStat] = -1;
	}

	conn.on('close', function() {
        rmap['u' + req.loginStat] = undefined;
		view['u' + req.loginStat] = undefined;
    });

	conn.on('send', function(msg) {
		try {
			var obj = JSON.parse(msg);
		}
		catch (err) {
			sendMsg(conn, 'eh', 'json_format');
			return;
		}
		if (!obj.thread) {
			sendMsg(conn, 'eh', 'no_thread');
			return;
		}
		if (!(obj.thread instanceof Number)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (obj.thread == Math.floor(obj.thread)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (!getProfile(req.loginStat).relationship.groups.includes(obj.thread)) {
			sendMsg(conn, 'eh', 'join_thread');
			return;
		}
		if (!obj.text) {
			sendMsg(conn, 'eh', 'no_text');
		}
		var tm = moment().format('YYYY/MM/DD HH:mm:ss');
		var uid = check_new(obj.thread);
		if (uid != -1 && rmap[uid]) {
			sendMsg(rmap[uid], 'list', {
				data: [
					{
						icon: `/file/usericon/${uid}.png`,
						name: getPorfile(uid).userName,
						last: '',
						unread: false
					}
				]
			});
		}
		create_msg(obj.thread, req.loginStat, obj.text, tm);
		var th = JSON.parse(readFileSync(`./data/threads/${obj.thread}.json`, 'utf-8')), ren = markdown.render(obj.text);
		for (var i = 0; i < th.users.length; i++) {
			if (rmap['u' + th.users[i]]) {
				sendMsg(rmap['u' + th.users[i]], 'message', {
					sender: req.loginStat,
					text: ren,
					time: tm
				});
				if (view['u' + th.users[i]] != th) {
					mark_unread(th, th.users[i], true);
				}
			}
			else {
				mark_unread(th, th.users[i], true);
			}
		}
	});

	conn.on('view', function(msg) {
		try {
			var obj = JSON.parse(msg);
		}
		catch (err) {
			sendMsg(conn, 'eh', 'json_format');
			return;
		}
		if (!obj.thread) {
			sendMsg(conn, 'eh', 'no_thread');
			return;
		}
		if (!(obj.thread instanceof Number)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (obj.thread == Math.floor(obj.thread)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (!getProfile(req.loginStat).relationship.groups.includes(obj.thread)) {
			sendMsg(conn, 'eh', 'join_thread');
			return;
		}
		mark_unread(obj.thread, req.loginStat, false);
	});

	conn.on('recv', function(msg) {
		try {
			var obj = JSON.parse(msg);
		}
		catch (err) {
			sendMsg(conn, 'eh', 'json_format');
			return;
		}
		if (!(obj.thread instanceof Number)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (obj.thread == Math.floor(obj.thread)) {
			sendMsg(conn, 'eh', 'thread_format');
			return;
		}
		if (!obj.thread) {
			sendMsg(conn, 'eh', 'no_thread');
			return;
		}
		if (!obj.index) {
			sendMsg(conn, 'eh', 'no_page');
			return;
		}
		if (!(obj.index instanceof Number)) {
			sendMsg(conn, 'eh', 'ix_format');
			return;
		}
		if (obj.index == Math.floor(obj.index)) {
			sendMsg(conn, 'eh', 'ix_format');
			return;
		}
		if (obj.index < 0 || obj.index > get_hundreds(obj.thread)) {
			sendMsg(conn, 'eh', 'ix_range');
			return;
		}
		sendMsg(conn, 'push', {
			thread: obj.thread,
			data: get_msg(obj.thread, obj.index)
		});
	});

	conn.on('init', function() {
		var res = {data: []};
		var prof = getProfile(req.loginStat);
		for (var i in prof.relationship.groups) {
			res.data.push(get_thread_info(i));
		}
		sendMsg(conn, 'list', res);
	});
});

function sendMsg(conn, type, data) {
    conn.send(JSON.stringify({ type: type, data: data }));
}

export default router;