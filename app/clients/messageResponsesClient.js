/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * Copyright(c) 2017 Matthias Kuech.
 * MIT Licensed
 */
'use strict';

var _ = require('underscore');
var response = require('./../models/response.js');

module.exports = function(log, httpClient, cache, scrapers) {
    return function(res, userId, fn) {

        var responses = [];

        var cachedMessageLists = cache.keys().filter(function(word) {
                return /^messageList/.test(word);
        });

        log.debug("Searching responses in cached message lists: " + cachedMessageLists);

        var messages = [];

        //TODO Use the numerical userId instead of the user name itself
        var username = userId;

        function getParentBoardId(threadId) {
            var boardList = cache.get("boardList");
            return _.find(boardList, function(m,i) {
                log.debug("Getting: threadList/" + m.id + " in the search for threadId " + threadId);
                var threadList = cache.get("threadList/"+m.id);
                var index = _.findIndex(threadList, {'id': parseInt(threadId)});
                return index > -1;
            }).id;
        }


        function getParentThreadId(messageId) {
            return messageId.split("/")[1];
        }

        _.each(cachedMessageLists, function(cachedMessage,i) {

            messages = cache.get(cachedMessage);
            _.each(messages, function(m,i) {

                    if (i>0)
                    {
                        var previousMessage = messages[i-1];

                        if (previousMessage.level +1 == m.level &&
                            previousMessage.username == username)
                        {
                            var parentThreadId = getParentThreadId(cachedMessage);
                            var parentBoardId = getParentBoardId(parentThreadId);

                            responses.push(new response(parentBoardId, parentThreadId, m.messageId, m.subject, m.username, m.date ));
                        }
                    }

            });
        });


        fn(responses, null);
    };
};
