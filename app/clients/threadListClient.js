/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, db, boardId, fn) {
        var url = httpClient.baseUrl + '?mode=threadlist&brdid=' + boardId;
        var cacheKey = 'threadList/' + boardId;
        var cacheTtl = 300; // 5 minutes
        try {
            var threadList = cache.get(cacheKey, true);
            fn(threadList);
        } catch(error) {
            httpClient.get(res, url, function (html) {
                var data = null;
                var error = null;

                if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                    error = 'boardId';
                } else {
                    data = scrapers.threadList(html);
                }

                cache.set(cacheKey, data, cacheTtl, function(cacheErr, success) {
                    if (error || !success) {
                        log.error('Failed to cache data for key: ' + cacheKey);
                    }
                });

                var threadlist = db.get().collection('threadlist');
                data.forEach(function(thread) {
                    var query = {
                        threadId: parseInt(thread.id),
                    };
                    threadlist.find(query).toArray(function (err, result) {
                        if (err) {
                            log.error(err);
                        } else if (result.length === 0) {
                            threadlist.insert([thread], function (err, result) {
                                if (err) {
                                    log.error(err);
                                }
                            });
                        }
                    });
                });

                fn(data, error);
            });
        }
    };
};
