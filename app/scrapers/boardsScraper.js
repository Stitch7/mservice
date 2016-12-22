/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');
var board = require('./../models/board.js');

module.exports = function (html) {
    var boards = [];

    $(html).find('div > table table:nth-child(3) tr.bg2').each(function () {
        var $tr = $(this);
        var $idAndTitleA = $tr.find('td:nth-child(2) a');
        var regexResult = /\?mode=board&brdid=(.+)/.exec($idAndTitleA.attr('href'));
        var idStr = regexResult !== null ? regexResult[1] : "6";
        var id = utils.toInt(idStr);
        var name = $idAndTitleA.text();
        var topic = $tr.find('td:nth-child(3)').text();
        var lastMessage = utils.datetimeStringToISO8601($tr.find('td:nth-child(4)').text());
        var mods = $tr.find('td:nth-child(5)').text().trim().split('\n').map(function(e){return e.trim();});

        boards.push(new board(id, name, topic, lastMessage, mods));
    });

    return boards;
};
