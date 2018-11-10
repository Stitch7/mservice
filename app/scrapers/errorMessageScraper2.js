/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');

module.exports = function (html) {
    return $($(html).find('tr.bg1 td').get(1)).text();
};
