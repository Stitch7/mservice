/**
 * M!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, fn) {
        var url = httpClient.baseUrl + '?mode=useronline';
        var cacheKey = 'whosOnline';
        var cacheTtl = 60; // 1 Minute
        try {
            var data = cache.get(cacheKey, true);
            fn(data);
        } catch(error) {
            httpClient.get(res, url, function (html) {
                var data = scrapers.whosOnline(html);
                cache.set(cacheKey, data, cacheTtl, function(cacheErr, success) {
                    if (error || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });
                fn(data);
            });
        }
    };
};
