/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

module.exports = function (html) {
    var editText = $(html).find('textarea').text().trim();

    return {
        editText: editText
    };
};
