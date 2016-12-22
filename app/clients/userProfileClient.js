/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, userId, fn) {
        var url = httpClient.baseUrl + '?mode=userprofile&usrid=' + userId;
        httpClient.get(res, url, function (html) {
            var data = null;
            var error = null;

            if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                error = 'userId';
            } else {
                data = scrapers.user(userId, html);
            }

            fn(data, error);
        });
    };
};
