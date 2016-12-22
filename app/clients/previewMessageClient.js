/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(httpClient, scrapers) {
    return function(res, boardId, text, fn) {
        var options = {
            form: {
                mode: 'messagesave',
                brdid: boardId,
                body: text,
                preview_x: 'preview'
            }
        };

        httpClient.post(res, options, function (html, response) {
            var data = null;
            var error = null;

            if (scrapers.title(html) !== httpClient.errors.maniacBoardTitles.reply) {
                error = 'unknown';
                var maniacErrorMessage = scrapers.errorMessage(html);
                if (httpClient.errors.maniacMessages[maniacErrorMessage] !== undefined) {
                    error = httpClient.errors.maniacMessages[maniacErrorMessage];
                }                    
            } else {
                data = scrapers.preview(html);
            }

            fn(data, error);
        });
    };
};
