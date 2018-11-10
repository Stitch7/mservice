/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, fn) {
        httpClient.get(res, {}, function (html) {
            fn(scrapers.latestUser(html));
        });
    };
};
