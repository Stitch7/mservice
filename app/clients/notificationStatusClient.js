/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, boardId, messageId, fn) {
        var url = httpClient.baseUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;
        var options = {
            uri: url,
            jar: res.jar
        };
        httpClient.get(res, options, function (html) {
            var data = null;
            var error = null;
            
            if (scrapers.title(html) === httpClient.errors.maniacBoardTitles.error) {
                error = 'unknown';
                var maniacErrorMessage = scrapers.errorMessage(html);
                if (httpClient.errors.maniacMessages[maniacErrorMessage] !== undefined) {
                    error = httpClient.errors.maniacMessages[maniacErrorMessage];
                }                    
            } else {                    
                data = scrapers.notificationStatus(html);
            }

            fn(data, error);
        });
    };
};
