/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Index action
         */
        index: function (req, res, next) {
            client.boardList(res, function (boards) {
                responses.json(res, boards, null, next);
            });
        }
    };
};
