/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var utils = require('./../utils.js');
var searchResult = require('./../models/searchResult.js');

module.exports = function(html) {
    var searchResults = [];
    var resultsExistKeyword = 'Matches:';

    if (!html.includes(resultsExistKeyword)) {
        return searchResults;
    }

    var resultEntries = html.split(/<\/*br>/);
    var line;
    do {
        line = resultEntries.shift();
    } while (line != resultsExistKeyword);
    resultEntries.shift(); // Matches:
    resultEntries.pop(); // </body>
    resultEntries.pop(); // </html>

    var resultEntryRegExp = /^\d+.<a href="https:\/\/www.maniac-forum.de\/forum\/pxmboard.php\?mode=board&brdid=(\d+)&thrdid=(\d+)&msgid=(\d+)" target="_new">(.+)<\/a> - von: (.+) , (.+)$/;
    resultEntries.forEach(function (resultEntry) {
        var resultEntryRegExpResult = resultEntryRegExp.exec(resultEntry);
        if (!resultEntryRegExpResult) {
            console.error('Could not parse search result entry: ' + resultEntry);
            return;
        }
        searchResults.push(new searchResult(
            utils.toInt(resultEntryRegExpResult[1]),
            utils.toInt(resultEntryRegExpResult[2]),
            utils.toInt(resultEntryRegExpResult[3]),
            resultEntryRegExpResult[4],
            resultEntryRegExpResult[5],
            utils.searchDatetimeStringToISO8601(resultEntryRegExpResult[6])
        ));
    });

    return searchResults;
};
