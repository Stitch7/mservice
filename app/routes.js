/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(server, handler, controller) {
    /**
     * Index
     */
    server.get('/', controller.doc.index);

    /**
     * Boards
     */
    server.get('/boards', controller.boards.index);

    /**
     * Threads
     */
    server.get('/board/:boardId/threads', controller.threads.index);
    server.get('/board/:boardId/thread/:threadId/mark-as-read', handler.auth, controller.threads.markAsRead);
    server.post('/board/:boardId/search-threads', handler.optionalAuth, controller.threads.search);
    server.post('/board/:boardId/message', controller.threads.create); // Does auth manually

    /**
     * Messages
     */
    server.get('/board/:boardId/thread/:threadId', handler.optionalAuth, controller.messages.index);
    server.get('/board/:boardId/thread/:threadId/message/:messageId', handler.optionalAuth, controller.messages.show);
    server.get('/board/:boardId/thread/:threadId/message/:messageId/mark-as-read', handler.auth, controller.messages.markAsRead);
    server.post('/board/:boardId/message/preview', controller.messages.preview);
    server.post('/board/:boardId/message/:messageId', controller.messages.create); // Does auth manually
    server.put('/board/:boardId/message/:messageId', handler.auth, controller.messages.update);
    server.get('/board/:boardId/quote/:messageId', controller.messages.quote);
    server.get('/board/:boardId/notification-status/:messageId', handler.auth, controller.messages.notificationStatus);
    server.get('/board/:boardId/notification/:messageId', handler.auth, controller.messages.notification);
    server.get('/user/:username/responses', controller.messages.responses);


    /**
     * Users
     */
    server.get('/test-login', handler.auth, controller.users.login);
    server.get('/user/:userId', controller.users.profile);
    server.get('/latest-user/', controller.users.latest);
    server.post('/read-list', handler.auth, controller.users.importReadList);
};
