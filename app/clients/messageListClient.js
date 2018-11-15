/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');

module.exports = function(log, httpClient, sharedCache, scrapers) {
    return function(req, res, db, threadListClient, boardId, threadId, fn) {
        var cacheKey = 'messageList/' + threadId;
        var cacheTtl = 120; // 2 minutes

        sharedCache.getAndReturnOrFetch(cacheKey, cacheTtl, fn, function(fn) {
            var url = httpClient.baseUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;
            httpClient.get(res, url, function(html) {
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

                req.on('end', function() {
                    threadListClient(req, res, req.params.boardId, function(threadList, error) {
                        var correspondingThread;
                        threadList.forEach(function(thread) {
                            if (thread.id == threadId) {
                                correspondingThread = thread;
                            }
                        });

                        if (!correspondingThread) {
                            console.log("############################################################");
                            console.log("## !! CORESPONDING THREAD (" + threadId + ") NOT FOUND !! ##");
                            console.log("############################################################");
                            return;
                        }

                        var messagelist = db.get().collection('messagelist');
                        var query = {
                            boardId: utils.toInt(boardId),
                            threadId: utils.toInt(threadId),
                        };
                        messagelist.find(query).toArray(function(err, result) {
                            if (err) {
                                log.error(err);
                            } else if (result.length === 0) {
                                var newEntry = query;
                                newEntry.threadSubject = correspondingThread.subject;
                                newEntry.thread = correspondingThread;
                                newEntry.messages = data;
                                messagelist.insert([newEntry], function(err, result) {
                                    if (err) {
                                        log.error(err);
                                        return;
                                    }
                                    console.log("INSERTTED DA DING");
                                });
                            } else {
                                messagelist.update(query, { $set: { thread: correspondingThread, messages: data } }, function(err, numUpdated) {
                                    if (err) {
                                        log.error(err);
                                        return;
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    };
};
