# ReBBS

ReBBS 是一款 BBS (电子公告栏系统)，使用 Node.js 技术开发，适合小规模使用，不使用数据库，数据全部为 JSON格式。

目前已经实现的功能：

- 个人主页
- 个人设置
- 管理员操作界面
- 信息文档
- 静态文件
- 错误界面
- 博文界面（框架）

待实现的功能：

- 浏览博文
- 私信
- 个人 Blog
- 高级管理员操作界面
- 用户举报系统
- 部分 Markdown 语法
- 群组

## 安装

克隆并切换到项目目录，运行：

```shell
npm install
```

然后复制 `data-template` 目录，取名为 `data`。

## 运行

切换到项目目录，运行：

```shell
npm start
```

或

```shell
node index.js
```

待命令行出现文本 `Port :xxx is opened`，访问对应端口即可。通常使用 `80` 端口，访问 `localhost` 即可。如有需要，也可以打开 `data/profile.json`，更改端口为其他值，如 `443`（HTTPS 的默认端口） 或 `8080`（常用于调试）。

## 安全性

本系统使用 AES 算法加密用户的登录信息，默认密钥是 `0123456789abcdeffedcba9876543210`，位于 `data/profile.json`。强烈建议您把它换成其他密钥。
