import MarkdownIt from 'markdown-it';
import MarkdownItKatex from 'markdown-it-katex';
import MarkdownItImsize from 'markdown-it-imsize';
import MarkdownItFootnote from 'markdown-it-footnote';
import MarkdownItHighlightJS from 'markdown-it-highlightjs';
import MarkdownItSub from 'markdown-it-sub';
import MarkdownItSup from 'markdown-it-sup';
import MarkdownItSpoiler from 'markdown-it-spoiler'
import MarkdownItMark from 'markdown-it-mark'
import MarkdownItMergeCells from 'markdown-it-merge-cells'
import { Media } from './markdown-it-media.js'

var markdown = MarkdownIt({
    html: false,
    linkify: true,
	typographer: true
});

markdown.use(MarkdownItKatex);
markdown.use(MarkdownItImsize);
markdown.use(MarkdownItFootnote);
markdown.use(MarkdownItHighlightJS, {inline: true});
markdown.use(MarkdownItSub);
markdown.use(MarkdownItSup);
markdown.use(MarkdownItSpoiler);
markdown.use(MarkdownItMark);
markdown.use(Media);
markdown.use(MarkdownItMergeCells);

export default markdown;