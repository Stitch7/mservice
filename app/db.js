/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
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
    var url = 'mongodb://' + options.host + ':' + options.port;
    exports.url = url;
    var connectOptions = { useNewUrlParser: true };
    MongoClient.connect(url, connectOptions, function(err, client) {
        if (err) {
            return done(err);
        }
        state.db = client.db(options.name);
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
