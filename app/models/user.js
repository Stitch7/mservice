/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

module.exports = function(
    userId,
    username,
    picture,
    firstname,
    lastname,
    domicile,
    accountNo,
    registrationDate,
    email,
    icq,
    homepage,
    firstGame,
    allTimeClassics,
    favoriteGenres,
    currentSystems,
    hobbies,
    xboxLiveGamertag,
    psnId,
    nintendoFriendcode,
    lastUpdate
) {
    this.userId = userId;
    this.username = username;
    this.picture = picture;
    this.firstname = firstname;
    this.lastname = lastname;
    this.domicile = domicile;
    this.accountNo = accountNo;
    this.registrationDate = registrationDate;
    this.email = email;
    this.icq = icq;
    this.homepage = homepage;
    this.firstGame = firstGame;
    this.allTimeClassics = allTimeClassics;
    this.favoriteGenres = favoriteGenres;
    this.currentSystems = currentSystems;
    this.hobbies = hobbies;
    this.xboxLiveGamertag = xboxLiveGamertag;
    this.psnId = psnId;
    this.nintendoFriendcode = nintendoFriendcode;
    this.lastUpdate = lastUpdate;
};
