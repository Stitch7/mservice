/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');

module.exports = function (html) {
    var $html = $(html);
    var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;
    var $text = $html.find('body table tr.bg2 td > font');
    var text = $text.text().trim();
    var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

    $text.find('font[face="Courier New"] > a').replaceWith(utils.embedImages($));
    var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

    return {
        previewText: text,
        previewTextHtml: textHtml,
        previewTextHtmlWithImages: textHtmlWithEmbeddedImages
    };
};
