/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, fn) {
        var cacheKey = 'boardList';
        var cacheTtl = 86400; // 1 day
        try {
            var boardList = cache.get(cacheKey, true);
            fn(boardList);
        } catch(error) {
            httpClient.get(res, {}, function (html) {
                var boards = scrapers.boards(html)
                cache.set(cacheKey, boards, cacheTtl, function(error, success) {
                    if (error || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });
                fn(boards);
            });
        }
    };
};
