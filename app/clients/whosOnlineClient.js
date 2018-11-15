/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, fn) {
        var url = httpClient.baseUrl + '?mode=useronline';
        var cacheKey = 'whosOnline';
        var cacheTtl = 60; // 1 Minute

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            httpClient.get(res, url, function (html) {
                var data = scrapers.whosOnline(html);
                fn(data);
            });
        });
    };
};
