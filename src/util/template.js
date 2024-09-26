import {readFileSync, writeFileSync} from 'fs';
import {htmlenc} from './htmlenc.js';

export const Template = (config, hypertext) => {
	var prof = JSON.parse(readFileSync('./data/profile.json'));
	return `
<!DOCTYPE HTML>
<html lang="zh-CN" class="mdui-theme-layout-auto mdui-theme-primary-cyan mdui-theme-accent-pink mdui-appbar-with-toolbar">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<link rel="shortcut icon" type="image/png" href="/file/sitelogo.png" />
		<meta property="og:title" content="关于 Minphtis BBS" />
		<meta property="og:site_name" content="Minphtis BBS" />
		<meta property="og:description" content="Minphtis BBS 是一个自由、开放的社区。我们允许不同的声音，希望能带给用户一个优秀的社区体验。" />
		<meta property="og:type" content="website" />
		<title>${config.title} - ${prof.title}</title>
		<link rel="stylesheet" href="/file/css/mdui.min.css"/>
		<link rel="stylesheet" href="/file/css/index.css"/>
		<link rel="stylesheet" href="/file/css/atom-one-light.min.css"/>
		<link rel="stylesheet" href="/file/css/katex.min.css"/>
		<script src="/file/js/mdui.min.js"></script>
		<script src="/file/js/jquery-3.7.0.min.js"></script>
		<script src="/file/js/highlight.min.js"></script>
		<script defer src="/file/js/index.js"></script>
		${config.head}
	</head>
	<body class="mdui-loaded">
		<div id="page">
			<header class="mdui-appbar mdui-appbar-fixed">
				<div class="mdui-toolbar mdui-color-theme-100">
					<span class="mdui-btn mdui-btn-icon mdui-ripple mdui-ripple-white" mdui-drawer="{target:'#main-drawer',swipe:true}">
						<i class="mdui-icon material-icons">menu</i>
					</span>
					<a class="mdui-btn mdui-btn-icon mdui-ripple mdui-ripple-white" href="/">
						<i class="mdui-icon material-icons">home</i>
					</a>
					<a class="mdui-typo-title" id="mytitle">${htmlenc(config.title)} - ${htmlenc(prof.title)}</a>
					${config.isLogged ? `
					<div class="mdui-toolbar-spacer"></div>
					<a href="/message" class="mdui-btn mdui-btn-icon">
						<i class="mdui-icon material-icons">drafts</i>
					</a>
					<a href="/notifications" class="mdui-btn mdui-btn-icon">
						<i class="mdui-icon material-icons">notifications</i>
					</a>
					<a class="mdui-btn mdui-btn-icon" mdui-menu="{target:'#user-opt'}">
						<img class="mdui-img-fluid mdui-img-circle" src="/file/usericon/${config.uid}.png">
					</a>
					<ul class="mdui-menu" id="user-opt">
						<li class="mdui-menu-item">
							<a href="/user/${config.uid}" class="mdui-ripple">${htmlenc(config.userName)}</a>
						</li>
						<li class="mdui-menu-item">
							<a href="/settings/" class="mdui-ripple">
							<i class="mdui-menu-item-icon mdui-icon material-icons">settings</i>用户设置
							</a>
						</li>
						<li class="mdui-menu-item">
							<a href="/message" class="mdui-ripple">
							<i class="mdui-menu-item-icon mdui-icon material-icons">drafts</i>消息
							</a>
						</li>
						<li class="mdui-menu-item">
							<a href="/notifications" class="mdui-ripple">
							<i class="mdui-menu-item-icon mdui-icon material-icons">notifications</i>通知
							</a>
						</li>
						<li class="mdui-menu-item">
							<a href="/article_manage" class="mdui-ripple">
							<i class="mdui-menu-item-icon mdui-icon material-icons">book</i>讨论管理
							</a>
						</li>
						<li class="mdui-divider"></li>
						<li class="mdui-menu-item">
							<a href="/logout" class="mdui-ripple">退出登录</a>
						</li>
						${config.isReplace ? `
						<li class="mdui-menu-item">
							<a href="/custom_logout" class="mdui-ripple">结束替换</a>
						</li>
						` : ``}
					</ul>` : `
					<div class="mdui-toolbar-spacer"></div>
					<a class="mdui-btn mdui-btn-icon" mdui-menu="{target:'#user-opt'}">
						<img class="mdui-img-fluid mdui-img-circle" src="/file/default_icon.png">
					</a>
					<ul class="mdui-menu" id="user-opt">
						<li class="mdui-menu-item">
							<a class="mudi-ripple">未登录</a>
						</li>
						<li class="mdui-divider"></li>
						<li class="mdui-menu-item">
							<a href="/login" class="mdui-ripple">登录</a>
							<a href="/regist" class="mdui-ripple">注册</a>
						</li>
					</ul>
					`}
				</div>
				<div class="mdui-tab mdui-color-theme-100">
					<a href="/" class="mdui-ripple mdui-ripple-white">主页</a>
					<a href="/article" class="mdui-ripple mdui-ripple-white">论坛</a>
					<a href="/share" class="mdui-ripple mdui-ripple-white">动态</a>
					<a href="/tools" class="mdui-ripple mdui-ripple-white">工具</a>
				</div>
			</header>
			<div class="mc-drawer mdui-drawer mdui-shadow-6 mdui-drawer-close" id="main-drawer" style="background-color: #fff">
				<div class="mdui-list" id="drawer-list">
					${config.drawer}
					<a class="mdui-list-item mdui-ripple" href="/">
						<i class="mdui-list-item-icon mdui-icon material-icons">home</i>
						<div class="mdui-list-item-content">回到主页</div>
					</a>
					<a class="mdui-list-item mdui-ripple" href="/about">
						<i class="mdui-list-item-icon mdui-icon material-icons">info</i>
						<div class="mdui-list-item-content">关于</div>
					</a>
					<a class="mdui-list-item mdui-ripple" href="/help">
						<i class="mdui-list-item-icon mdui-icon material-icons">help</i>
						<div class="mdui-list-item-content">帮助</div>
					</a>
					${config.isAdmin ? `
					<div class="mdui-divider"></div>
					<a class="mdui-list-item mdui-ripple" href="/admin">
						<i class="mdui-list-item-icon mdui-icon material-icons">dashboard</i>
						<div class="mdui-list-item-content">后台管理</div>
					</a>
					` : ""}
				</div>
			</div>
			<div class="mdui-container" id="main-container">
				<div class="mdui-container-fluid mdui-shadow-3 mdui-hoverable" id="inner-container">
					${hypertext}
				</div>
			</div>
			<footer id="footer">
				<div style="padding: 20px; color: #fff" class="mdui-typo">
					Copyright (C) 2009-2024 Mirekintoc Void.<br>
					<a href="/report">用户服务中心/举报/反馈</a> | <a href="/redirect/gh">GitHub仓库</a> | <a href="/eula">《最终用户许可协议》</a><br>
					<script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
					<span id="busuanzi_value_page_pv"></span> / <span id="busuanzi_value_site_pv"></span> 次访问共 <span id="busuanzi_value_site_uv"></span> 人<br>
					<a href="mailto:vochant@outlook.com">联系站长</a>
				</div>
			</footer>
		</div>
	</body>
</html>`;
}