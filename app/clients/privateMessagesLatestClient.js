/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, username, fn) {
        var limit = 5;

        var url = httpClient.baseUrl + '?mode=privatemessagelist&type=inbox';
        var options = {
            uri: url,
            jar: res.jar
        };
        httpClient.get(res, options, function (html) {
            var privateMessages = [];
            scrapers.privateMessagesList(html, 'inbox', limit).forEach(function (pm) {
                privateMessages.push(pm);
            });

            fn(privateMessages);
        });
    };
};
