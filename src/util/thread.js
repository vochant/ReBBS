import {readFileSync, writeFileSync} from './cache.js';
import { getProfile, writeProfile } from './profile.js';
import markdown from './markdown.js';
import 'moment';

export const create_msg = (thread, sender, text, tm) => {
	var th = JSON.parse(readFileSync(`./data/threads/${thread}.json`, "utf-8"));
	if (th.msgs % 1000 == 0) {
		writeFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, '{"db":[]}', "utf-8");
	}
	var original = JSON.parse(readFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, "utf-8"));
	original.db.push({
		content: text,
		time: tm,
		sender: sender
	});
	writeFileSync(`./data/threads/t${thread}blk${Math.floor(th.msgs / 1000)}.json`, JSON.stringify(original), "utf-8");
	th.msgs++;
	writeFileSync(`./data/threads/${thread}.json`, JSON.stringify(th), "utf-8");
}

export const get_msg = (thread, hundreds) => {
	var blkid = Math.floor(hundreds / 10);
	var obj = JSON.parse(readFileSync(`./data/threads/t${thread}blk${blkid}.json`, "utf-8"));
	var upTo = Math.min(100 * ((hundreds % 10) + 1), obj.db.length + 1);
	return obj.db.slice(100 * (hundreds % 10), upTo).map((v) => {
		return {
			content: markdown.render(v.content),
			time: v.time,
			sender: v.sender,
			name: getProfile(v.sender).userName
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
	if (th.msgs == 0) var last_page = {db:[{content:'暂无消息', tm:'N/A', sender:0}]};
	else var last_page = JSON.parse(readFileSync(`./data/threads/t${thread}blk${Math.floor((th.msgs - 1) / 1000)}.json`));
	data.last = (last_page.db[last_page.db.length - 1].sender == 0 ? ':' : (last_page.db[last_page.db.length - 1].sender == user ? '我' : getProfile(last_page.db[last_page.db.length - 1].sender).userName)) + ': ' + last_page.db[last_page.db.length - 1].content;
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