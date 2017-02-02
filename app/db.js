/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var MongoClient = require('mongodb').MongoClient;

var state = {
    db: null,
};

exports.connect = function(options, done) {
    if (state.db) {
        return done();
    }
    var url = 'mongodb://' + options.host + ':' + options.port + options.name;
    exports.url = url;
    MongoClient.connect(url, function(err, db) {
        if (err) {
            return done(err);
        }
        state.db = db;
        done();
    });
};

exports.get = function() {
    return state.db;
};

exports.close = function(done) {
    if (state.db) {
        state.db.close(function(err, result) {
            state.db = null;
            state.mode = null;
            done(err);
        });
    }
};
