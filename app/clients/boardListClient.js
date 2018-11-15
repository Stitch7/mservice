/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, fn) {
        var cacheKey = 'boards';
        var cacheTtl = 86400; // 1 day
        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            httpClient.get(res, {}, function (html) {
                var boards = scrapers.boards(html);
                fn(boards);
            });
        });
    };
};
