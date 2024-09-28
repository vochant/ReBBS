import {readFileSync, writeFileSync} from './cache.js';
import { getProfile, writeProfile } from './profile.js';
import { htmlenc } from './htmlenc.js';
import markdown from './markdown.js';
import 'moment';
import { dispFile } from './filedisplay.js';
import crypto from 'crypto';
import Identicon from 'identicon.js';

export const create_msg = (thread, sender, text, tm, special = 'none') => {
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	if (th.msgs % 1000 == 0) {
		writeFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, '{"db":[]}', "utf-8");
	}
	var original = JSON.parse(readFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, "utf-8"));
	let o = {
		content: text,
		time: tm,
		sender: sender
	};
	if (special != 'none') o.special = special;
	original.db.push(o);
	writeFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, JSON.stringify(original), "utf-8");
	th.msgs++;
	writeFileSync(`./data/threads/${thread}.json`, JSON.stringify(th), "utf-8");
}

export const render_file = (id) => {
	let conf = JSON.parse(readFileSync('./data/drive/' + id + '.json', 'utf-8'));
	let url = conf.url;
	let name = conf.name;
	return `<i class="mdui-icon material-icons">insert_drive_file</i><b>文件: </b>${htmlenc(name)}<br><a style="margin:5px;" class="mdui-btn mdui-color-theme-accent" href="${url}" download="${name}"><i class="mdui-icon material-icons">file_download</i>download</a><br><a style="margin:5px;" class="mdui-btn mdui-color-theme-accent" href="${url}"><i class="mdui-icon material-icons">remove_red_eye</i>preview</a><br>${dispFile(conf)}`;
}

export const render_image = (id) => {
	return `<img src="/drive/static/${id}" title="Image" />`;
}

export const get_msg = (thread, hundreds) => {
	var blkid = Math.floor(hundreds / 10);
	var obj = JSON.parse(readFileSync(`./data/threads/t${thread}blk${blkid}.json`, "utf-8"));
	var upTo = Math.min(100 * ((hundreds % 10) + 1), obj.db.length + 1);
	return obj.db.slice(100 * (hundreds % 10), upTo).map((v) => {
		return {
			content: (v.special && ((v.special == 'file' && render_file(v.content)) || (v.special == 'image' && render_image(v.content)))) || markdown.render(v.content),
			time: v.time,
			sender: v.sender,
			name: getProfile(v.sender).userName,
			special: v.special || 'none'
		};
	});
}

export const get_hundreds = (thread) => {
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	return Math.ceil(th.msgs / 100.0);
}

export const mark_unread = (thread, user, stat) => {
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	let userIndex = th.users.indexOf(user);
	th.unread[userIndex] = stat;
	writeFileSync(`./data/threads/${thread}.json`, JSON.stringify(th), 'utf-8');
}

export const get_private = (u0, u1) => {
	var prof = getProfile(u0);
	if (prof.relationship.contact['u' + u1]) {
		return prof.relationship.contact['u' + u1];
	}
	else {
		var ttl = JSON.parse(readFileSync('./data/threads/total.json', 'utf-8'));
		ttl.count++;
		writeFileSync('./data/threads/total.json', JSON.stringify(ttl), 'utf-8');
		var pf0 = getProfile(u0);
		pf0.relationship.groups.push(ttl.count - 1);
		pf0.relationship.contact['u' + u1] = ttl.count - 1;
		writeProfile(u0, pf0);
		var pf1 = getProfile(u1);
		pf1.relationship.groups.push(ttl.count - 1);
		pf1.relationship.contact['u' + u0] = ttl.count - 1;
		writeProfile(u1, pf1);
		writeFileSync(`./data/threads/${ttl.count - 1}.json`, JSON.stringify({
			users: [u0, u1],
			ops: [],
			owner: -1,
			unread: [false, false],
			msgs: 0
		}), 'utf-8');
		return ttl.count - 1;
	}
}

export const check_new = (thread, user) => {
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	if (th.owner == -1 && th.msgs == 0) {
		return th.users[0] == user ? th.users[1] : th.users[0];
	}
	return -1;
}

export const get_thread_info = (thread, user) => {
	// console.log(thread, user);
	var data = {};
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	if (th.msgs == 0) var last_page = {db:[{content:'暂无消息', tm:'N/A', sender:-1, special: 'none'}]};
	else var last_page = JSON.parse(readFileSync(`./data/threads/t${thread}blk${Math.floor((th.msgs - 1) / 1000)}.json`));
	if (last_page.db[last_page.db.length - 1].special == 'image') data.last = '[图片]';
	else if (last_page.db[last_page.db.length - 1].special == 'file') data.last = '[文件]';
	else data.last = (last_page.db[last_page.db.length - 1].sender == -1 ? ':' : (last_page.db[last_page.db.length - 1].sender == user ? '我' : getProfile(last_page.db[last_page.db.length - 1].sender).userName)) + ': ' + last_page.db[last_page.db.length - 1].content;
	data.unread = th.unread[th.users.indexOf(user)];
	data.id = thread;
	data.count = th.msgs;
	if (th.owner == -1) {
		var side = th.users[0] == user ? th.users[1] : th.users[0];
		data.icon = `/file/usericon/${side}.png`;
		data.name = getProfile(side).userName;
	}
	else {
		data.icon = `/file/groupicon/${thread}.png`;
		data.name = th.name;
	}
	return data;
}

export const create_group = function(owner, name, users) {
	var ttl = JSON.parse(readFileSync('./data/threads/total.json', 'utf-8'));
	ttl.count++;
	writeFileSync('./data/threads/total.json', JSON.stringify(ttl), 'utf-8');
	var pf = getProfile(owner);
	pf.relationship.groups.push(ttl.count - 1);
	writeProfile(owner, pf);
	for (var i = 0; i < users.length; i++) {
		let ipf = getProfile(users[i]);
		ipf.relationship.groups.push(ttl.count - 1);
		writeProfile(users[i], ipf);
	}
	writeFileSync(`./data/threads/${ttl.count - 1}.json`, JSON.stringify({
		users: users.concat(owner),
		ops: [owner],
		owner: owner,
		unread: Array(users.length + 1).fill(false),
		msgs: 0,
		name: name
	}), 'utf-8');
	const MD5 = crypto.createHash("md5");
	MD5.update(name);
	let img = new Identicon(MD5.digest('hex')).toString()
	var dataBuffer = Buffer.from(img, 'base64');
	writeFileSync(`./web/groupicon/${ttl.count - 1}.png`, dataBuffer, function(error) {
		if (error) {
			err = true;
		}
	});
	return ttl.count - 1;
}

export const join_group = function(thread, users, op) {
	let th = JSON.parse(readFileSync(`./data/thread/${thread}.json`, 'utf-8'));
	if (th.owner == -1) return {status: 1};
	if (!th.ops.includes(op)) return {status: 2};
	for (var i = 0; i < users.length; i++) {
		if (th.users.includes(users[i])) return {status: 3, payload: users[i]};
	}
	th.users = th.users.concat(users);
	th.unread = th.unread.concat(Array(users.length).fill(false));
	writeFileSync(`./data/thread/${thread}.json`, JSON.stringify(th), 'utf-8');
	for (var i = 0; i < users.length; i++) {
		let ipf = getProfile(users[i]);
		ipf.relationship.groups.push(thread);
		writeProfile(users[i], ipf);
	}
	return {status: 0};
}

export const exit_group = function(thread, user, op) {
	let th = JSON.parse(readFileSync(`./data/thread/${thread}.json`, 'utf-8'));
	if (th.owner == -1) return {status: 1};
	if (!th.ops.includes(op)) return {status: 2};
	if (!th.users.includes(user)) return {status: 3};
	let index = th.users.indexOf(user);
	th.users = th.users.filter((v, k) => {return k != index});
	th.unread = th.unread.filter((v, k) => {return k != index});
	writeFileSync(`./data/thread/${thread}.json`, JSON.stringify(th), 'utf-8');
	let pf = getProfile(user);
	pf.relationship.groups = pf.relationship.groups.filter((v) => {return v != thread});
	writeProfile(user, pf);
	return {status: 0};
}

export const make_op = function(thread, user, op, stat) {
	let th = JSON.parse(readFileSync(`./data/thread/${thread}.json`, 'utf-8'));
	if (th.owner != op) return {status: 1};
	if (!th.users.includes(user)) return {status: 2};
	if (user == th.owner) return {status: 3};
	if (stat) {
		if (!th.ops.includes(user)) th.ops.push(user);
	}
	else {
		th.ops = th.ops.filter((v) => {v != user});
	}
	writeFileSync(`./data/thread/${thread}.json`, JSON.stringify(th), 'utf-8');
	return {status: 0};
}