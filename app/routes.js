/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(server, handler, controller) {
    /**
     * Index
     */
    server.get('/', controller.doc.index);
    server.get('/health', controller.health.index);

    /**
     * Boards
     */
    server.get('/boards', controller.boards.index);

    /**
     * Favorites
     */
    server.get('/favorites', handler.auth, controller.favorites.index);
    server.post('/favorites/:threadId', handler.auth, controller.favorites.add);
    server.del('/favorites/:threadId', handler.auth, controller.favorites.remove);

    /**
     * Threads
     */
    server.get('/board/:boardId/threads', controller.threads.index);
    server.get('/board/:boardId/thread/:threadId/mark-as-read', handler.auth, controller.threads.markAsRead);
    server.get('/board/:boardId/thread-for-message/:messageId', controller.threads.threadForMessage);
    server.post('/board/:boardId/search-threads', handler.optionalAuth, controller.threads.search);
    server.post('/board/:boardId/message', controller.threads.create); // Does auth manually

    /**
     * Threads Killfile
     */
    server.get('/killfile/threads', handler.auth, controller.threadKillfile.index);
    server.post('/killfile/threads/:threadId', handler.auth, controller.threadKillfile.add);
    server.del('/killfile/threads/:threadId', handler.auth, controller.threadKillfile.remove);

    /**
     * Messages
     */
    server.get('/board/:boardId/thread/:threadId', handler.optionalAuth, controller.messages.index);
    server.get('/board/:boardId/thread/:threadId/message/:messageId', handler.optionalAuth, controller.messages.show);
    server.get('/board/:boardId/thread/:threadId/message/:messageId/mark-as-read', handler.auth, controller.messages.markAsRead);
    server.post('/board/:boardId/message/preview', controller.messages.preview);
    server.post('/board/:boardId/message/:messageId', controller.messages.create); // Does auth manually
    server.put('/board/:boardId/message/:messageId', handler.auth, controller.messages.update);
    server.get('/board/:boardId/edit-text/:messageId', handler.auth, controller.messages.editText);
    server.get('/board/:boardId/quote/:messageId', controller.messages.quote);
    server.get('/board/:boardId/notification-status/:messageId', handler.auth, controller.messages.notificationStatus);
    server.get('/board/:boardId/notification/:messageId', handler.auth, controller.messages.notification);

    /**
     * Users
     */
    server.get('/test-login', handler.auth, controller.users.login);
    server.get('/user/:userId', controller.users.profile);
    server.get('/user/:username/responses', controller.messages.responses);
    server.get('/user/:username/mark-unread-responses-as-read', handler.auth, controller.messages.markUnreadResponsesAsRead);
    server.get('/latest-user/', controller.users.latest);
    server.post('/read-list', handler.auth, controller.users.importReadList);
    server.get('/users/online', controller.users.online);
};