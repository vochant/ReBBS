import {Server} from 'socket.io'
import markdown from './util/markdown.js';
import {getProfile} from './util/profile.js';
import {getPerm} from './util/permission.js';
import {create_msg, get_msg, get_hundreds, mark_unread, check_new, get_thread_info, create_group, render_file, render_image, join_group, exit_group, make_op} from './util/thread.js';
import {readFileSync} from './util/cache.js';
import cookie from 'cookie';
import {GetLoginStat} from './util/security.js';
import moment from 'moment';
import { validate as uuidvalidate } from 'uuid';
import {existsSync} from 'fs';
import { isImage } from './util/filedisplay.js';

let rmap = {}, view = {};

export const Bind = function(server) {
	const io = new Server(server);

	io.on('connection', (socket) => {
		if (!socket.handshake.headers.cookie) {
			sendMsg(socket, 'eh', 'no_cookie');
			return;
		}
		const cookies = cookie.parse(socket.handshake.headers.cookie);
		const loginStat = GetLoginStat({cookies});
		console.log(`[DEBUG] UID ${loginStat} connected to the server.`)
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
			console.log(`[DEBUG] UID ${loginStat} disconnected from the server.`)
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
			if (!Number.isInteger(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			if (!obj.text) {
				sendMsg(socket, 'eh', 'no_text');
				return;
			}
			if (obj.text == '') {
				sendMsg(socket, 'eh', 'no_text');
				return;
			}
			if (obj.special) {
				if (obj.text.split('.').length > 2) {
					sendMsg(socket, 'eh', 'too_more_ext');
					return;
				}
				if (!existsSync(`./data/drive/${obj.text}`)) {
					sendMsg(socket, 'eh', 'file_not_found');
					return;
				}
				if (obj.special == 'image' && !isImage(obj.text)) {
					sendMsg(socket, 'eh', 'not_a_image');
					return;
				}
			}
			var tm = moment().format('YYYY/MM/DD HH:mm:ss');
			// 如果先前是空列表，使它出现在列表之中
			var uid = check_new(obj.thread, loginStat);
			if (uid != -1 && rmap[uid]) {
				sendMsg(rmap[uid], 'list', {
					data: [
						{
							icon: `/file/usericon/${uid}.png`,
							name: getProfile(uid).userName,
							last: '暂无消息',
							unread: false,
							id: obj.thread,
							count: 0
						}
					]
				});
			}
			if (obj.special) create_msg(obj.thread, loginStat, obj.text, tm, obj.special);
			else create_msg(obj.thread, loginStat, obj.text, tm);
			var th = JSON.parse(readFileSync(`./data/threads/${obj.thread}.json`, 'utf-8'));
			var ren = (obj.special && ((obj.special == 'file' && render_file(obj.text)) || (obj.special == 'image' && render_image(obj.text)))) || markdown.render(obj.text);
			for (var i = 0; i < th.users.length; i++) {
				if (rmap['u' + th.users[i]]) {
					sendMsg(rmap['u' + th.users[i]], 'message', {
						sender: loginStat,
						name: getProfile(loginStat).userName,
						text: ren,
						rawtext: (obj.special && ((obj.special == 'file' && '[文件]') || (obj.special == 'image' && '[图片]'))) || obj.text,
						time: tm,
						thread: obj.thread
					});
					if (view['u' + th.users[i]] != obj.thread) {
						mark_unread(obj.thread, th.users[i], true);
					}
				}
				else {
					mark_unread(obj.thread, th.users[i], true);
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
			if (!Number.isInteger(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			view['u' + loginStat] = obj.thread;
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
			if (!Number.isInteger(obj.thread)) {
				sendMsg(socket, 'eh', 'thread_format');
				return;
			}
			if (!getProfile(loginStat).relationship.groups.includes(obj.thread)) {
				sendMsg(socket, 'eh', 'join_thread');
				return;
			}
			if (!obj) {
				sendMsg(socket, 'eh', 'no_page');
				return;
			}
			if (!Number.isInteger(obj.index)) {
				sendMsg(socket, 'eh', 'ix_format');
				return;
			}
			if (obj.index < 0 || obj.index >= get_hundreds(obj.thread)) {
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
				if (prof.relationship.groups[i] != e && check_new(prof.relationship.groups[i], loginStat) != -1) continue;
				res.data.push(get_thread_info(prof.relationship.groups[i], loginStat));
			}
			sendMsg(socket, 'list', res);
		});

		socket.on('create', function(msg) {
			try {
				var obj = JSON.parse(msg);
			}
			catch (err) {
				sendMsg(socket, 'eh', 'json_format');
				return;
			}
			if (!obj.users || !(obj.users instanceof Array)) {
				sendMsg(socket, 'eh', 'no_users');
				return;
			}
			let s = [loginStat];
			for (var i = 0; i < obj.users.length; i++) {
				if (!/^[1-9][0-9]*$/.test(obj.users[i])) {
					sendMsg(socket, 'eh', 'user_format');
					return;
				}
				if (s.includes(obj.users)) {
					sendMsg(socket, 'eh', 'more_than_once');
					return;
				}
				s.push(obj.users[i]);
			}
			if (!obj.name || typeof(obj.name) != "string" ||obj.name == "") {
				sendMsg(socket, 'eh', 'no_name');
				return;
			}
			let id = create_group(loginStat, obj.name, obj.users);
			let users = obj.users.concat(loginStat);
			create_msg(id, -1, `${getProfile(loginStat).userName} 创建了群聊`, moment().format('YYYY/MM/DD HH:mm:ss'));
			for (var i = 0; i < users.length; i++) {
				if (rmap['u' + users[i]]) {
					sendMsg(rmap['u' + users[i]], 'list', {
						data: [
							{
								icon: `/file/groupicon/${id}.png`,
								name: obj.name,
								last: `${getProfile(loginStat).userName} 创建了群聊`,
								unread: users[i] != loginStat,
								id: id,
								count: 1
							}
						]
					});
				}
			}
		});
	});
}

function sendMsg(socket, type, data) {
    socket.emit(type, JSON.stringify(data));
}
