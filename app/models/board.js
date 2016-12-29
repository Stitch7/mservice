/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';
module.exports = function(id, closed, name, topic, lastMessage, mods) {
    this.id = id;
    this.closed = closed;
    this.name = name;
    this.topic = topic;
    this.lastMessage = lastMessage;
    this.mods = mods;
};
