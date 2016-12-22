/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(client, responses) {
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
