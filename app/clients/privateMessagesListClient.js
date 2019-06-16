/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(res, username, fn) {
        var cacheKey = 'private-messages' + '/' + username;
        var cacheTtl = 60; // 1 minute
        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var url = httpClient.baseUrl + '?mode=privatemessagelist&type=inbox';
            var options = {
                uri: url,
                jar: res.jar
            };
            httpClient.get(res, options, function (html) {
                var conversationsByName = {};
                scrapers.privateMessagesList(html, 'inbox').forEach(function (pm) {
                    if (conversationsByName[pm.username] === undefined) {
                        conversationsByName[pm.username] = {};
                        conversationsByName[pm.username].messages = [pm];
                    } else {
                        conversationsByName[pm.username].messages.push(pm);
                    }
                    delete pm.username;
                });

                var url = httpClient.baseUrl + '?mode=privatemessagelist&type=outbox';
                var options = {
                    uri: url,
                    jar: res.jar
                };
                httpClient.get(res, options, function (html) {
                    scrapers.privateMessagesList(html, 'outbox').forEach(function (pm) {
                        if (conversationsByName[pm.username] === undefined) {
                            conversationsByName[pm.username] = {};
                            conversationsByName[pm.username].messages = [pm];
                        } else {
                            conversationsByName[pm.username].messages.push(pm);
                        }
                        delete pm.username;
                    });

                    var sortByDate = function (a, b) {
                        if (a.date > b.date) {
                            return -1;
                        } else {
                            return 1;
                        }
                    };
                    var conversationsOrdered = [];
                    for (var key in conversationsByName) {
                        if (conversationsByName.hasOwnProperty(key)) {
                            var messages = conversationsByName[key].messages;
                            messages.sort(sortByDate);
                            conversationsOrdered.push({username: key, messages: messages});
                        }
                    }
                    conversationsOrdered.sort(function (a, b) {
                        var aLastMessage = a.messages[a.messages.length - 1];
                        var bLastMessage = b.messages[b.messages.length - 1];
                        return sortByDate(aLastMessage, bLastMessage);
                    });

                    fn(conversationsOrdered);

                });
            });
        });
    };
};
