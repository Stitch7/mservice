m!service
========

![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m781467502-9620f9c1411881083504037e.svg)
[![Build Status](https://travis-ci.org/Stitch7/mservice.svg)](https://travis-ci.org/Stitch7/mservice)
[![Code Coverage](https://codecov.io/gh/stitch7/mservice/branch/master/graph/badge.svg)](https://codecov.io/gh/stitch7/mservice)
[![Dependency Status](https://david-dm.org/stitch7/mservice.svg)](https://david-dm.org/stitch7/mservice)
[![devDependency Status](https://david-dm.org/stitch7/mservice/dev-status.svg)](https://david-dm.org/stitch7/mservice#info=devDependencies)
![node](https://img.shields.io/badge/node-0.10.11-blue.svg)
[![license](http://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

RESTful JSON API für das Man!ac Forum.

# Inhalt

- [Betrieb](#user-content-betrieb)
	- [Command Line Options](#user-content-command-line-options)
    - [Docker](#user-content-docker)
- [API](#user-content-api)
	- [Allgemeines](#user-content-allgemeines)
		- [Parameter](#user-content-parameter)
		- [Authentifizierung](#user-content-authentifizierung)
		- [Responses](#user-content-responses)
	- [Test Login](#user-content-test-login)
	- [Boards](#user-content-boards)
	- [Threads](#user-content-threads)
	- [Thread](#user-content-thread)
	- [Message](#user-content-message)
	- [Notification Status](#user-content-notification-status)
	- [Notification](#user-content-notification)
	- [Quote Message](#user-content-quote-message)
	- [Message Preview](#user-content-message-preview)
	- [Create Thread](#user-content-create-thread)
	- [Create Reply](#user-content-create-reply)
	- [Edit Message](#user-content-edit-message)
	- [Search](#user-content-search)
	- [Search Threads](#user-content-search-threads)
	- [User](#user-content-user)
	- [Latest User](#user-content-latest-user)
	- [Responses](#user-content-responses-service)
	- [Who's online](#user-content-whos-online)
	- [Favorites](#user-content-favorites)
	- [Add to Favorites](#user-content-add-to-favorites)
	- [Delete from Favorites](#user-content-delete-from-favorites)
- [Lizenz](#user-content-lizenz)


# <a name="user-content-betrieb"></a>Betrieb

Es wird Node.js in Version 10.11.0 vorausgesetzt. Für die Datenhaltung wird eine MongoDB Instanz ab Version 3+ und für das Caching Redis 5.x benötigt.


### <a name="user-content-command-line-options"></a>Command Line Options

    $ ./mservice.js --help
    m!service

    Examples:
      node ./mservice.js                                                                         Starts server
      node ./mservice.js -k=/etc/ssl/localcerts/my.key -c=/etc/ssl/localcerts/my.crt             Starts server in SSL mode
      node ./mservice.js -l=/var/log/mservice/mservice.log                                       Starts server with log file
      node ./mservice.js --verbose-logging | mservice/node_modules/bunyan/bin/bunyan -o short    Starts server for development

    Options:
      -h, --help               Displays this help message
      -p, --port               TCP port                                                     [default: 8080]
      -u, --maniac-url         URL to maniac-forum                                          [default: "https://maniac-forum.de/forum/pxmboard.php"]
      -k, --key                Path to ssl key
      -c, --certificate        Path to ssl certificate
      --authority-certificate  Path to ssl authority certificate
      -l, --log-file           Output file for log (If false, output goes to stdout)        [default: false]
      --disable-logging        Disables logging                                             [default: false]
      --verbose-logging        If enabled all requests are logged (useful for development)  [default: false]

### <a name="user-content-docker"></a>Docker

	mkdir -p /var/mservice/db/
	docker run -itd -v /var/mservice/db/:/data/db --name mservicedb -d mongo
	docker run -it --name mservicecache -d redis
	docker run -it --name mservice --link mservicecache:mservicecache --link mservicedb:mservicedb -p 8080:8080 stitch/mservice

# <a name="user-content-api"></a>API

## <a name="user-content-allgemeines"></a>Allgemeines

### <a name="user-content-parameter"></a>Parameter

Spezifische Ressourcen werden über Parameter angesprochen. Falls vorhanden, sind die Parameter zur Spezifizierung einer Ressource Teil der dazugehörigen URI welche in der Beschreibung Platzhalter in Form von _:ParameterName_ enthält, die in der Tabelle _URI Params_ beschrieben sind.
Parameter zur Manipulation einer Ressource werden im Request Body mitgesendet und sind falls vorhanden in der Tabelle _Data Params_ beschrieben.

### <a name="user-content-authentifizierung"></a>Authentifizierung

Einige Ressourcen benötigen Authentifizierung, dazu muss beim Request eine für das Man!ac-Forum gültige Username / Passwort Kombination im HTTP-Header in Form von Basic Authentication nach RFC 2617 mitgesendet werden. Wenn eine Ressource eine gültige Authentifizierung benötigt ist dies mit **`NEEDS AUTHENTICATION`** unterhalb der URI markiert.

### <a name="user-content-responses"></a>Responses

Bei der Verwendung der API ist der HTTP Status Code der Server Response zu beachten. Alle gültigen Requests erhalten eine Response mit Code 200, im Fehlerfall wird der entsprechende Code laut RFC 7231 und eine Beschreibung des Fehlers im Feld `error` zurückgegeben. Alle spezifischen Error Responses der einzelnen Ressourcen werden als _Example Error Response_ zu der jeweiligen Ressource beschrieben.

**Allgemeine Error Responses:**

| HTTP Status Code            | Beschreibung                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 404 - Not Found             | Die angeforderte Ressource existiert nicht                                                                       |
| 405 - Method Not Allowed    | Die verwendete HTTP Methode für die angeforderte Ressource ist nicht erlaubt                                     |
| 500 - Internal Server Error | Unbekannter Fehler ist aufgetreten                                                                               |
| 504 - Gateway Timeout       | Es konnte keine Verbindung zum Forumsserver hergestellt werden, tritt zB in den Downzeiten während der Nacht auf |


## <a name="user-content-test-login"></a>Test Login

Überprüft Login Daten.

### HTTP Method: `GET`

    mservice/test-login

**`NEEDS AUTHENTICATION`**


### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}


## <a name="user-content-boards"></a>Boards

Daten der Startseite / Boardübersicht.

### HTTP Method: `GET`

    mservice/boards

### Response Data

| Feld              | Typ       | Beschreibung                        |
| ----------------- | --------- | ----------------------------------- |
| board             | Object    | Board                               |
| board.closed      | Boolean   | Board - Closed Status               |
| board.id          | Number    | Board - ID *(null wenn closed)*     |
| board.name        | String    | Board - Name                        |
| board.topic       | String    | Board - Thema                       |
| board.lastMessage | Date      | Board - Datum der letzten Nachricht |
| board.mods        | Array     | Board - Liste der Moderatoren Namen |

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "closed": false,
                "id": 1,
                "name": "Smalltalk",
                "topic": "Diskussionen rund um die Welt der Videospiele.",
                "lastMessage": "2014-10-31T05:44:00+01:00",
                "mods": [
                    "Andi",
                    "Rocco",
                    "Leviathan",
                    "Slapshot"
                ]
            },
            {
                "closed": false,
                "id": 2,
                "name": "For Sale",
                "topic": "Private Kleinanzeigen: An- und Verkauf gebrauchter Spiele",
                "lastMessage": "2014-10-31T01:09:00+01:00",
                "mods": [
                    "Andi",
                    "Rocco",
                    "Leviathan",
                    "pzykoskinhead",
                    "Slapshot"
                ]
            },
            {
                "closed": false,
                "id": 4,
                "name": "Retro'n'Tech",
                "topic": "Retro-Themen, Umbau-Lösungen, Anschluss-Probleme, Computerprobleme, Spielehilfen",
                "lastMessage": "2014-10-31T05:39:00+01:00",
                "mods": [
                    "Slapshot",
                    "Leviathan",
                    "Rocco",
                    "Andi"
                ]
            },
            {
                "closed": false,
                "id": 6,
                "name": "OT",
                "topic": "Ohne Tiefgang - der tägliche Schwachsinn",
                "lastMessage": "2014-10-31T05:45:00+01:00",
                "mods": [
                    "Andi",
                    "Rocco",
                    "Leviathan",
                    "Slapshot"
                ]
            },
            {
                "closed": false,
                "id": 26,
                "name": "Filme & Serien",
                "topic": "Alles wofür 24 fps reichen",
                "lastMessage": "2014-10-31T02:30:00+01:00",
                "mods": [
                    "Andi",
                    "Rocco",
                    "Leviathan",
                    "Slapshot"
                ]
            },
            {
                "closed": false,
                "id": 8,
                "name": "Online-Gaming",
                "topic": "Alles rund um Onlinespiele",
                "lastMessage": "2014-10-30T13:55:00+01:00",
                "mods": [
                    "Andi",
                    "Rocco",
                    "Leviathan",
                    "Slapshot"
                ]
            },
            {
                "closed": true,
                "id": null,
                "name": "E3",
                "topic": "14.-16. Juni",
                "lastMessage": "2016-06-23T14:40:00+02:00",
                "mods": [
                    "Leviathan",
                    "Slapshot"
                ]
            }
        ]
    }



## <a name="user-content-threads"></a>Threads

Liste der Threads (Daten des oberen Frames) eines Boards.

### HTTP Method: `GET`

    mservice/board/:boardId/threads

**`OPTIONAL AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |


### Response Data

| Feld                      | Typ       | Beschreibung                                          |
| ------------------------- | --------- | ----------------------------------------------------- |
| thread                    | Object    | Thread                                                |
| thread.id                 | Number    | Thread - ID                                           |
| thread.messageId          | Number    | Thread - Message ID des Eingangspostings              |
| thread.isRead             | Boolean   | Thread - Eingangsposting ist gelesen _[1]_            |
| thread.sticky             | Boolean   | Thread - Thread ist sticky                            |
| thread.closed             | Boolean   | Thread - Thread ist geschlossen _[2]_                 |
| thread.author             | String    | Thread - Benutzername des Threadersteller             |
| thread.mod                | String    | Thread - Threadersteller ist ein Moderator            |
| thread.subject            | String    | Thread - Betreff                                      |
| thread.date               | Date      | Thread - Erstellungsdatum                             |
| thread.messagesCount      | Number    | Thread - Anzahl der Postings                          |
| thread.messagesRead       | Number    | Thread - Anzahl der gelesenen Postings _[1]_          |
| thread.lastMessageId      | Number    | Thread - messageId des letzten Postings               |
| thread.lastMessageIsRead  | Boolean   | Thread - letzte Posting ist gelesen _[1]_             |
| thread.lastMessageDate    | Date      | Thread - Datum des letzten Postings                   |

**Hinweise:**<br/>
[1]: Ohne Authentifizierung ist dieses Feld `null`
[2]: Wenn `sticky` = `TRUE`, ist `closed` immer `FALSE`.<br/>
Ob ein Sticky Thread geschlossen ist kann nicht aus dem HTML des Man!ac Forums entnommen werden.

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "id": 151906,
                "messageId": 3567281,
                "isRead": true,
                "sticky": false,
                "closed": false,
                "author": "Stitch",
                "mod": false,
                "subject": "Der Apple Thread Nr 44 - Bigger than Bigger",
                "date": "2014-09-09T21:08:00+02:00",
                "messagesCount": 925,
                "messagesRead": 925,
                "lastMessageId": 3567282,
                "lastMessageIsRead": true,
                "lastMessageDate": "2014-10-10T14:19:00+02:00"
            },
            {
                "id": 152011,
                "messageId": 3571292,
                "isRead": true,
                "sticky": false,
                "closed": false,
                "author": "Andi",
                "mod": true,
                "subject": "Was ich noch sagen wollte... Thread Nr. 201b",
                "date": "2014-09-15T21:29:00+02:00",
                "messagesCount": 670,
                "messagesRead": 207,
                "lastMessageId": 3571293,
                "lastMessageIsRead": false,
                "lastMessageDate": "2014-10-10T22:32:00+02:00"
            },
            {
                "id": 150258,
                "messageId": 3497478,
                "isRead": false,
                "sticky": false,
                "closed": false,
                "author": "TOM",
                "mod": false,
                "subject": "Die besten Filmchen aller Zeiten - Teil 25",
                "date": "2014-05-24T23:24:00+02:00",
                "messagesCount": 416,
                "messagesRead": 0,
                "lastMessageId": 3497479,
                "lastMessageIsRead": false,
                "lastMessageDate": "2014-10-10T22:29:00+02:00"
            },
            ...
        ]
    }

### Example Error Response

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }


## <a name="user-content-thread"></a>Thread

Liste der Messages (Daten des mittleren Frames) eines Threads.

### HTTP Method: `GET`

    mservice/board/:boardId/thread/:threadId

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| threadId  | Thread ID    |


### Response Data

| Feld               | Typ       | Beschreibung                                      |
| ------------------ | --------- | ------------------------------------------------- |
| message            | Object    | Message                                           |
| message.id         | Number    | Message - ID                                      |
| message.isRead     | Boolean   | Message - Posting ist gelesen _[1]_               |
| message.level      | Number    | Message - Grad der Einrückung in der Baumstruktur |
| message.subject    | String    | Message - Betreff                                 |
| message.mod        | String    | Message - Messageersteller ist ein Moderator      |
| message.username   | String    | Message - Benutzername                            |
| message.date       | Date      | Message - Erstellungsdatum                        |

**Hinweise:**<br/>
[1]: Ohne Authentifizierung ist dieses Feld `null`

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "messageId": 3567281,
                "isRead": true,
                "level": 0,
                "subject": "Der Apple Thread Nr 44 - Bigger than Bigger",
                "mod": false,
                "username": "Stitch",
                "date": "2014-09-09T21:08:00+02:00"
            },
            {
                "messageId": 3585057,
                "isRead": false,
                "level": 1,
                "subject": "2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Wurzelgnom",
                "date": "2014-10-08T10:18:00+02:00"
            },
            {
                "messageId": 3585192,
                "isRead": true,
                "level": 2,
                "subject": "Re:2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Stitch",
                "date": "2014-10-08T12:24:00+02:00"
            },
            {
                "messageId": 3585540,
                "isRead": true,
                "level": 3,
                "subject": "Re:2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Wurzelgnom",
                "date": "2014-10-08T17:30:00+02:00"
            },
            {
                "messageId": 3585158,
                "isRead": false,
                "level": 2,
                "subject": "Mir ist in 15 Jahren mein Handy fast nie...",
                "mod": false,
                "username": "PoP",
                "date": "2014-10-08T11:55:00+02:00"
            },
            {
                "messageId": 3586454,
                "isRead": false,
                "level": 3,
                "subject": "Re:Mir ist in 15 Jahren mein Handy fast nie...",
                "mod": false,
                "username": "Lizardking",
                "date": "2014-10-09T21:09:00+02:00"
            },
            ...
        ]
    }

### Example Error Response

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }


##### Ungültige Thread ID referenziert:

    HTTP/1.1 404 Not Found
    {
        "error": "threadId not found"
    }


## <a name="user-content-message"></a>Message

Daten des unteren Frames, eine Message.

### HTTP Method: `GET`

    mservice/board/:boardId/thread/:threadId/message/:messageId

**`OPTIONAL AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| threadId  | Thread ID    |
| messageId | Message ID   |

### Response Data

| Feld               | Typ              | Beschreibung                                          |
| ------------------ | ---------------- | ----------------------------------------------------- |
| messageId          | Number           | Message ID                                            |
| userId             | Number           | Account-Nr.                                           |
| username           | String           | Benutzername                                          |
| subject            | String           | Betreff                                               |
| date               | Date             | Erstellungsdatum                                      |
| text               | String           | Message Body als Plain Text                           |
| textHtml           | String           | Message Body als HTML                                 |
| textHtmlWithImages | String           | Message Body als HTML Images in IMG-Tags              |
| isRead             | Boolean \| Null  | Posting ist gelesen _[1]_                             |
| notification       | Boolean \| Null  | Status der Mailbenachrichtigung _[1]_                 |
| userBlockedByYou   | Boolean \| Null  | Der Benutzer wurde von dir blockiert _[1]_            |
| userBlockedYou     | Boolean \| Null  | Du wurdest von dem Benutzer blockiert _[1]_           |

**Hinweise:**<br/>
[1]: Ohne Authentifizierung ist dieses Feld `null`

### Example Success Response

    HTTP/1.1 200 OK
    {
        "messageId": 3567281,
        "userId": 2615,
        "username": "Stitch",
        "subject": "Der Apple Thread Nr 44 - Bigger than Bigger",
        "date": "2014-09-09T21:08:00+02:00",
        "text": "[https://i.imgur.com/ETtsCml.jpg]\n\nLink zum Vorgänger:\n[https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734]",
        "textHtml": "<a href=\"https://i.imgur.com/ETtsCml.jpg\" target=\"_blank\">https://i.imgur.com/ETtsCml.jpg</a><br>\n<br>\nLink zum Vorgänger:<br>\n<a href=\"https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734\" target=\"_blank\">https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734</a>",
        "textHtmlWithImages": "<a href=\"https://i.imgur.com/ETtsCml.jpg\"><img src=\"https://i.imgur.com/ETtsCml.jpg\"></a><br>\n<br>\nLink zum Vorgänger:<br>\n<a href=\"https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734\">https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734</a>"
    }

### Example Error Response

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }

## <a name="user-content-notification-status"></a>Notification Status

Alternative Möglichkeit den Status der Mailbenachrichtigung einer Message abzufragen.

### HTTP Method: `GET`

    mservice/board/:boardId/notification-status/:messageId

**`NEEDS AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Response Data

| Feld         | Typ       | Beschreibung                    |
| ------------ | --------- | --------------------------------|
| notification | Boolean   | Status der Mailbenachrichtigung |

### Example Success Response

    HTTP/1.1 200 OK
    {
        "notification": true
    }

### Example Error Response

##### Benutzername / Passwort ungültig:

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }



## <a name="user-content-notification"></a>Notification

Schaltet die Mailbenachrichtigung für die übergebene Message ID an oder aus. Die Original API des Maniac Forums bietet leider keine Möglichkeit die Mailbenachrichtigung explizit an oder auszuschalten und gibt auch keine Rückmeldung in welche Richtung der Status geändert wurde. Ist die Mailbenachrichtigung also bereits aktiv schaltet dieser Request sie aus, ist sie nicht aktiv wird sie entsprechend aktiviert.

### HTTP Method: `GET`

    mservice/board/:boardId/notification/:messageId

**`NEEDS AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response

##### Benutzername / Passwort ungültig:

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }



## <a name="user-content-quote-message"></a>Quote Message

Zitierter Text einer Message.

### HTTP Method: `GET`

    mservice/board/:boardId/quote/:messageId

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Response Data

| Feld  | Typ       | Beschreibung        |
| ----- | --------- | --------------------|
| quote | String    | Zitat (Plain Text)  |

### Example Success Response

    HTTP/1.1 200 OK
    {
        "quote": ">[img:https://i.imgur.com/ETtsCml.jpg]\n>\n>Link zum Vorgänger:\n>[https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734]"
    }

### Example Error Response

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }


## <a name="user-content-message-preview"></a>Message Preview

Erzeugt das Vorschau-HTML für ein Posting.

### HTTP Method: `POST`

    mservice/board/:boardId/message/preview

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |

### Data Params

| Parameter | Beschreibung   |
| --------- | ---------------|
| text      | Message Body   |


### Response Data

| Feld               | Typ       | Beschreibung                             |
| ------------------ | --------- | ---------------------------------------- |
| text               | String    | Message Body als Plain Text              |
| textHtml           | String    | Message Body als HTML                    |
| textHtmlWithImages | String    | Message Body als HTML Images in IMG-Tags |


### Example Success Response

    HTTP/1.1 200 OK
    {
        "previewText": "Ein zu previewender Text mit Bild [http://www.example.com/image.png] und fettem Wort",
        "previewTextHtml": "Ein zu previewender Text mit Bild <a href=\"http://www.example.com/image.png\" target=\"_blank\">http://www.example.com/image.png</a> und <b>fettem Wort</b>",
        "previewTextHtmlWithImages": "Ein zu previewender Text mit Bild <a href=\"http://www.example.com/image.png\"><img src=\"http://www.example.com/image.png\"></a> und <b>fettem Wort</b>"
    }

### Example Error Response

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
    {
        "error": "boardId not found"
    }


## <a name="user-content-create-thread"></a>Create Thread

Erstellt einen neuen Thread.

### HTTP Method: `POST`

    mservice/board/:boardId/message

**`NEEDS AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |

### Data Params

| Parameter    | Beschreibung                        |
| ------------ | ------------------------------------|
| subject      | Thema (Betreff)                     |
| text         | Inhalt / Text                       |
| notification | Flag für Mailbenachrichtigung (1/0) |


### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response

##### Thema / Betreff Feld nicht gefüllt:

    HTTP/1.1 400 Bad Request
    {
        "error": "Subject not filled"
    }

##### Benutzername / Passwort ungültig:

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }


## <a name="user-content-create-reply"></a>Create Reply

Erzeugt eine Antwort zur übergebenen Message ID.

### HTTP Method: `POST`

    mservice/board/:boardId/message/:messageId

**`NEEDS AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| threadId  | Thread ID    |
| messageId | Message ID   |

### Data Params

| Parameter    | Beschreibung                        |
| ------------ | ------------------------------------|
| subject      | Thema (Betreff)                     |
| text         | Inhalt / Text                       |
| notification | Flag für Mailbenachrichtigung (1/0) |


### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response

##### Benutzername / Passwort ungültig:

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }

##### Zugehöriger Thread ist geschlossen:

    HTTP/1.1 423 Locked
    {
        "error": "Thread is closed"
    }


## <a name="user-content-edit-message"></a>Edit Message

Editiert die Message mit der übergebenen Message ID. Dies ist nur möglich sofern die Message von den mitgegeben Login Daten erzeugt wurde und noch keine Antwort erstellt wurde.

### HTTP Method: `PUT`

    mservice/board/:boardId/message/:messageId

**`NEEDS AUTHENTICATION`**

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| threadId  | Thread ID    |
| messageId | Message ID   |

### Data Params

| Parameter    | Beschreibung                        |
| ------------ | ------------------------------------|
| subject      | Thema (Betreff)                     |
| text         | Inhalt / Text                       |


### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response

##### Benutzername / Passwort ungültig:

    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}

##### Message wurde nicht vom in den Authentifizierung-Daten enthaltenen Benutzer erstellt:

    HTTP/1.1 403 Forbidden
    {
        "error": "Permission denied"
    }

##### Ungültige Board ID referenziert:

	HTTP/1.1 404 Not Found
	{
        "error": "boardId not found"
    }

##### Ungültige Message ID referenziert:

	HTTP/1.1 404 Not Found
	{
        error: "messageId not found"
    }

##### Message wurde unverändert abgesendet:

	HTTP/1.1 406 Not Acceptable
    {
        "error": "Data was not changed"
    }

##### Message hat bereits Antworten erhalten und kann deshalb nicht mehr editiert werden:

    HTTP/1.1 409 Conflict
    {
        "error": "This message was already answered"
    }

##### Zugehöriger Thread ist geschlossen:

    HTTP/1.1 423 Locked
    {
        "error": "Thread is closed"
    }


## <a name="user-content-search"></a>Search

Suche nach Postings.

### HTTP Method: `POST`

    mservice/search
    
### Data Params

| Parameter       | Beschreibung                                                                       |
| --------------- | -----------------------------------------------------------------------------------|
| phrase          | Suchbegriff                                                                        |
| searchInBody    | Suche in Nachrichtentext: 0 oder 1 (default: 0)                                    |
| username        | Postings von Benutzer                                                              |
| board           | BoardID (-1 für alle, default: -1)                                                 |

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
		        "boardId": 6,
		        "date": "2014-03-13T10:52:00+01:00",
		        "messageId": 3197031,
		        "subject": "Re:Wo bleibt das neue Ipad?",
		        "threadId": 142880,
		        "username": "futzi"
		    },
		    {
		        "boardId": 6,
		        "date": "2014-03-13T08:06:00+01:00",
		        "messageId": 3196947,
		        "subject": "Siehe Antwort unten an DS-Nadine n/t",
		        "threadId": 142880,
		        "username": "parademic"
		    },
		    {
		        "boardId": 6,
		        "date": "2014-03-13T08:04:00+01:00",
		        "messageId": 3196943,
		        "subject": "Re:Wann kann man mit einem neuen iPhone rechnen?",
		        "threadId": 142880,
		        "username": "parademic"
		    },
		    {
		        "boardId": 6,
		        "date": "2014-03-13T08:02:00+01:00",
		        "messageId": 3196940,
		        "subject": "Re:Wann kann man mit einem neuen iPhone rechnen?",
		        "threadId": 142880,
		        "username": "Wurzelgnom"
		    },
		    {
		        "boardId": 6,
		        "date": "2014-03-13T08:00:00+01:00",
		        "messageId": 3196938,
		        "subject": "was soll das bringen?",
		        "threadId": 142880,
		        "username": "Wurzelgnom"
		    },
            ...
        ]
    }



## <a name="user-content-search-threads"></a>Search Threads

Schnelle Suche nach dem Thema eines Threads. Entspricht der neuen Schnellsuche im oberen Frame. Die Original API des Maniac Forums nimmt hier keine Fehlerbehandlung vor, M!Service schaltet diese aus Gründen der Performance ebenfalls nicht vor. Wird also eine ungültige Board ID referenziert wird in jedem Fall ein leeres Suchergebnis zurückgegeben.

### HTTP Method: `POST`

    mservice/board/:boardId/search-threads

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |

### Data Params

| Parameter | Beschreibung   |
| --------- | ---------------|
| phrase    | Suchbegriff    |

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "id":152541,
                "messageId":3591301,
                "sticky":false,
                "closed":false,
                "username":"Bozbar!",
                "mod":false,
                "subject":"Der Apple Thread Nr. 45 - Welcome to Yosemite Park!",
                "date":"2014-10-17T12:35:00+02:00",
                "answerCount":266,
                "answerDate":"2014-10-28T15:55:00+01:00"
            },
            {
                "id":151906,
                "messageId":3567281,
                "sticky":false,
                "closed":false,
                "username":"Stitch",
                "mod":false,
                "subject":"Der Apple Thread Nr 44 - Bigger than Bigger",
                "date":"2014-09-09T21:08:00+02:00",
                "answerCount":1004,
                "answerDate":"2014-10-18T11:58:00+02:00"
            },
            {
                "id":150402,
                "messageId":3502734,
                "sticky":false,
                "closed":false,
                "username":"Stitch",
                "mod":false,
                "subject":"Der Apple Thread Nr 43 - WWDC 2014",
                "date":"2014-06-02T13:12:00+02:00",
                "answerCount":1039,
                "answerDate":"2014-09-10T03:10:00+02:00"
            },
            {
                "id":148175,
                "messageId":3415700,
                "sticky":false,
                "closed":false,
                "username":"Stitch",
                "mod":false,
                "subject":"Der Apple Thread Nr 42 - life, universe and everything",
                "date":"2014-01-16T19:19:00+01:00",
                "answerCount":971,
                "answerDate":"2014-06-03T10:23:00+02:00"
            },
            {
                "id":146386,
                "messageId":3342618,
                "sticky":false,
                "closed":false,
                "username":"Stitch",
                "mod":false,
                "subject":"Der Apple Thread Nummer 41 - OS X 10.9 Sea Lion",
                "date":"2013-10-11T20:29:00+02:00",
                "answerCount":1001,
                "answerDate":"2014-01-17T18:12:00+01:00"
            },
            {
                "id":145964,
                "messageId":3320238,
                "sticky":false,
                "closed":false,
                "username":"Stitch",
                "mod":false,
                "subject":"Der Apple Thread Nummer 40 - Das Champagner Phone",
                "date":"2013-09-10T16:10:00+02:00",
                "answerCount":1008,
                "answerDate":"2013-10-12T16:55:00+02:00"
            },
            ...
        ]
    }

## <a name="user-content-user"></a>User

Daten eines User-Profils.

### HTTP Method: `GET`

    mservice/user/:userId

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| userId    | Account-Nr.  |


### Response Data

| Feld               | Typ       | Beschreibung        |
| ------------------ | --------- | --------------------|
| userId             | Number    | Account-Nr.         |
| username           | String    | Benutzername        |
| picture            | String    | URL zum Profilbild  |
| firstname          | String    | Vorname             |
| lastname           | String    | Nachname            |
| domicile           | String    | Wohnort             |
| registrationDate   | Date      | Mitglied seit       |
| email              | String    | E-Mail              |
| icq                | String    | ICQ                 |
| homepage           | String    | Homepage            |
| firstGame          | String    | Erstes Spiel        |
| allTimeClassics    | String    | All-Time-Classics   |
| favoriteGenres     | String    | Lieblingsgenres     |
| currentSystems     | String    | Aktuelle Systeme    |
| hobbies            | String    | Hobbys              |
| xboxLiveGamertag   | String    | Xbox Live Gamertag  |
| psnId              | String    | PS Network ID       |
| nintendoFriendcode | String    | Nintendo Friendcode |
| lastUpdate         | Date      | Letztes Update      |


### Example Success Response

    HTTP/1.1 200 OK
    {
        "userId": 2615,
        "username": "Stitch",
        "picture": "http://maniac-forum.de/forum/images/profile/2600/2615.jpg",
        "firstname": "-",
        "lastname": "-",
        "domicile": "Gießen",
        "accountNo": "2615",
        "registrationDate": "",
        "email": "",
        "icq": "48592251",
        "homepage": "",
        "firstGame": "Summer Games",
        "allTimeClassics": "Turrican, Super Mario World, Zelda3, ShenMue I+II, Garou MOTW, GTA4",
        "favoriteGenres": "Jump 'n' Runs, Racer, Shen Mue artiges",
        "currentSystems": "Current:PS3, Xbox360, WindoofPast:Wii, NES, PS2, Gamecube, Dreamcast, GBA, NeoGeoPocket, PSX, SNES, MegaDrive, MasterSystem, GameBoy, C64",
        "hobbies": "",
        "xboxLiveGamertag": "",
        "psnId": "seeteufelfilet",
        "nintendoFriendcode": "",
        "lastUpdate": "2014-07-23T22:48:00+02:00"
    }

### Example Error Response

##### Ungültige Account-Nr. referenziert:

	HTTP/1.1 404 Not Found
    {
        "error": "userId not found"
    }

## <a name="user-content-latest-user"></a>Latest User

Das neuste Mitglied des Forums.

### HTTP Method: `GET`

    mservice/latest-user

### Response Data

| Feld               | Typ       | Beschreibung        |
| ------------------ | --------- | --------------------|
| userId             | Number    | Account-Nr.         |
| username           | String    | Benutzername        |

### Example Success Response

    HTTP/1.1 200 OK
    {
        "userId": 52917,
        "username": "Marty"
    }

# <a name="user-content-responses-service"></a>Responses

Liste aller Antworten, die ein Benutzer auf seine Beiträge erhalten hat. Die Liste wird aus dem Cache berechnet und erfolgt ohne Zugriff auf das Maniac Forum.

### HTTP Method: `GET`

    mservice/user/:username/responses

### URI Params

| Parameter | Beschreibung |
| --------- | ------------ |
| username  | Benutzername |

### Response Data

| Feld               | Typ       | Beschreibung        |
| ------------------ | --------- | --------------------|
| response           | Object    | Antwort             |
| response.boardId   | Number    | Board-Id _[1]_      |
| response.threadId  | Number    | Thread-Id           |
| response.messageId | Number    | Antwort Message-Id  |
| response.subject   | String    | Betreff der Antwort |
| response.username  | String    | Antwortender        |
| response.date      | Date      | Datum der Antwort   |

**Hinweise:**<br/>
[1]: Falls das entsprechende Board nicht mehr im Cache ist und dadurch nicht mehr ermittelt werden kann, ist dieser Wert `-1`.

### Example Success Response

    HTTP/1.1 200 OK
    {
      "boardId": 1,
      "threadId": 164473,
      "messageId": 4072381,
      "subject": "Re:Süß",
      "username": "bubbabenali",
      "date": "2017-02-12T10:17:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 164473,
      "messageId": 4072501,
      "subject": "Re:Süß",
      "username": "Signor Rossi",
      "date": "2017-02-12T16:24:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 164473,
      "messageId": 4068621,
      "subject": "Re:Ich hab schon eine ... aus Papier",
      "username": "PaulBearer",
      "date": "2017-02-05T10:45:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 164473,
      "messageId": 4068493,
      "subject": "Re:Ich hab schon eine ... aus Papier",
      "username": "JPS",
      "date": "2017-02-04T20:11:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 164473,
      "messageId": 4068278,
      "subject": "Re:Wo ist denn das Problem mit den Richtungstasten?",
      "username": "Deadly Engineer",
      "date": "2017-02-04T09:28:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 162067,
      "messageId": 4055840,
      "subject": "Re:Kommt das wohl auch als Standalone?",
      "username": "Proebbel",
      "date": "2017-01-15T12:34:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 162067,
      "messageId": 4050642,
      "subject": "Re:Season 4 / Event 3: Finnland - Ergebnisse",
      "username": "McDee",
      "date": "2017-01-08T17:32:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 162067,
      "messageId": 4050669,
      "subject": "Re:Season 4 / Event 3: Finnland - Ergebnisse",
      "username": "KikjaR",
      "date": "2017-01-08T18:08:00+01:00"
    },
    {
      "boardId": 1,
      "threadId": 162067,
      "messageId": 4046916,
      "subject": "Ja, auf jeden Fall!",
      "username": "musashi",
      "date": "2017-01-01T16:03:00+01:00"
    }

## <a name="user-content-whos-online"></a>Who's online

Übersicht über die aktuell eingeloggten User.

### HTTP Method: `GET`

    mservice/users/online

### Example Success Response

    HTTP/1.1 200 OK
    {
        "count":  {
            "hidden": 24,
            "total": 26,
            "visible": 2
        },
        "users": {
            "userId": 2615,
            "username": "Stitch"
        },
        {
            "userId": 29472,
            "username": "K!M"
        }
    }

## <a name="user-content-favorites"></a>Favorites

Liste der Favoriten.

### HTTP Method: `GET`

    mservice/favorites
    
**`NEEDS AUTHENTICATION`**

### Example Success Response

    HTTP/1.1 200 OK
	[
	    {
	        "boardId": "6",
	        "closed": false,
	        "date": "2018-09-20T10:13:00+02:00",
	        "id": 171650,
	        "isFavorite": true,
	        "isRead": true,
	        "lastMessageDate": "2018-11-16T16:45:00+01:00",
	        "lastMessageId": 4410032,
	        "lastMessageIsRead": true,
	        "messageId": 4378443,
	        "messagesCount": 765,
	        "messagesRead": 2,
	        "mod": false,
	        "sticky": false,
	        "subject": "Apple Thread #56 - Die Max Edition",
	        "username": "Steppenwolf"
	    },
	    {
	        "boardId": "6",
	        "closed": false,
	        "date": "2016-12-11T08:07:00+01:00",
	        "id": 163732,
	        "isFavorite": true,
	        "isRead": true,
	        "lastMessageDate": "2018-11-15T07:42:00+01:00",
	        "lastMessageId": 4409112,
	        "lastMessageIsRead": true,
	        "messageId": 4034674,
	        "messagesCount": 576,
	        "messagesRead": 2,
	        "mod": false,
	        "sticky": false,
	        "subject": "Die M!client App für iOS - Eine Bitte",
	        "username": "Steppenwolf"
	    }
	]
	
## <a name="user-content-add-to-favorites"></a>Add to Favorites

Fügt Thread den Favoriten hinzu.

### HTTP Method: `post`

    mservice/favorites/:threadId
    
**`NEEDS AUTHENTICATION`**

### Example Success Response

    HTTP/1.1 200 OK
    
## <a name="user-content-delete-from-favorites"></a>Delete from Favorites

Entfernt Thread aus den Favoriten.

### HTTP Method: `delete`

    mservice/favorites/:threadId
    
**`NEEDS AUTHENTICATION`**

### Example Success Response

    HTTP/1.1 200 OK

# <a name="user-content-lizenz"></a>Lizenz

M!service ist freie Software und steht unter der [MIT-Lizenz](https://en.wikipedia.org/wiki/MIT_License).
