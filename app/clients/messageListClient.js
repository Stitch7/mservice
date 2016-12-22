/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, boardId, threadId, fn) {
        var url = httpClient.baseUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;
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

            fn(data, error);
        });
    };
};
