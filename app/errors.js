/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var errors = {
    codes: {
        httpBadRequest: 400,
        httpNotFound: 404,
        httpMethodNotAllowed: 405,
        httpInternalServerError: 500,
        unknown: 500,
        emoji: 501,
        connection: 504,
        permission: 403,
        login: 401,
        boardId: 404,
        messageId: 404,
        subject: 400,
        answerExists: 409,
        unchanged: 406,
        threadClosed: 423,
        threadId: 404,
        userId: 404
    },
    messages: {
        httpBadRequest: 'Bad Request',
        httpNotFound: 'Not Found',
        httpMethodNotAllowed: 'Method Not Allowed',
        httpInternalServerError: 'Internal Server Error',
        unknown: 'An unknown error is occured',
        connection: 'Could not connect to maniac server',
        permission: 'Permission denied',
        login: 'Authentication failed',
        boardId: 'boardId not found',
        messageId: 'messageId not found',
        subject: 'Subject not filled',
        answerExists: 'This message was already answered',
        unchanged: 'Data was not changed',
        threadClosed: 'Thread is closed',
        threadId: 'threadId not found',
        userId: 'userId not found',
        emoji: 'Emoji are not supported by ancient pxmboard software'
    },
    maniacMessages: {
        'Bitte geben sie ihren Nickname ein': 'login',
        'Nickname unbekannt': 'login',
        'Passwort ungültig': 'login',
        'Sie sind nicht dazu berechtigt': 'permission',
        'konnte Daten nicht einfügen': 'unchanged',
        'Board id fehlt': 'boardId',
        'message id ungültig': 'messageId',
        'Thema fehlt': 'subject',
        'Auf diese Nachricht wurde bereits geantwortet': 'answerExists',
        'dieser Thread ist geschlossen': 'threadClosed'
    },
    maniacBoardTitles: {
        confirm: '-= board: confirm =-',
        error: '-= board: error =-',
        reply: '-= board: reply =-',
        edit: '-= board: edit =-'
    }
};

module.exports = errors;
