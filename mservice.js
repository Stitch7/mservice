#!/usr/bin/env node

/**
 * M!service
 * RESTful JSON API for famous Man!ac Forum
 *
 * Copyright (c) 2014 Christopher Reitz
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

/**
 * Includes
 */
var sys = require('sys');
var fs = require('fs');
var http = require('http');
var restify = require('restify');
var request = require('request');
var $ = require('cheerio');

/**
 * M!service server
 */
var mservice = {
	/**
	 * TCP Port
	 */
	port: 8080,
	/**
	 * URL to maniac forum
	 */
	maniacUrl: 'http://maniac-forum.de/forum/pxmboard.php',
	/**
	 * Start server
	 */
	start: function () {
		var server = restify.createServer();
		server.use(restify.bodyParser());

		// Dispatch routes
		var routes = this.routes;
		for (var httpMethod in routes) {
			for (var route in routes[httpMethod]) {
				server[httpMethod]('mservice' + route, routes[httpMethod][route]);
			}
		}

		server.listen(this.port);
	},
	/**
	 * Parser methods
	 */
	parse: {
		boards: function (html) {
			var boards = [];

			$(html).find('div table tr.bg2 td#norm:nth-child(2) a').each(function () {
				var $a = $(this);
				var href = $a.attr('href');
				var hrefSearch = '?mode=board&brdid=';
				if (href.indexOf(hrefSearch) != -1) {
					var board = {};
					board.id = mservice.utils.toInt(href.substring(href.indexOf(hrefSearch) + hrefSearch.length));
					board.text = $a.text();

					boards.push(board);
				}
			});

			return boards;
		},

		threads: function(html) {
			var threads = [];
			var threadEntries = html.split(/<\/*br>/);
			threadEntries.pop(); // Remove last (empty) entry

			// Compile Regexp outside loop to save perfomance
			var mainRegExp = /(.+)\s-\s(.+)\sam\s(.+)\(\s.+\s(\d+)\s(?:\|\s[A-Za-z:]+\s(.+)\s|)\)/;

			for (var i in threadEntries) {
				// fishing threadId from ld function call in onclick attribute
			  	var $messageHref = $('a', threadEntries[i]).first();
			  	var id = mservice.utils.toInt(/ld\((\w.+),0\)/.exec($messageHref.attr('onclick'))[1]);
			  	var messageId = mservice.utils.toInt(/(.+)msgid=(.+)/.exec($messageHref.attr('href'))[2]);

			  	var image = $('img', threadEntries[i]).attr('src').split('/').reverse()[0];
			  	// Sticky threads have pin image
			  	var sticky = image === 'fixed.gif';
				// Closed threads have lock image
			  	var closed = image === 'closed.gif';

			  	// Mods have are marked with the highlight css class
			  	var mod = $('span', threadEntries[i]).hasClass('highlight');

				// Fishing other thread data via easy regexp from line freed of html
				var subject, author, date, answerCount, answerDate;
		     	var regExpResult = mainRegExp.exec($(threadEntries[i]).text().trim().replace(/(\n|\t)/g, ''));

				if (regExpResult !== null) {
					subject 	= regExpResult[1];
					author  	= regExpResult[2];
					date 	    = mservice.utils.datetimeStringToISO8601(regExpResult[3]);
					answerCount = mservice.utils.toInt(regExpResult[4]);
					answerDate  = mservice.utils.datetimeStringToISO8601(regExpResult[5]);
				}

				// Add thread to list
				threads.push({
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

			return threads;
		},

		thread: function(html) {
			var thread = [];
			var $htmlEntityDecodeHelper = $('<div/>');
			var parseThreadMessage = function ($li, level, $htmlEntityDecodeHelper) {
				var messageId = mservice.utils.toInt(/pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($li.find('span a').attr('href'))[1]);
				var subject = $li.find('span a font').text();

				var userAndDateHtml = $li.find('span > font').html();
				var userAndDateRegExp = /<b>\n<span class="(.*)">\n(.+)\n<\/span>\n<\/b>\s-\s(.+)/;
				var userAndDateRegExpResult = userAndDateRegExp.exec(userAndDateHtml);
				var mod = userAndDateRegExpResult[1] === 'highlight';
				var username = $htmlEntityDecodeHelper.empty().append(userAndDateRegExpResult[2]).text();
				var date = mservice.utils.datetimeStringToISO8601(userAndDateRegExpResult[3]);

				return {
					messageId: messageId,
					level: level,
					subject: subject,
					mod: mod,
					username: username,
					date: date
				};
			}

			$(html).find('body > ul').each(function () {
				(function walkthrough($ul, level) {
					level = level || 0;
					$ul.children().each(function () {
						switch (this.name) {
							case 'li':
								thread.push(parseThreadMessage($(this), level, $htmlEntityDecodeHelper));
								break;
							case 'ul':
								walkthrough($(this), level + 1);
								break;
						}
					});
				})($(this));
			});

			return thread;
		},

		message: function(messageId, html) {
			var $html = $(html);

			var $bg1TRs  = $html.find('body table tr.bg1 td');
			var $userA   = $($bg1TRs.get(5)).find('a');

			var userId   = mservice.utils.toInt(/pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'))[1]);
			var username = $userA.html();
			var subject  = $($bg1TRs.get(2)).find('b').html();
			var date     = mservice.utils.datetimeStringToISO8601($($bg1TRs.get(7)).html());

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
				previewText: text,
				previewTextHtml: textHtml,
				previewTextHtmlWithImages: textHtmlWithEmbeddedImages
			};
		},

		quote: function (html) {
			var quote = $(html).find('textarea').text().trim();

			return {
				quote: quote
			}
		},

		user: function (html) {
			var profile = {
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
				data.push(mservice.maniacUrl.replace(/pxmboard.php/, '') + image);
			} else {
				data.push(null);
			}

			$html.find('tr.bg2').each(function (key, value) {
				data.push($($(this).find('td').get(1)).text().trim());
			});

			var i = 0;
			for (var key in profile) {
				profile[key] = data[i++];
			}

			return profile;
		}
	},
	/**
	 * Response actions
	 */
	routes: {
		/**
		 * Actions callable by HTTP GET method
		 */
		get: {
			/**
			 * index action
			 */
			'/': function (req, res, next) {
				fs.readFile('doc/index.html', 'utf8', function (error, data) {
					if (error) {
				    	return console.log(error);
				  	}

				  	mservice.response.html(res, data);
				});
			},
			/**
			 * boards action
			 */
			'/boards': function (req, res, next) {
				var url = mservice.maniacUrl;
				mservice.request.get(res, url, function (html) {
					var boards = mservice.parse.boards(html);
					mservice.response.json(res, boards);
				});
			},
			/**
			 * threads action
			 */
			'/board/:boardId/threads': function (req, res, next) {
				var boardId  = req.params.boardId;
				var url = mservice.maniacUrl + '?mode=threadlist&brdid=' + boardId;

				mservice.request.get(res, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'boardId';
					} else {
						data = mservice.parse.threads($html.find('body p').html());
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * thread action
			 */
			 '/board/:boardId/thread/:threadId': function (req, res, next) {
			 	var boardId  = req.params.boardId;
				var threadId = req.params.threadId;
				var url = mservice.maniacUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;

				mservice.request.get(res, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'boardId';
					} else if ($html.find('body > ul').length === 0) { // unknown threadId return empty page
						error = 'threadId';
					} else {
						data = mservice.parse.thread(html);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * message action
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				var boardId   = req.params.boardId;
				var messageId = req.params.messageId;
				var url = mservice.maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

				mservice.request.get(res, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.message(mservice.utils.toInt(messageId), html);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * quote action, fetches quoted text of a man!ac message
			 */
			'/board/:boardId/quote/:messageId': function (req, res, next) {
				var boardId   = req.params.boardId;
				var messageId = req.params.messageId;
				var url = mservice.maniacUrl + '?mode=messageform&brdid=' + boardId + '&msgid=' + messageId;

				mservice.request.get(res, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.quote(html);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * User action, fetches data of a of a man!ac user profile
			 */
			'/user/:userId': function (req, res, next) {
				var userId = req.params.userId;
				var url = mservice.maniacUrl + '?mode=userprofile&usrid=' + userId;

				mservice.request.get(res, url, function (html) {
					var data = null;
					var error = null;

					var title = $(html).find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'userId';
					} else {
						data = mservice.parse.user(html);
					}

					mservice.response.json(res, data, error);
				});
			}
		},
		/**
		 * Routes for HTTP POST method
		 */
		post: {
			/**
			 * test-login action, checks if given username and password combination is accepted by the forum
			 */
			'/test-login': function (req, res, next) {
				var onSuccess = function () {
					var data = {
						success: true
					};
					mservice.response.json(res, data);
				};
				var onError = function () {
					var data = {
						success: false
					};
					mservice.response.json(res, data);
				};
				mservice.request.authenticate(req, res, onSuccess, onError);
			},
			/**
			 * Preview action
			 */
			'/board/:boardId/message/preview': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						body: req.params.text,
						preview_x: 'preview'
					}
				};

				mservice.request.post(res, options, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.reply) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.preview(html);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * Creates a thread to given boardId
			 */
			'/board/:boardId/message/': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						nick: req.params.username,
						pass: req.params.password,
						subject: req.params.subject,
						body: req.params.text,
						notification: req.params.notification
					}
				};

				mservice.request.post(res, options, function (html) {
					var data = {
						success: true
					}
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.confirm) {
						data.success = false;
						var maniacErrorMessage = $($html.find('tr.bg1 td').get(2)).text();
						error = mservice.errors.maniacMessages(maniacErrorMessage);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * Creates a reply to messageId
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						msgid: req.params.messageId,
						nick: req.params.username,
						pass: req.params.password,
						subject: req.params.subject,
						body: req.params.text,
						notification: req.params.notification
					}
				};

				mservice.request.post(res, options, function (html) {
					var data = {
						success: true
					}
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.confirm) {
						data.success = false;
						var maniacErrorMessage = $($html.find('tr.bg1 td').get(2)).text();
						error = mservice.errors.maniacMessages(maniacErrorMessage);
					}

					mservice.response.json(res, data, error);
				});
			},
			/**
			 * Checks if notification is activated for given messageId
			 */
			'/board/:boardId/notification-status/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, function (jar) {
					var boardId   = req.params.boardId;
					var messageId = req.params.messageId;
					var url = mservice.maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

					var options = {
						uri: url,
						jar: jar
					};

					mservice.request.get(res, options, function (html) {
						var notificationLinkText = $(html).find('a[href^="pxmboard.php?mode=messagenotification"]').text().trim().split(' ')[1];
						var data = {
							notificationEnabled: notificationLinkText === 'deaktivieren'
						}

						mservice.response.json(res, data);
					});
				});
			},
			/**
			 * Toggles notication for given messageId
			 */
			'/board/:boardId/notification/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, function (jar) {
					var boardId   = req.params.boardId;
					var messageId = req.params.messageId;
					var url = mservice.maniacUrl + '?mode=messagenotification&brdid=' + boardId + '&msgid=' + messageId;

					var options = {
						uri: url,
						jar: jar
					};

					mservice.request.get(res, options, function (html) {
						var data = {
							success: true
						}
						var error = null;

						var $html = $(html);
						var title = $html.find('title').text();

						if (title === mservice.errors.maniacBoardTitles.error) {
							data.success = false;
							var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
							error = mservice.errors.maniacMessages[maniacErrorMessage];
						}

						mservice.response.json(res, data, error);
					});
				});
			},
			/**
			 * Search action, returns threadlist for given boardId matching given search phrase
			 */
			'/board/:boardId/search-threads': function (req, res, next) {
				var options = {
					uri: mservice.utils.domainFromUri(mservice.maniacUrl) + '/forum/include/Ajax/threadfilter.php',
					form: {
						boardid: req.params.boardId,
						phrase: req.params.phrase
					},
					headers: {
						'User-Agent': 'M!service',
			        	'X-Requested-With': 'XMLHttpRequest'
			    	}
				};

				mservice.request.post(res, options, function (html) {
					var data = mservice.parse.threads(html);
					mservice.response.json(res, data);
				});
			}
		},
		/**
		 * Routes for HTTP PUT method
		 */
		put: {
			/**
			 * Updates (edits) a message
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, function (jar) {
					var options = {
						jar: jar,
						form: {
							mode: 'messageeditsave',
							brdid: req.params.boardId,
							msgid: req.params.messageId,
							subject: req.params.subject,
							body: req.params.text
						}
					};

					mservice.request.post(res, options, function (html) {
						var data = {
							success: true
						}
						var error = null;

						var $html = $(html);
						var title = $html.find('title').text();
						if (title != mservice.errors.maniacBoardTitles.confirm) {
							data.success = false;
							var maniacErrorMessage = null;
							if (title === mservice.errors.maniacBoardTitles.error) {
								maniacErrorMessage = $html.find('tr.bg2 td').first().text();
							} else if (title === mservice.errors.maniacBoardTitles.edit) {
								maniacErrorMessage = $($html.find('tr.bg1 td').get(1)).text(); //TODO first() ?
							}
							error = maniacErrorMessage ? mservice.errors.maniacMessages[maniacErrorMessage] : 'unknown';
						}

						mservice.response.json(res, data, error);
					});
				});
			}
		}
	},
	/**
	 * Request wrapper
	 */
	request: {
		get: function (res, options, fn) {
			if ((typeof options === 'string')) {
				options = {
					uri: options
				};
			}

			options = mservice.utils.extend({
				method: 'GET',
				timeout: 10000,
				headers: {
					'User-Agent': 'M!service'
				}
			}, options);

			request(options, function (requestError, requestResponse, requestBody) {
				if (requestError || requestResponse.statusCode != 200) {
					mservice.response.connectionError(res);
			  	} else if (typeof fn === 'function') {
		  			fn(requestBody);
			  	}
			})
		},
		post: function (res, options, fn) {
			options = mservice.utils.extend({
				uri: mservice.maniacUrl,
				method: 'POST',
				timeout: 10000,
				headers: {
					'User-Agent': 'M!service'
				}
			}, options);

			request(options, function (requestError, requestResponse, requestBody) {
				if (requestError || requestResponse.statusCode != 200) {
					mservice.response.connectionError(res);
			  	} else if (typeof fn === 'function') {
		  			fn(requestBody, requestResponse);
			  	}
			})
		},
		authenticate: function (req, res, fnSuccess, fnError) {
			var options = {
				form: {
					mode: 'login',
					nick: req.params.username,
					pass: req.params.password
				}
			};

			mservice.request.post(res, options, function (html, response) {
				if ($(html).find('form').length > 0) {
					if (typeof fnError === 'function') {
						fnError();
					} else {
						mservice.response.json(res, null, 'login');
					}
				} else if (typeof fnSuccess === 'function') {
					var cookieString = response.headers['set-cookie'][0].split(";")[0];
					var cookie = request.cookie(cookieString);
			 		var jar = request.jar();
					jar.setCookie(cookie, mservice.maniacUrl);

		  			fnSuccess(jar);
			  	}
			});
		}
	},
	/**
	 * Client responses
	 */
	response: {
		connectionError: function (res) {
			mservice.response.json(res, null, 'connection');
		},
		json: function (res, data, error) {
			var clientResponseMessage = {
				'data': data,
				'error': null
			};

			if (error) {
				var errorCode = mservice.errors.codes[error];
				var errorMessage = mservice.errors.messages[error];
				clientResponseMessage.error = {
					'code': errorCode,
					'message': errorMessage
				};

				console.log(clientResponseMessage);
			}

			res.contentType = 'application/json';
			res.send(clientResponseMessage);

			// setTimeout(function () {
			// 	res.send(clientResponseMessage);
			// }, 5000);

		},
		html: function (res, html) {
			res.writeHead(200, {
				'Content-Length': Buffer.byteLength(html),
				'Content-Type': 'text/html'
			});
			res.write(html);
			res.end();
		}
	},
	/**
	 * Error table
	 */
	errors: {
		codes: {
			unknown: 0,
			connection: 1,
			permission: 2,
			login: 3,
			boardId: 4,
			messageId: 5,
			subject: 6,
			answerExists: 7,
			threadId: 8,
			userId: 9
		},
		messages: {
			unknown: 'An unknown error is occured',
			connection: 'Could not connect to maniac server',
			permission: 'Permission denied',
			login: 'Authentication failed',
			boardId: 'boardId is invalid',
			messageId: 'messageId is invalid',
			subject: 'Subject not filled',
			answerExists: 'This message was already answered',
			threadId: 'threadId is invalid',
			userId: 'userId is invalid'
		},
		maniacMessages: {
			'Bitte geben sie ihren Nickname ein': 'login',
			'Passwort ungültig': 'login',
			'Sie sind nicht dazu berechtigt': 'permission',
			'konnte Daten nicht einfügen': 'unchanged',
			'Board id fehlt': 'boardId',
			'message id ungültig': 'messageId',
			'Thema fehlt': 'subject',
			'Auf diese Nachricht wurde bereits geantwortet': 'answerExists'
		},
		maniacBoardTitles: {
			confirm: '-= board: confirm =-',
			reply: '-= board: reply =-',
			error: '-= board: error =-',
			edit: '-= board: edit =-'
		}
	},
	/**
	 * Helper functions
	 */
	utils: {
		extend: function (a, b) {
		    for (var key in b) {
		        if (b.hasOwnProperty(key)) {
		            a[key] = b[key];
		        }
		    }

		    return a;
		},
		domainFromUri: function (uri) {
			var parts = uri.split('/');
			return parts[0] + '//' + parts[2];
		},
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
};

/**
 * Start server
 */
mservice.start();