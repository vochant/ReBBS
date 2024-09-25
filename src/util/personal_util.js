import {getProfile} from './profile.js';
import {readFileSync, writeFileSync} from 'fs';
import {htmlenc} from './htmlenc.js';

export const queryPosts = (uid, begin, inhp) => {
	var iprof = getProfile(uid);
	var len = iprof.posts.length, base = len - begin;
	var res = "";
	for (var i = 1; i <= 20; i++) {
		if (base - i < 0) {
			if (i == 1) res = `<div class="mdui-typo">这里什么也没有~</div>`;
			break;
		}
		var tags = "";
		var arprof = JSON.parse(readFileSync(`./data/res/article/${iprof.posts[base - i].id}.json`, "utf8"));
		for (var j = 0; j < iprof.posts[base - i].tags.length; j++) {
			
			tags += `
<div class="mdui-chip">
	<a href="/article/tags/${iprof.posts[base - i].tags[j].id}" class="mdui-chip-title blog-tag">
		${iprof.posts[base - i].tags[j].title}
	</a>
</div> `;
		}
		res += `
<div class="mdui-card blog-article mdui-hoverable">
	<div style="margin:20px;">
		<div class="mdui-card-primary">
			<div class="mdui-row">
				<a class="blog-title mdui-card-primary-title" href="/article/${iprof.posts[base - i].id}">
					${iprof.posts[base - i].title}
				</a><br>
				<div>
					${tags}
				</div>
			</div>
			<div class="mdui-card-primary-subtitle">
				${iprof.posts[base - i].time}
			</div>
			<div class="mdui-float-right mdui-typo mdui-text-color-pink-400" style="user-select: none;">
				<i class="mdui-icon material-icons">visibility</i>
				${arprof.reads}
				<i class="mdui-icon material-icons">thumb_up</i>
				${arprof.likes.length}
				<i class="mdui-icon material-icons">star</i>
				${arprof.favorites.length}
			</div>
		</div>
	</div>
</div>
`;
	}
	if (inhp) {
		res += `<div class="mdui-typo"><a href="/user/${uid}/articles">查看更多</a></div>`;
	}
	return res;
};

export const renderPosts = (uid, page) => {
	var begin = (page - 1) * 20;
	var iprof = getProfile(uid), pages = Math.ceil(iprof.posts.length / 20);
	if (pages == 0) pages = 1;
	var before = page - 1, after = pages - page, s, e;
	if (before + after >= 6) {
		if (before >= 3 && after >= 3) {
			s = page - 3;
			e = page + 3;
		}
		else if (before < 3) {
			s = page - before;
			e = page + 6 - before;
		}
		else {
			s = page - 6 + after;
			e = page + after;
		}
	} else {
		s = page - before;
		e = page + after;
	}
	var res0 = "";
	res0 += `
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="/user/${uid}/articles?page=1">
	<i class="mdui-icon material-icons">arrow_back</i>
</a> 
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="/user/${uid}/articles?page=${page-1}" ${page==1?"disabled":""}>
	<i class="mdui-icon material-icons">chevron_left</i>
</a> `;
	for (var i = s; i <= e; i++) {
		res0 += `
<a class="mdui-btn mdui-btn-icon mdui-ripple ${page==i?"mdui-color-theme-accent":""}" href="/user/${uid}/articles?page=${i}">
	<small>${i}</small>
</a> `;
	}
	res0 += `
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="/user/${uid}/articles?page=${page+1}" ${page==pages?"disabled":""}>
	<i class="mdui-icon material-icons">chevron_right</i>
</a> 
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="/user/${uid}/articles?page=${pages}">
	<i class="mdui-icon material-icons">arrow_forward</i>
</a> `;
	var res1 = queryPosts(uid, begin, false);
	return res0 + res1 + res0;
}

function renderList(prof, users, begin) {
	var res = '<ul class="mdui-list">', len = users.length;
	for (var i = 0; i < 20; i++) {
		if (i + begin >= len) {
			break;
		}
		var xprof = getProfile(users[i + begin]);
		res += `
<li class="mdui-list-item">
	<a class="mdui-list-item-avatar" href="/user/${users[i + begin]}">
		<img src="/file/usericon/${users[i + begin]}.png"/>
	</a>
	<a class="mdui-list-item-content" href="/user/${users[i + begin]}">${htmlenc(xprof.userName)}</a>
		<a href="/user/${users[i + begin]}/subscribes" style="text-decoration:none;color:black;"><strong>关注</strong> ${xprof.relationship.subscribed.length}</a>
		&nbsp;&nbsp;&nbsp;<a href="/user/${users[i + begin]}/fans" style="text-decoration:none;color:black;" num="${xprof.relationship.be_subscribed.length}" id="text${users[i + begin]}"><strong>粉丝</strong> ${xprof.relationship.be_subscribed.length}</a>
	&nbsp;&nbsp;<a class="mdui-btn mdui-btn-raised mdui-ripple mdui-ripple-white mdui-color-theme-200" subsct="${prof.relationship.subscribed.includes(users[i + begin]) ? "idyes": "idno"}" rsubsct="${prof.relationship.be_subscribed.includes(users[i + begin]) ? "idyes" : "idno"}" href="javascript:change_subsc2(${users[i + begin]});" id="u${users[i + begin]}">
		${prof.relationship.subscribed.includes(users[i + begin]) ? 
			prof.relationship.be_subscribed.includes(users[i + begin]) ? "已互关" : "已关注"
			: "关注"
		}
	</a>
</li>
`;
	}
	res += "</ul>";
	return res;
}

function renderMenu(base, current, end) {
	var res = "", before = current - 1, after = end - current, s, e;
	if (before + after >= 6) {
		if (before >= 3 && after >= 3) {
			s = current - 3;
			e = current + 3;
		}
		else if (before < 3) {
			s = current - before;
			e = current + 6 - before;
		}
		else {
			s = current - 6 + after;
			e = current + after;
		}
	} else {
		s = current - before;
		e = current + after;
	}
	res += `
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="${base}?page=1">
	<i class="mdui-icon material-icons">arrow_back</i>
</a> 
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="${base}?page=${current-1}" ${current==1?"disabled":""}>
	<i class="mdui-icon material-icons">chevron_left</i>
</a> `;
	for (var i = s; i <= e; i++) {
		res += `
<a class="mdui-btn mdui-btn-icon mdui-ripple ${current==i?"mdui-color-theme-accent":""}" href="${base}?page=${i}">
	<small>${i}</small>
</a> `;
	}
	res += `
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="${base}?page=${current+1}" ${current==end?"disabled":""}>
	<i class="mdui-icon material-icons">chevron_right</i>
</a> 
<a class="mdui-btn mdui-btn-icon mdui-ripple" href="${base}?page=${end}">
	<i class="mdui-icon material-icons">arrow_forward</i>
</a> `;
	return res;
}

export const renderSubsc = (me, uid, page) => {
	var uprof = getProfile(me), kprof = getProfile(uid);
	if (kprof.relationship.subscribed.length == 0) {
		return `<div class="mdui-typo">暂无关注</div>`;
	}
	var list = renderList(uprof, kprof.relationship.subscribed, (page - 1) * 20);
	var menu = renderMenu(`/user/${uid}/subscribes`, page, Math.ceil(kprof.relationship.subscribed.length / 20));
	return menu + "<br>" + list + "<br>" + menu;
}

export const renderFans = (me, uid, page) => {
	var uprof = getProfile(me), kprof = getProfile(uid);
	if (kprof.relationship.be_subscribed.length == 0) {
		return `<div class="mdui-typo">暂无粉丝</div>`;
	}
	var list = renderList(uprof, kprof.relationship.be_subscribed, (page - 1) * 20);
	var menu = renderMenu(`/user/${uid}/fans`, page, Math.ceil(kprof.relationship.be_subscribed.length / 20));
	return menu + "<br>" + list + "<br>" + menu;
}