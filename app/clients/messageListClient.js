/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, boardId, threadId, fn) {
        var url = httpClient.baseUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;
        var cacheKey = 'messageList/' + threadId;
        var cacheTtl = 120; // 2 minutes
        try {
            var messageList = cache.get(cacheKey, true);
            fn(messageList);
        } catch(error) {
            httpClient.get(res, url, function (html) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'boardId';
                } else if (scrapers.emptyPage(html)) {
                    error = 'threadId';
                } else {
                    data = scrapers.messageList(html);
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
