/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(log, client, db, responses) {
    return {
        /**
         * Index action
         */
        index: function (req, res, next) {
            responses.html(res, 'Ok', null, next);
        }
    };
};
