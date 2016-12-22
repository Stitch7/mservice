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
    server.post('/board/:boardId/search-threads', controller.threads.search);
    server.post('/board/:boardId/message', controller.threads.create); // TODO: Does auth manually atm
    
    /**
     * Messages
     */
    server.get('/board/:boardId/thread/:threadId', controller.messages.index);
    server.get('/board/:boardId/message/:messageId', handler.optionalAuth, controller.messages.show);
    server.post('/board/:boardId/message/preview', controller.messages.preview);    
    server.post('/board/:boardId/message/:messageId', controller.messages.create); // TODO: Does auth manually atm            
    server.put('/board/:boardId/message/:messageId', handler.auth, controller.messages.update);    
    server.get('/board/:boardId/quote/:messageId', controller.messages.quote);
    server.get('/board/:boardId/notification-status/:messageId', handler.auth, controller.messages.notificationStatus);
    server.get('/board/:boardId/notification/:messageId', handler.auth, controller.messages.notification);    

    /**
     * Users
     */
    server.get('/test-login', handler.auth, controller.users.login);
    server.get('/user/:userId', controller.users.profile);
    server.get('/latest-user/', controller.users.latest);
};
