/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, userId, fn) {
        var url = httpClient.baseUrl + '?mode=userprofile&usrid=' + userId;
        var cacheKey = 'userProfile/' + userId;
        var cacheTtl = 3600; // 1 hour
        try {
            var userProfile = cache.get(cacheKey, true);
            fn(userProfile);
        } catch(error) {
            httpClient.get(res, url, function (html) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'userId';
                } else {
                    data = scrapers.user(httpClient.baseUrl, userId, html);
                }

                cache.set(cacheKey, data, cacheTtl, function(cacheErr, success) {
                    if (error || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });
                fn(data, error);
            });
        }
    };
};
