import Router from 'express';
import fileUpload from 'express-fileupload';
import {readFileSync, writeFileSync } from './util/cache.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url'
import Path from 'path'
import iconv from 'iconv-lite';

const router = Router();
router.use(fileUpload({
	limits: {fileSize: 32 * 1024 * 1024}
}));

router.post('/upload', async (req, res) => {
	if (!req.loginStat || req.loginStat == -1) {
		res.status(200).json({error: '没有登录'});
		return;
	}
	if (!req.files || Object.keys(req.files).length === 0) {
		res.status(200).json({error: '没有文件负载'});
		return;
	}
	console.log(`recieve from ${req.loginStat} with size ${req.files.file.size} named ${iconv.decode(req.files.file.name, 'utf-8')}`);
	let file = req.files.file;
	let uname = iconv.decode(file.name, 'utf-8').replaceAll('"', '_').replaceAll('\n', '_').replaceAll("'", '_').replaceAll('\a', '_').replaceAll('\r', '_').replaceAll('\t', '_');
	let ofn = uname.split('/').slice(-1)[0];
	let ext = ofn.includes('.') ? '.' + encodeURIComponent(ofn.split('.').slice(-1)[0]) : '';
	let filename = file.md5 + ext;
	if (existsSync('./data/drive/' + filename)) {
		res.status(200).json({id: filename});
		return;
	}
    await file.mv('./data/drive/' + filename);
	writeFileSync('./data/drive/' + filename + '.json', JSON.stringify({
		url: `/drive/static/${filename}`,
		name: ofn.split('/').slice(-1)[0],
		sender: req.loginStat,
		mimetype: file.mimetype,
		size: file.size
	}), 'utf-8');
	res.status(200).json({id: filename});
});

router.use('/static', Router.static(Path.join(Path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'drive')));

export default router;