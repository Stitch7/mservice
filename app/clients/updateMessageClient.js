/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, username, boardId, threadId, messageId, subject, text, fn) {
        var options = {
            jar: res.jar,
            form: {
                mode: 'messageeditsave',
                brdid: boardId,
                msgid: messageId,
                subject: subject,
                body: text
            }
        };

        httpClient.post(res, options, function (html, response) {
            var error = null;

            var title = scrapers.title(html);
            if (title !== httpClient.errors.maniacBoardTitles.confirm) {
                error = 'unknown';
                if (title === httpClient.errors.maniacBoardTitles.error) {
                    var maniacErrorMessage = scrapers.errorMessage(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage];
                    }
                } else if (title === httpClient.errors.maniacBoardTitles.edit) {
                    var maniacErrorMessage2 = scrapers.errorMessage2(html);
                    if (httpClient.errors.maniacMessages[maniacErrorMessage2] !== undefined) {
                        error = httpClient.errors.maniacMessages[maniacErrorMessage2];
                    }
                }
            }

            if (!error) {
                cache.del('message/' + messageId);
                cache.del('message/' + messageId + '-' + username);
                cache.del('messageList/' + threadId);
                cache.del('threadList/' + boardId);
            }

            fn(null, error);
        });
    };
};
