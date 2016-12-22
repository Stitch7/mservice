/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, boardId, fn) {
        var url = httpClient.baseUrl + '?mode=threadlist&brdid=' + boardId;
        httpClient.get(res, url, function (html) {
            var data = null;
            var error = null;

            if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                error = 'boardId';
            } else {
                data = scrapers.threadList(html);
            }

            fn(data, error);
        });
    };
};
