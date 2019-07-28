/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(req, res, boardId, fn) {
        var cacheKey = 'threadList/' + boardId;
        var cacheTtl = 120; // 2 minutes

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var url = httpClient.baseUrl + '?mode=threadlist&brdid=' + boardId;
            httpClient.get(res, url, function(html) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'boardId';
                } else {
                    data = scrapers.threadList(html, boardId);
                }

                fn(data, error);
            });
        });
    };
};
