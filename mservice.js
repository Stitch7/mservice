#!/usr/bin/env node

/**
 * mService
 * Net service for M!Client, iOS client for famous man!ac forum
 *
 * Copyright (c) 2012 Christopher Reitz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// libraries
var sys = require('sys');
var http = require('http');

var restify = require('restify');
var request = require('request');
var $ = require('cheerio');

var port = 8000;
var maniacUrl = 'http://maniac-forum.de/forum/pxmboard.php';


/**
 * gets man!ac ressource with given action
 */
var fetchManiacHtml = function(url, fn) {
	http.get(url, function(response) {
		// console.log(response);
		var html = [];

		response.on('data', function (chunk) {
			html.push(chunk);
			//console.log("" + chunk);
		});

		// when respond ends execute action
		response.on('end', function () {
			fn(html.join(""));
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
};


/**
 * cleans parsed stuff from ugly characters
 */
var clean = function(text) {
	return text.replace(/[\t\r\n]/g, '').replace(/^\s+|\s+$/g, '');
};


/**
 * Response actions
 */
var actions = {
	/**
	 * Actions callable by HTTP GET method
	 */
	'GET': {
		/**
		 * index action, fetches man!ac board list
		 */
		'/': function (req, res, next) {
			fetchManiacHtml(maniacUrl, function (html) {
				var boardList = [];

				$(html).find('div table tr.bg2 td#norm:nth-child(2) a').each(function () {
					var $a = $(this);
					var href = $a.attr('href');
					var hrefSearch = '?mode=board&brdid=';
					if (href.indexOf(hrefSearch) != -1) {
						var board = {};
						board.id = href.substring(href.indexOf(hrefSearch) + hrefSearch.length);
						board.text = $a.text();

						boardList.push(board);
					}
				});

				//console.log(boardList);

				res.contentType = 'application/json';
				res.send(boardList);
			});
		},

		/**
		 * threadlist action, fetches a man!ac thread list
		 */
		'/board/:boardId/threadlist': function (req, res, next) {
			var boardId  = req.params.boardId;

			var url = maniacUrl + '?mode=threadlist&brdid=' + boardId;

			fetchManiacHtml(url, function (html) {
				var threadList = [];
				var threads = $(html).find('body p').html().split('<br>');
				threads.pop(); // Remove last (empty) entry

				for(var i in threads) {
					// fishing threadId from ld function call in onclick attribute
				  	var $messageHref = $('a', threads[i]).first();
				  	var id = parseInt(/ld\((\w.+),0\)/.exec($messageHref.attr('onclick'))[1], 10);
				  	var messageId = parseInt(/(.+)msgid=(.+)/.exec($messageHref.attr('href'))[2], 10);

				  	var image = $('img', threads[i]).attr('src').split('/').reverse()[0];
				  	// Sticky threads have pin image
				  	var sticky = image === 'fixed.gif';
					// Closed threads have lock image
				  	var closed = image === 'closed.gif';

				  	// Mods have are marked with the highlight css class
				  	var mod = $('span', threads[i]).hasClass('highlight');

					// fishing other thread data via easy regexp from line freed of html
					var subject, author, date, answerCount, answerDate;

					var regExpResult = /\n\t\n\s(.+)\s-\s\n\n(.+)\n\n\sam\s(.+)\n\t\(\sAntworten:\s(.+)\s\|\sLetzte: (.+)\s\)/.exec($(threads[i]).text());
					if (regExpResult !== null) {
						subject 	= regExpResult[1];
						author  	= regExpResult[2];
						date 	    = regExpResult[3];
						answerCount = parseInt(regExpResult[4], 10);
						answerDate  = regExpResult[5];
					} else { // 0 answers
						regExpResult = /\n\t\n\s(.+)\s-\s\n\n(.+)\n\n\sam\s(.+)\n\t\(\sAntworten:\s0\s\)\n/.exec($(threads[i]).text());
						subject 	= regExpResult[1];
						author  	= regExpResult[2];
						date 	    = regExpResult[3];
						answerCount = 0;
						answerDate  = "";
					}

					// adding thread to list
					threadList.push({
						id: id,
						messageId: messageId,
						sticky: sticky,
						closed: closed,
						author: author,
						mod: mod,
						subject: subject,
						date: date,
						answerCount: answerCount,
						answerDate: answerDate
					});
				}

				res.contentType = 'application/json';
				res.send(threadList);
			});
		},

		/**
		 * thread action, fetches a man!ac message list
		 */
		 '/board/:boardId/thread/:threadId': function (req, res, next) {
		 	var boardId  = req.params.boardId;
			var threadId = req.params.threadId;

			var url = maniacUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;

			fetchManiacHtml(url, function (html) {
				var thread = [];

				$(html).find('body > ul').each(function () {
					var $thread = $(this);

					/*
					var intend = function (level) {
						var spaces = '';
						for (var i = 0; i <= level; i++) {
							spaces += '   ';
						}
						return spaces;
					};
					*/

					var createMessage = function ($li, level) {
						return message = {
							messageId: parseInt(/pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($li.find('span a').attr('href'))[1], 10),
							level: level,
							username: clean($li.find('span font b span').html()),
							subject: $li.find('span a font').text(),
							date: clean($li.find('span > font').html()).replace(/<(\w+)[^>]*>.*<\/\1> - /gi, '')
						};
					};

					var parse = function($ul, level) {
						level = level || 0;

						$ul.children().each(function () {
							switch (this.name) {
								case 'li':
									//console.log(intend(level) + '(' + level + ')  ' + $(this).find('span a font').html() + ' - ' + clean($(this).find('span font b span').html()));
									thread.push(createMessage($(this), level));
									break;

								case 'ul':
									parse($(this), level + 1);
									break;
							}
						});
					};

					parse($thread);
				});

				// console.log(thread);

				res.contentType = 'application/json';
				res.send(thread);

			});
		},

		/**
		 * message action, fetches a man!ac message
		 */
		'/board/:boardId/message/:messageId': function (req, res, next) {
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;

			var url = maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

			fetchManiacHtml(url, function (html) {
				var $html = $(html);

				var $userA   = $($html.find('body table tr.bg1 td').get(5)).find('a');
				var userId   = /pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'))[1];
				var username = $userA.html();

				var subject  = $($html.find('body table tr.bg1 td').get(2)).find('b').html();
				var date     = $($html.find('body table tr.bg1 td').get(7)).html();

				var text = $html.find('body table tr.bg2 td > font').html();
				// Embed images
				text = text.replace(/\[<a.+>(.+\.(jpg|jpeg|gif|png).*)<\/a>\]/g, "<a href=\"$1\"><img src=\"$1\"/></a>");

				var message = {
					messagId: messageId,
					userId: parseInt(userId, 10),
					username: username,
					subject: subject,
					date: date,
					text: text
				};

				// console.log(message);

				res.contentType = 'application/json';
				res.send(message);
			});

			// return next();
		},

		/**
		 * quote action, fetches quoted text of a man!ac message
		 */
		'/board/:boardId/quote/:messageId': function (req, res, next) {
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;

			var url = maniacUrl + '?mode=messageform&brdid=' + boardId + '&msgid=' + messageId;

			fetchManiacHtml(url, function (html) {
				var $html = $(html);

				var quote = $html.find('textarea').text().trim();

				var message = {
					quote: quote
				};

				// console.log(message);

				res.contentType = 'application/json';
				res.send(message);
			});

			// return next();
		},

		/**
		 * Profile action, fetches data of a of a man!ac user profile
		 */
		'/profile/:userId': function (req, res, next) {
			var userId   = req.params.userId;

			var url = maniacUrl + '?mode=userprofile&usrid=' + userId;

			fetchManiacHtml(url, function (html) {
				var message = {
					image: undefined,
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
				var data = [];

				var image = $html.find('tr.bg2 td img').first().attr('src');
				if (image != 'images/empty.gif') {
					data.push(maniacUrl.replace(/pxmboard.php/, '') + image);
				}

				$html.find('tr.bg2').each(function (key, value) {
					data.push($($(this).find('td').get(1)).text().trim());
				});

				var i = 0;
				for (var key in message) {
					message[key] = data[i++];
				}

				// console.log(message);

				res.contentType = 'application/json';
				res.send(message);
			});

			// return next();
		}
	},

	/**
	 * Actions callable by HTTP POST method
	 */
	'POST': {
		/**
		 * test-login action, checks if given username and password combination is accepted by the forum
		 */
		'/test-login': function (req, res, next) {
			var username = req.params.username;
			var password = req.params.password;

			var onResponse = function(error, response, body) {
				var message = {
					success: false
				};

				if ($(body).find('form').length === 0) {
					message.success = true;
				}

				res.contentType = 'application/json';
				res.send(message);
			}

			request({
				uri: maniacUrl,
				method: "POST",
				form: {
					mode: "login",
					brdid: "",
					nick: username,
					pass: password
				}
			}, onResponse);
		},

		/**
		 * Post action, creates a posting
		 */
		'/post': function (req, res, next) {
			var form = {
				mode: "messagesave",
				brdid: req.params.boardId,
				msgid: req.params.messageId,
				nick: req.params.username,
				pass: req.params.password,
				subject: req.params.subject,
				body: req.params.text,
				notification: req.params.notification
			};

			var onResponse = function(error, response, body) {

				console.log("############################");
				console.log(form);
				console.log(body);


				var message = {
					success: false
				};

				res.contentType = 'application/json';
				res.send(message);
			};

			// onResponse(undefined, undefined, undefined);

			request({
				uri: maniacUrl,
				method: "POST",
				form: form
			}, onResponse);
		},

		/**
		 * Edit action, edits a posting
		 */
		'/edit': function (req, res, next) {
			var username  = req.params.username;
			var password  = req.params.password;
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;
			var subject   = req.params.subject;
			var text      = req.params.text;

			var loginForm = {
					mode: "login",
					brdid: "",
					nick: username,
					pass: password
			};

			var onLoginResponse = function(loginError, loginResponse, loginBody) {
				if ($(loginBody).find('form').length > 0) {
					// TODO error if login failed
				} else {

					var cookieString = loginResponse.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
		 			var jar = request.jar();
					jar.setCookie(cookie, maniacUrl);

					var editForm = {
						mode: "messageeditsave",
						brdid: boardId,
						msgid: messageId,
						subject: subject,
						body: text
					};

					var onEditResponse = function(editError, editResponse, editBody) {

						console.log("############################");
						console.log(editForm);
						console.log(editBody);

						var $editBody = $(editBody);

						var title = $(editBody).find('title').text();
						var success = true;
						var errorMessage = "";
						if (title === "-= board: error =-") {
							success = false;
							errorMessage = $editBody.find("tr.bg2 td").first().text();
						}

						var clientResponseMessage = {
							success: success,
							errorMessage: errorMessage
						};

						console.log(clientResponseMessage);

						res.contentType = 'application/json';
						res.send(clientResponseMessage);
					};

					// onResponse(undefined, undefined, undefined);

					request({
						uri: maniacUrl,
						method: "POST",
						jar: jar,
						form: editForm
					}, onEditResponse);
				}
			};

			request({
				uri: maniacUrl,
				method: "POST",
				form: loginForm
			}, onLoginResponse)
		},

		/**
		 * Notification Status action, checks if reply notification is activated
		 */
		'/board/:boardId/notification-status/:messageId': function (req, res, next) {
			var username  = req.params.username;
			var password  = req.params.password;
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;

			var loginForm = {
					mode: "login",
					brdid: "",
					nick: username,
					pass: password
			};

			var onLoginResponse = function(loginError, loginResponse, loginBody) {
				if ($(loginBody).find('form').length > 0) {
					// TODO error if login failed
				} else {

					var cookieString = loginResponse.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
		 			var jar = request.jar();
					jar.setCookie(cookie, maniacUrl);

					var url = maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

					var onNotificatonStatusResponse = function(notificatonStatusError, notificatonStatusResponse, notificatonStatusBody) {
						var $body = $(notificatonStatusBody);
						var notificationLinkText = $body.find('a[href^="pxmboard.php?mode=messagenotification"]').text().trim().split(' ')[1];
						var notificationEnabled = (notificationLinkText === 'deaktivieren');

						var clientResponseMessage = {
							notificationEnabled: notificationEnabled,
						};

						// console.log(clientResponseMessage);

						res.contentType = 'application/json';
						res.send(clientResponseMessage);
					};

					// onResponse(undefined, undefined, undefined);

					request({
						uri: url,
						method: "GET",
						jar: jar
					}, onNotificatonStatusResponse);
				}
			};

			request({
				uri: maniacUrl,
				method: "POST",
				form: loginForm
			}, onLoginResponse)
		},

		/**
		 * Notification action, toggles reply notication
		 */
		'/board/:boardId/notification/:messageId': function (req, res, next) {
			var username  = req.params.username;
			var password  = req.params.password;
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;

			var loginForm = {
					mode: "login",
					brdid: "",
					nick: username,
					pass: password
			};

			var onLoginResponse = function(loginError, loginResponse, loginBody) {
				if ($(loginBody).find('form').length > 0) {
					// TODO error if login failed
				} else {

					var cookieString = loginResponse.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
		 			var jar = request.jar();
					jar.setCookie(cookie, maniacUrl);

					var url = maniacUrl + '?mode=messagenotification&brdid=' + boardId + '&msgid=' + messageId;

					var onNotificationResponse = function(notificationError, notificationResponse, notificationBody) {
						var $body = $(notificationBody);

						var title = $body.find('title').text();
						var success = true;
						var errorMessage = "";
						if (title === "-= board: error =-") {
							success = false;
							errorMessage = $body.find("tr.bg2 td").first().text();
						}

						var clientResponseMessage = {
							success: success,
							errorMessage: errorMessage
						};

						// console.log(clientResponseMessage);

						res.contentType = 'application/json';
						res.send(clientResponseMessage);
					};

					// onResponse(undefined, undefined, undefined);

					request({
						uri: url,
						method: "GET",
						jar: jar
					}, onNotificationResponse);
				}
			};

			request({
				uri: maniacUrl,
				method: "POST",
				form: loginForm
			}, onLoginResponse)
		},

		/**
		 * Search action, returns threadlist for given boardId matching given search phrase
		 */
		'/board/:boardId/search': function (req, res, next) {

			var url = 'http://www.maniac-forum.de/forum/include/Ajax/threadfilter.php';

			var form = {
				// phrase: "Apple",
				// boardid: 6
				phrase: req.params.phrase,
				boardid: req.params.boardId
			};

			var onResponse = function(error, response, body) {
				var threadList = [];

				// console.log(body);

				var threads = body.split('</br>');
				threads.pop(); // Remove last (empty) entry

				// console.log(threads);

				for(var i in threads) {
					// fishing threadId from ld function call in onclick attribute
				  	var $messageHref = $('a', threads[i]).first();
				  	var id = parseInt(/ld\((\w.+),0\)/.exec($messageHref.attr('onclick'))[1], 10);
				  	var messageId = parseInt(/(.+)msgid=(.+)/.exec($messageHref.attr('href'))[2], 10);

				  	var image = $('img', threads[i]).attr('src').split('/').reverse()[0];
				  	// Sticky threads have pin image
				  	var sticky = image === 'fixed.gif';
					// Closed threads have lock image
				  	var closed = image === 'closed.gif';

				  	// Mods have are marked with the highlight css class
				  	var mod = $('span', threads[i]).hasClass('highlight');

					// fishing other thread data via easy regexp from line freed of html
					var subject, author, date, answerCount, answerDate;

					// console.log($(threads[i]).text());

					var regExpResult = /(.+)\s-\s(.+)\sam\s(.+)\s\(\s.+\s(\d+)\s\|\s[A-Za-z:]+\s(.+)\s\)/.exec($(threads[i]).text().trim());



					if (regExpResult !== null) {
						subject 	= regExpResult[1];
						author  	= regExpResult[2];
						date 	    = regExpResult[3];
						answerCount = parseInt(regExpResult[4], 10);
						answerDate  = regExpResult[5];
					} else { // 0 answers
						// regExpResult = /\n\t\n\s(.+)\s-\s\n\n(.+)\n\n\sam\s(.+)\n\t\(\sAntworten:\s0\s\)\n/.exec($(threads[i]).text());
						// subject 	= regExpResult[1];
						// author  	= regExpResult[2];
						// date 	    = regExpResult[3];
						// answerCount = 0;
						// answerDate  = "";
					}

					// adding thread to list
					threadList.push({
						id: id,
						messageId: messageId,
						sticky: sticky,
						closed: closed,
						author: author,
						mod: mod,
						subject: subject,
						date: date,
						answerCount: answerCount,
						answerDate: answerDate
					});
				}

				console.log(threadList);

				res.contentType = 'application/json';
				res.send(threadList);
			};

			request({
				uri: url,
				method: "POST",
				form: form,
				headers: {
		        	'X-Requested-With': 'XMLHttpRequest'
		    	}
			}, onResponse);
		}
	}
}

var dispatcher = function(server, actions) {
	for (var route in actions['GET']) {
		server.get(route, actions['GET'][route]);
	}
	for (var route in actions['POST']) {
		server.post(route, actions['POST'][route]);
	}
};

var server = restify.createServer();
server.use(restify.bodyParser());

dispatcher(server, actions);

server.listen(port);


// actions['/thread/:thrdid']({params: {thrdid: 149506}})
// actions['/threadlist/:brdid']({params: {brdid: 6}})
// actions['/message/:msgid']({params: {msgid: 3558887}})
// actions['/profile/:userId']({params: {userId: 2615}})
// testLogin("Stitch", "5555");
// reply();
// search();


