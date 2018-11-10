/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

module.exports = function (html) {
    var quote = $(html).find('textarea').text().trim();

    return {
        quote: quote
    };
};
