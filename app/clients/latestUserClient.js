/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, fn) {
        httpClient.get(res, {}, function (html) {
            fn(scrapers.latestUser(html));
        });
    };
};
