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

var port = 8080;
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

var utils = {
	datetimeStringToISO8601: function (datetimeString) {
		if ( ! datetimeString) {
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
	        norm = Math.abs(Math.floor(num));
	        return (norm < 10 ? '0' : '') + norm;
	    };

	    return date.getFullYear()
	        + '-' + pad(date.getMonth() + 1)
	        + '-' + pad(date.getDate())
	        + 'T' + pad(date.getHours())
	        + ':' + pad(date.getMinutes())
	        + ':' + pad(date.getSeconds())
	        + dif + pad(tzo / 60)
	        + ':' + pad(tzo % 60)
	    ;
	},
	toInt: function (string) {
		return parseInt(string, 10);
	}

}


var parse = {

	threadList: function(threads) {
		var threadList = [];
		// Compile Regexp outside loop to save perfomance
		var mainRegExp = /(.+)\s-\s(.+)\sam\s(.+)\(\s.+\s(\d+)\s(?:\|\s[A-Za-z:]+\s(.+)\s|)\)/;

		for (var i in threads) {
			// fishing threadId from ld function call in onclick attribute
		  	var $messageHref = $('a', threads[i]).first();
		  	var id = utils.toInt(/ld\((\w.+),0\)/.exec($messageHref.attr('onclick'))[1]);
		  	var messageId = utils.toInt(/(.+)msgid=(.+)/.exec($messageHref.attr('href'))[2]);

		  	var image = $('img', threads[i]).attr('src').split('/').reverse()[0];
		  	// Sticky threads have pin image
		  	var sticky = image === 'fixed.gif';
			// Closed threads have lock image
		  	var closed = image === 'closed.gif';

		  	// Mods have are marked with the highlight css class
		  	var mod = $('span', threads[i]).hasClass('highlight');

			// Fishing other thread data via easy regexp from line freed of html
			var subject, author, date, answerCount, answerDate;
	     	var regExpResult = mainRegExp.exec($(threads[i]).text().trim().replace(/(\n|\t)/g, ''));

			if (regExpResult !== null) {
				subject 	= regExpResult[1];
				author  	= regExpResult[2];
				date 	    = utils.datetimeStringToISO8601(regExpResult[3]);
				answerCount = utils.toInt(regExpResult[4]);
				answerDate  = utils.datetimeStringToISO8601(regExpResult[5]);
			}

			// Add thread to list
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

		return threadList;
	},


	messageList: function(html) {
		var messageList = [];
		var $htmlEntityDecodeHelper = $('<div/>');

		$(html).find('body > ul').each(function () {
			(function walkthrough($ul, level) {
				level = level || 0;
				$ul.children().each(function () {
					switch (this.name) {
						case 'li':
							messageList.push(parse.messageListEntry($(this), level, $htmlEntityDecodeHelper));
							break;
						case 'ul':
							walkthrough($(this), level + 1);
							break;
					}
				});
			})($(this));
		});

		return messageList;
	},

	messageListEntry: function ($li, level, $htmlEntityDecodeHelper) {
		var messageId = utils.toInt(/pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($li.find('span a').attr('href'))[1]);
		var subject = $li.find('span a font').text();

		var userAndDateHtml = $li.find('span > font').html();
		var userAndDateRegExp = /<b>\n<span class="(.*)">\n(.+)\n<\/span>\n<\/b>\s-\s(.+)/;
		var userAndDateRegExpResult = userAndDateRegExp.exec(userAndDateHtml);
		var mod = userAndDateRegExpResult[1] === 'highlight';
		var username = $htmlEntityDecodeHelper.empty().append(userAndDateRegExpResult[2]).text();
		var date = utils.datetimeStringToISO8601(userAndDateRegExpResult[3]);

		return {
			messageId: messageId,
			level: level,
			subject: subject,
			mod: mod,
			username: username,
			date: date
		};
	},

	message: function(messageId, html) {
		var $html = $(html);

		var $bg1TRs  = $html.find('body table tr.bg1 td');
		var $userA   = $($bg1TRs.get(5)).find('a');

		var userId   = utils.toInt(/pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'))[1]);
		var username = $userA.html();
		var subject  = $($bg1TRs.get(2)).find('b').html();
		var date     = utils.datetimeStringToISO8601($($bg1TRs.get(7)).html());

		var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;

		var $text = $html.find('body table tr.bg2 td > font');
		var text = $text.text().trim();
		var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

		// TODO maybe try with regexp...
		// (?<!&gt;)\[<a.+>(.+\.(jpg|jpeg|gif|png).*)<\/a>\]
		$text.find('font[face="Courier New"] > a').replaceWith(function () {
			var replacement;
			var $a = $(this);
			var href = $a.attr('href');

			if (href.match(/.+\.(jpg|jpeg|gif|png)$/) !== null) {
				replacement = '<a href="' + href + '"><img src="' + href + '"/></a>';
			} else {
				replacement = '<a href="' + href + '">' + href + '</a>';
			}

			return replacement;
		});
		var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

		return {
			messageId: messageId,
			userId: userId,
			username: username,
			subject: subject,
			date: date,
			text: text,
			textHtml: textHtml,
			textHtmlWithImages: textHtmlWithEmbeddedImages
		};
	},

	preview: function(html) {
		var $html = $(html);

		var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;

		var $text = $html.find('body table tr.bg2 td > font');
		var text = $text.text().trim();
		var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

		// TODO maybe try with regexp...
		// (?<!&gt;)\[<a.+>(.+\.(jpg|jpeg|gif|png).*)<\/a>\]
		$text.find('font[face="Courier New"] > a').replaceWith(function () {
			var replacement;
			var $a = $(this);
			var href = $a.attr('href');

			if (href.match(/.+\.(jpg|jpeg|gif|png)$/) !== null) {
				replacement = '<a href="' + href + '"><img src="' + href + '"/></a>';
			} else {
				replacement = '<a href="' + href + '">' + href + '</a>';
			}

			return replacement;
		});
		var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

		return {
			text: text,
			textHtml: textHtml,
			textHtmlWithImages: textHtmlWithEmbeddedImages
		};
	}
};



var errors = {
	codes: {
		'unknown': 0,
		'connection': 1,
		'permission': 2,
		'login': 3,
		'boardId': 4,
		'messageId': 5,
		'subject': 6,
		'answerExists': 7
	},
	messages: {
		'unknown': 'An unknown error is occured',
		'connection': 'Could not connect to maniac server',
		'permission': 'Permission denied',
		'login': 'Authentication failed',
		'boardId': 'boardId is missing',
		'messageId': 'messageId is missing',
		'subject': 'Subject not filled',
		'answerExists': 'This message was already answered'
	},
	maniacMessages: {
		'Bitte geben sie ihren Nickname ein': 'login',
		'Passwort ungültig': 'login',
		'Sie sind nicht dazu berechtigt': 'permission',
		'konnte Daten nicht einfügen': 'unchanged',
		'Board id fehlt': 'boardId',
		'message id ungültig': 'messageId',
		'Thema fehlt': 'subject',
		'Auf diese Nachricht wurde bereits geantwortet': 'answerExists',
	},
	maniacBoardTitles: {
		'confirm': '-= board: confirm =-',
		'error': '-= board: error =-',
		'edit': '-= board: edit =-'
	}
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
		 * index action
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
						board.id = utils.toInt(href.substring(href.indexOf(hrefSearch) + hrefSearch.length));
						board.text = $a.text();

						boardList.push(board);
					}
				});

				res.contentType = 'application/json';
				res.send(boardList);
				// setTimeout(function() {
				//   res.send(boardList);
				// }, 3000);
			});
		},

		/**
		 * threadlist action
		 */
		'/board/:boardId/threadlist': function (req, res, next) {
			var boardId  = req.params.boardId;
			var url = maniacUrl + '?mode=threadlist&brdid=' + boardId;

			fetchManiacHtml(url, function (html) {
				var threads = $(html).find('body p').html().split('<br>');
				threads.pop(); // Remove last (empty) entry

				var clientResponse = parse.threadList(threads)

				res.contentType = 'application/json';
				res.send(clientResponse);
			});
		},

		/**
		 * messagelist action
		 */
		 '/board/:boardId/messagelist/:threadId': function (req, res, next) {
		 	var boardId  = req.params.boardId;
			var threadId = req.params.threadId;

			var url = maniacUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;

			fetchManiacHtml(url, function (html) {
				var clientResponse = parse.messageList(html);

				res.contentType = 'application/json';
				res.send(clientResponse);
				// setTimeout(function() {
				//   res.send(clientResponse);
				// }, 3000);
			});
		},

		/**
		 * message action
		 */
		'/board/:boardId/message/:messageId': function (req, res, next) {
			var boardId   = req.params.boardId;
			var messageId = req.params.messageId;

			var url = maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

			fetchManiacHtml(url, function (html) {
				var clientResponse = parse.message(messageId, html);

				// console.log(clientResponse);

				res.contentType = 'application/json';
				res.send(clientResponse);
				// setTimeout(function() {
				//   res.send(clientResponse);
				// }, 3000);
			});
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
				// setTimeout(function() {
				//   res.send(message);
				// }, 5000);
			}

			request({
				uri: maniacUrl,
				method: 'POST',
				form: {
					mode: 'login',
					brdid: '',
					nick: username,
					pass: password
				}
			}, onResponse);
		},

		/**
		 * Preview action
		 */
		'/preview': function (req, res, next) {
			var form = {
				mode: 'messagesave',
				brdid: req.params.boardId,
				msgid: req.params.messageId,
				nick: req.params.username,
				pass: req.params.password,
				subject: req.params.subject,
				body: req.params.text,
				preview_x: 'preview'
			};

			var onResponse = function(error, response, body) {
				var $body = $(body);

				var clientResponseMessage = {
					success: true,
					content: '',
					errorCode: '',
					errorMessage: ''
				};

				clientResponseMessage.content = parse.preview(body);

				res.contentType = 'application/json';
				res.send(clientResponseMessage);
			};

			request({
				uri: maniacUrl,
				method: 'POST',
				form: form
			}, onResponse);
		},

		/**
		 * Post action, creates a posting
		 */
		'/post': function (req, res, next) {
			var form = {
				mode: 'messagesave',
				brdid: req.params.boardId,
				msgid: req.params.messageId,
				nick: req.params.username,
				pass: req.params.password,
				subject: req.params.subject,
				body: req.params.text,
				notification: req.params.notification
			};

			var onResponse = function(error, response, body) {
				var $body = $(body);

				var clientResponseMessage = {
					success: true,
					errorCode: '',
					errorMessage: ''
				};

				errorCodeMap = {
					 3: 2,
					 7: 3,
					26: 2
				};

				if ($body.find('title').text() !== errors.maniacBoardTitles.confirm) {
					var maniacErrorMessage = $($body.find('tr.bg1 td').get(2)).text();
					var errorLabel = errors.maniacMessages(maniacErrorMessage);
					clientResponseMessage.success = false;
					clientResponseMessage.errorCode = errors.code[errorLabel];
					clientResponseMessage.errorMessage = errors.messages[errorLabel];
				}

				res.contentType = 'application/json';
				res.send(clientResponseMessage);
			};

			// onResponse(undefined, undefined, undefined);

			request({
				uri: maniacUrl,
				method: 'POST',
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
				mode: 'login',
				brdid: '',
				nick: username,
				pass: password
			};

			var onLoginResponse = function(loginError, loginResponse, loginBody) {
				var errorCode;
				var clientResponseMessage = {
					success: true,
					errorCode: '',
					errorMessage: ''
				};

				if ($(loginBody).find('form').length > 0) {
					errorLabel = 'login';
					clientResponseMessage.success = false;
					clientResponseMessage.errorCode = errors.codes[errorLabel];
					clientResponseMessage.errorMessage = errors.messages[errorLabel];

					res.contentType = 'application/json';
					res.send(clientResponseMessage);
				} else {
					var cookieString = loginResponse.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
		 			var jar = request.jar();
					jar.setCookie(cookie, maniacUrl);

					var editForm = {
						mode: 'messageeditsave',
						brdid: boardId,
						msgid: messageId,
						subject: subject,
						body: text
					};

					var onEditResponse = function(editError, editResponse, editBody) {
						var $editBody = $(editBody);
						var title = $editBody.find('title').text();
						if (title != errors.maniacBoardTitles.confirm) {
							var errorLabel = 'unknown';
							var maniacErrorMessage;
							if (title === errors.maniacBoardTitles.error) {
								maniacErrorMessage = $editBody.find('tr.bg2 td').first().text();
								errorLabel = errors.maniacMessages[maniacErrorMessage];
							} else if (title === errors.maniacBoardTitles.edit) {
								maniacErrorMessage = $($editBody.find('tr.bg1 td').get(1)).text(); //TODO first() ?
								errorLabel = errors.maniacMessages[maniacErrorMessage];
							}

							clientResponseMessage.success = false;
							clientResponseMessage.errorCode = errors.codes[errorLabel];
							clientResponseMessage.errorMessage = errors.messages[errorLabel];
						}

						res.contentType = 'application/json';
						res.send(clientResponseMessage);
					};

					request({
						uri: maniacUrl,
						method: 'POST',
						jar: jar,
						form: editForm
					}, onEditResponse);
				}
			};

			request({
				uri: maniacUrl,
				method: 'POST',
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
				mode: 'login',
				brdid: '',
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
				method: 'POST',
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
				mode: 'login',
				brdid: '',
				nick: username,
				pass: password
			};

			var onLoginResponse = function(loginError, loginResponse, loginBody) {
				var errorCode;
				var clientResponseMessage = {
					success: true,
					errorCode: '',
					errorMessage: ''
				};

				if ($(loginBody).find('form').length > 0) {
					errorLabel = 'login';
					clientResponseMessage.success = false;
					clientResponseMessage.errorCode = errors.codes[errorLabel];
					clientResponseMessage.errorMessage = errors.messages[errorLabel];

					res.contentType = 'application/json';
					res.send(clientResponseMessage);
				} else {
					var cookieString = loginResponse.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
		 			var jar = request.jar();
					jar.setCookie(cookie, maniacUrl);

					var url = maniacUrl + '?mode=messagenotification&brdid=' + boardId + '&msgid=' + messageId;

					var onNotificationResponse = function(notificationError, notificationResponse, notificationBody) {
						var $body = $(notificationBody);
						var title = $body.find('title').text();

						if (title === errors.maniacBoardTitles.error) {
							var maniacErrorMessage = $body.find('tr.bg2 td').first().text();
							errorLabel = errors.maniacMessages[maniacErrorMessage];

							clientResponseMessage.success = false;
							clientResponseMessage.errorCode = errors.codes[errorLabel];
							clientResponseMessage.errorMessage = errors.messages[errorLabel];
						}

						// console.log(clientResponseMessage);

						res.contentType = 'application/json';
						res.send(clientResponseMessage);
					};

					request({
						uri: url,
						method: 'GET',
						jar: jar
					}, onNotificationResponse);
				}
			};

			request({
				uri: maniacUrl,
				method: 'POST',
				form: loginForm
			}, onLoginResponse)
		},

		/**
		 * Search action, returns threadlist for given boardId matching given search phrase
		 */
		'/board/:boardId/search': function (req, res, next) {
			var url = 'http://www.maniac-forum.de/forum/include/Ajax/threadfilter.php';
			var form = {
				boardid: req.params.boardId,
				phrase: req.params.phrase
			};

			var onResponse = function(error, response, body) {
				var threads = body.split('</br>');
				threads.pop(); // Remove last (empty) entry

				var clientResponse = parse.threadList(threads);

				res.contentType = 'application/json';
				res.send(clientResponse);
			};

			request({
				uri: url,
				method: 'POST',
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




// actions['GET']['/board/:boardId/threadlist']({params: {boardId: 6}})
// actions['GET']['/board/:boardId/messagelist/:threadId']({params: {boardId: 6, threadId: 151910}})
// actions['GET']['/board/:boardId/message/:messageId']({params: {boardId: 6, messageId: 3574644}})
// actions['POST']['/board/:boardId/search']({params: {boardId: 6}})
// actions['POST']['/board/:boardId/notification/:messageId']({params: {boardId: 6, messageId: 3567281}})

// actions['POST']['/preview']()


