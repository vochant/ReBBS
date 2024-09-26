import {Server} from 'socket.io'
import markdown from './util/markdown.js';
import {getProfile} from './util/profile.js';
import {getPerm} from './util/permission.js';
import {create_msg, get_msg, get_hundreds, mark_unread, check_new, get_thread_info} from './util/thread.js';
import {readFileSync} from 'fs';
import cookie from 'cookie';
import {GetLoginStat} from './util/security.js';
import 'moment';

let rmap = {}, view = {};

export const Bind = function(server) {
	const io = new Server(server);

	io.on('connection', (socket) => {
		if (!socket.handshake.headers.cookie) {
			sendMsg(socket, 'eh', 'no_cookie');
		}
		const cookies = cookie.parse(socket.handshake.headers.cookie);
		const loginStat = GetLoginStat({cookies});
		// console.log(`UID ${loginStat} connected to the server.`)
		if (!loginStat || loginStat == -1) {
			sendMsg(socket, 'eh', 'login_first');
			return;
		}
		else if (!getPerm(loginStat).messager || !getPerm(loginStat).visit) {
			sendMsg(socket, 'eh', 'banned');
			return;
		}
		else {
			rmap['u' + loginStat] = socket;
			view['u' + loginStat] = -1;
		}

		socket.on('disconnect', function() {
			// console.log(`UID ${loginStat} disconnected from the server.`)
			rmap['u' + loginStat] = undefined;
			view['u' + loginStat] = undefined;
		});

		socket.on('send', function(msg) {
			try {
				var obj = JSON.parse(msg);
			}
			catch (err) {
				sendMsg(socket, 'eh', 'json_format');
				return;
			}
			if (!obj.thread) {
				sendMsg(socket, 'eh', 'no_thread');
				return;
			}
			if (!(obj.thread instanceof Number)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (obj.thread != Math.floor(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			if (!obj.text) {
				sendMsg(socket, 'eh', 'no_text');
			}
			var tm = moment().format('YYYY/MM/DD HH:mm:ss');
			// 如果先前是空列表，使它出现在列表之中
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
			create_msg(obj.thread, loginStat, obj.text, tm);
			var th = JSON.parse(readFileSync(`./data/threads/${obj.thread}.json`, 'utf-8')), ren = markdown.render(obj.text);
			for (var i = 0; i < th.users.length; i++) {
				if (rmap['u' + th.users[i]]) {
					sendMsg(rmap['u' + th.users[i]], 'message', {
						sender: loginStat,
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
		socket.on('view', function(msg) {
			try {
				var obj = JSON.parse(msg);
			}
			catch (err) {
				sendMsg(socket, 'eh', 'json_format');
				return;
			}
			if (!obj.thread) {
				sendMsg(socket, 'eh', 'no_thread');
				return;
			}
			if (!(obj.thread instanceof Number)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (obj.thread != Math.floor(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			mark_unread(obj.thread, loginStat, false);
		});

		socket.on('recv', function(msg) {
			try {
				var obj = JSON.parse(msg);
			}
			catch (err) {
				sendMsg(socket, 'eh', 'json_format');
				return;
			}
			if (!obj.thread) {
				sendMsg(socket, 'eh', 'no_thread');
				return;
			}
			if (!(obj.thread instanceof Number)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (obj.thread != Math.floor(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			if (!obj.index) {
				sendMsg(socket, 'eh', 'no_page');
				return;
			}
			if (!(obj.index instanceof Number)) {
				sendMsg(socket, 'eh', 'ix_format');
				return;
			}
			if (obj.index != Math.floor(obj.index)) {
				sendMsg(socket, 'eh', 'ix_format');
				return;
			}
			if (obj.index < 0 || obj.index > get_hundreds(obj.thread)) {
				sendMsg(socket, 'eh', 'ix_range');
				return;
			}
			sendMsg(socket, 'push', {
				thread: obj.thread,
				data: get_msg(obj.thread, obj.index)
			});
		});

		socket.on('init', function(msg) {
			if (msg == -1) {
				var e = -1;
			}
			else if (/^[1-9][0-9]*$/.test(msg)) {
				var e = Number(msg);
				if (!getProfile(loginStat).relationship.groups.includes(e)) {
					sendMsg(socket, 'eh', 'join_thread');
					return;
				}
			}
			else {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			var res = {data: []};
			var prof = getProfile(loginStat);
			// console.log(prof.relationship.groups);
			for (var i = 0; i < prof.relationship.groups.length; i++) {
				// if (prof.relationship.groups[i] != e && check_new(prof.relationship.groups[i], loginStat)) continue;
				res.data.push(get_thread_info(prof.relationship.groups[i], loginStat));
			}
			sendMsg(socket, 'list', res);
		});
	});
}

function sendMsg(socket, type, data) {
    socket.emit(type, JSON.stringify(data));
}
