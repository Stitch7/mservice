/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, userId, fn) {
        var url = httpClient.baseUrl + '?mode=userprofile&usrid=' + userId;
        var cacheKey = 'userProfile/' + userId;
        var cacheTtl = 3600; // 1 hour

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            httpClient.get(res, url, function (html) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'userId';
                } else {
                    data = scrapers.user(httpClient.baseUrl, userId, html);
                }

                fn(data, error);
            });
        });
    };
};
