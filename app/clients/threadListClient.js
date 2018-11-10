/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(req, res, boardId, fn) {
        var cacheKey = 'threadList/' + boardId;
        var cacheTtl = 300; // 5 minutes
        try {
            var threadList = cache.get(cacheKey, true);
            fn(threadList);
        } catch (error) {
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

                req.on('end', function() {
                    cache.set(cacheKey, data, cacheTtl, function(cacheErr, success) {
                        if (error || !success) {
                            log.error('Failed to cache data for key: ' + cacheKey);
                        }
                    });
                });
            });
        }
    };
};