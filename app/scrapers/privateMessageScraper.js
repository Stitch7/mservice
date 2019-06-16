/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

var utils = require('./../utils.js');
var message = require('./../models/message.js');

module.exports = function (html, type) {
    var message = {};
    var $html = $(html);
    var $bg1TDs = $html.find('body table tr.bg2');
    var $textTD = $($bg1TDs.get(1)).find('td');

    message.text = $textTD.text().trim();
    message.textHtml = $textTD.html().trim();

    return message;
};
