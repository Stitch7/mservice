/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = {
    domainFromUri: function (uri, replaceProtocol) {
        var parts = uri.split('/');
        var protocol = typeof replaceProtocol !== 'undefined' ? replaceProtocol + ':' : parts[0];
        return protocol + '//' + parts[2];
    },
    extend: function (a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key) && b[key] !== undefined) {
                a[key] = b[key];
            }
        }

        return a;
    },
    datetimeStringToISO8601: function (datetimeString) {
        if (!datetimeString) {
            return '';
        }

        var dateArr = datetimeString.match(/(\d{2}).(\d{2}).(\d{2,4})\s(\d{2}):(\d{2})/);
        var year = dateArr[3].length === 2 ? '20' + dateArr[3] : dateArr[3];
        var month = dateArr[2] - 1;
        var day = dateArr[1];
        var hours = dateArr[4];
        var minutes = dateArr[5];
        var date = new Date(year, month, day, hours, minutes);
        var tzo = - date.getTimezoneOffset();
        var dif = tzo >= 0 ? '+' : '-';
        var pad = function(num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds()) +
            dif + pad(tzo / 60) +
            ':' + pad(tzo % 60)
        ;
    },
    embedImages: function () {
        var replacement;
        // TODO: Insert href as function param
        var href = $(this).attr('href');

        if (href.match(/.+\.(jpg|jpeg|gif|png)$/) !== null) {
            replacement = '<a href="' + href + '"><img src="' + href + '"/></a>';
        } else {
            replacement = '<a href="' + href + '">' + href + '</a>';
        }

        return replacement;
    },
    now: function () {
        var now = new Date();

        var dd = now.getDate();
        if (dd < 10) {
            dd = '0' + dd;
        }

        var mm = now.getMonth() + 1; // January is 0
        if (mm < 10) {
            mm = '0' + mm;
        }

        var yyyy = now.getFullYear();

        var H = now.getHours();
        if (H < 10) {
            H = '0' + H;
        }

        var i = now.getMinutes();
        if (i < 10) {
            i = '0' + i;
        }

        var s = now.getSeconds();
        if (s < 10) {
            s = '0' + s;
        }

        return yyyy + '-' + mm + '-' + dd + ' ' + H + ':' + i + ':' + s;
    },
    toInt: function (string) {
        return parseInt(string, 10);
    }
};
