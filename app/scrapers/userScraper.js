/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var $ = require('cheerio');
var utils = require('./../utils.js');

module.exports = function (userId, html) {
    var profile = {
        userId: undefined,
        username: undefined,
        picture: undefined,
        firstname: undefined,
        lastname: undefined,
        domicile: undefined,
        accountNo: undefined,
        registrationDate: undefined,
        email: undefined,
        icq: undefined,
        homepage: undefined,
        firstGame: undefined,
        allTimeClassics: undefined,
        favoriteGenres: undefined,
        currentSystems: undefined,
        hobbies: undefined,
        xboxLiveGamertag: undefined,
        psnId: undefined,
        nintendoFriendcode: undefined,
        lastUpdate: undefined
    };

    var $html = $(html);
    var data = [utils.toInt(userId)];

    var username = $html.find('#header').text().replace(/Userprofil für: /, '');
    data.push(username);

    var image = $html.find('tr.bg2 td img').first().attr('src');
    /**
     * TODO: check if this is obsolete
     */
    // if (image != 'images/empty.gif') {
    //     // Use http instead of https for the image URI, because iOS7.1 on iPhone doesn't accept the maniac servers SSL certificate
    //     // Fun fact: iOS7.1 on iPad does accept it, no problems on iOS8, too.
    //     data.push(utils.domainFromUri(mservice.options.maniacUrl, 'http') + '/forum/' +image);
    // } else {
        data.push('');
    // }

    $html.find('tr.bg2').each(function (key, value) {
        data.push($($(this).find('td').get(1)).text().replace(/\n/g, '').replace(/\s+/g,' ').trim());
    });

    var i = 0;
    for (var key in profile) {
        profile[key] = data[i++];
    }

    profile.registrationDate = utils.datetimeStringToISO8601(profile.registrationDate);
    profile.lastUpdate = utils.datetimeStringToISO8601(profile.lastUpdate);

    return profile;
};
