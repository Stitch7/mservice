M!service
========

M!service ist ein in JavaScript geschriebener Serverdienst, der eine RESTful JSON API für das Man!ac Forum bereitstellt.

# Usage
Vorraussetzung ist `NodeJS` >= v0.10.30 (ältere Versionen wurden nicht gestestet)<br/>
Für den Betrieb empfiehlt sich der Einsatz von `forever`:<br/>
https://github.com/nodejitsu/forever
    
    $ [sudo] npm install forever -g
    $ forever start -c mservice.js [OPTIONS]

### Command Line Options

    $ ./mservice.js --help
    M!service Server

    Examples:
      node ./mservice.js                                                                Starts server
      node ./mservice.js -k=/etc/ssl/localcerts/my.key -c=/etc/ssl/localcerts/my.crt    Starts server in SSL mode
      node ./mservice.js -l=/var/log/mservice/mservice.log                              Starts server with log file
      node ./mservice.js --verbose-logging | mservice/node_modules/bunyan/bin/bunyan    Starts server for development

    Options:
      -h, --help         Displays this help message
      -p, --port         TCP port                                                     [default: 8080]
      -u, --maniac-url   URL to maniac-forum                                          [default: "https://maniac-forum.de/forum/pxmboard.php"]
      -k, --key          Path to ssl key
      -c, --certificate  Path to ssl certificate
      --log-file         Output file for log (If false, output goes to stdout)        [default: false]
      --disable-logging  Disables logging                                             [default: false]
      --verbose-logging  If enabled all requests are logged (useful for development)  [default: false]


# API



### Parameter

Spezifische Ressourcen werden über Parameter angesprochen. Falls vorhanden, sind die Parameter zur Spezifizierung einer Ressource Teil der dazugehörigen URI welche in der Beschreibung Platzhalter in Form von _:ParameterName_ enthält die in der Tabelle _URI Params_ beschrieben sind.
Parameter zur Manipulation einer Ressource werden im Request Body mitgesendet und sind falls vorhanden in der Tabelle _Dara Params_ beschrieben. 

### Authentifizierung

Einige Ressourcen benötigen Authentifizierung, dazu muss beim Request eine gültige Username / Passwort Kombination für das Man!ac-Forum im HTTP-Header in Form von Basic Authentication nach RFC 2617 mitgesendet werden. Wenn eine Ressource eine gültige Authentifizierung benötigt dies mit __`NEEDS AUTHENTICATION`__ unterhalb der URI markiert.

### Responses

Bei der Verwendung der API ist der HTTP Status Code der Server Response zu beachten. Alle gültigen Requests erhalten eine Response mit Code 200, im Fehlerfall wird der entsprechende Code laut RFC 7231 und eine Beschreibung des Fehlers im Feld `error` zurückgegeben. Alle spezifischen Error Responses der einzelnen Ressourcen werden als _Example Error Response_ zu der jeweiligen Ressource beschrieben. 

__Allgemeine Error Responses:__

| HTTP Status Code            | Beschreibung                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 404 - Not Found             | Die angeforderte Ressource existiert nicht                                                                       |
| 405 - Method Not Allowed    | Die verwendete HTTP Methode für die angeforderte Ressource ist nicht erlaubt                                     |
| 500 - Internal Server Error | Unbekannter Fehler ist aufgetreten                                                                               |
| 504 - Gateway Timeout       | Es konnte keine Verbindung zum Forumsserver hergestellt werden, tritt zB in den Downzeiten während der Nacht auf |




## Test Login

Überprüft Login Daten.

### HTTP Method: `GET`

    mservice/test-login

__`NEEDS AUTHENTICATION`__

    
### Example Success Response

    HTTP/1.1 200 OK

### Example Error Response
	
    HTTP/1.1 401 Unauthorized
    {
    	"error": "Authentication failed"
	}
    

## Boards

Daten der Startseite / Boardübersicht.

### HTTP Method: `GET`

    mservice/boards    

### Response Data

| Feld       | Typ       | Beschreibung |
| ---------- | --------- | ------------ |
| board      | Object    | Board        |
| board.id   | Number    | Board ID     |
| board.text | String    | Board Name   |

### Example Success Response

    HTTP/1.1 200 OK
    {     
        [
            {
                "id":1,
                "name":"Smalltalk"
            },
            {
                "id":2,
                "name":"For Sale"
            },
            {
                "id":4,
                "name":"Tech'n'Cheats"
            },
            {
                "id":6,
                "name":"OT"
            },
            {
                "id":26,
                "name":"Filme &amp; Serien"
            },
            {
                "id":8,
                "name":"Online-Gaming"
            }
        ]   
    }



## Threads

List der Threads (Daten des oberen Frames) eines Boards.

### HTTP Method: `GET`

    mservice/board/:boardId/threads

### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |


### Response Data

| Feld               | Typ       | Beschreibung                      |
| ------------------ | --------- | --------------------------------- |
| thread             | Object    | Thread                            |
| thread.id          | Number    | Thread ID                         |
| thread.messageId   | Number    | Message ID des Eingangspostings   |
| thread.sticky      | Boolean   | Thread ist sticky                 |
| thread.closed      | Boolean   | Thread ist geschlossen            |
| thread.author      | String    | Benutzername des Threadersteller  |
| thread.mod         | String    | Threadersteller ist ein Moderator |
| thread.subject     | String    | Betreff                           |
| thread.date        | Date      | Erstellungsdatum                  |
| thread.answerCount | Number    | Anzahl der Antworten              |
| thread.answerDate  | Date      | Datum der letzten Antwort         |


**Hinweis:**<br/>
Wenn sticky=TRUE, ist closed immer FALSE.<br/>
Ob ein Sticky Thread geschlossen ist kann nicht aus dem HTML entnommen werden.

### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "id": 151906,
                "messageId": 3567281,
                "sticky": false,
                "closed": false,
                "author": "Stitch",
                "mod": false,
                "subject": "Der Apple Thread Nr 44 - Bigger than Bigger",
                "date": "2014-09-09T21:08:00+02:00",
                "answerCount": 925,
                "answerDate": "2014-10-10T14:19:00+02:00"
            },
            {
                "id": 152011,
                "messageId": 3571292,
                "sticky": false,
                "closed": false,
                "author": "Andi",
                "mod": true,
                "subject": "Was ich noch sagen wollte... Thread Nr. 201b",
                "date": "2014-09-15T21:29:00+02:00",
                "answerCount": 670,
                "answerDate": "2014-10-10T22:32:00+02:00"
            },
            {
                "id": 150258,
                "messageId": 3497478,
                "sticky": false,
                "closed": false,
                "author": "TOM",
                "mod": false,
                "subject": "Die besten Filmchen aller Zeiten - Teil 25",
                "date": "2014-05-24T23:24:00+02:00",
                "answerCount": 416,
                "answerDate": "2014-10-10T22:29:00+02:00"
            },
            ...
        ]
    }


## Thread

Liste der Messages (Daten des mittleren Frames) eines Threads.

### HTTP Method: `GET`

    mservice/board/:boardId/thread/:threadId
    
### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| threadId  | Thread ID    |


### Response Data

| Feld               | Typ       | Beschreibung                            |
| ------------------ | --------- | --------------------------------------- |
| message            | Object    | Message                                 |
| message.id         | Number    | Message ID                              |
| message.level      | Number    | Grad der Einrückung in der Baumstruktur |
| message.subject    | String    | Betreff                                 |
| message.mod        | String    | Messageersteller ist ein Moderator      |
| message.username   | String    | Benutzername                            |
| message.date       | Date      | Erstellungsdatum                        |


### Example Success Response

    HTTP/1.1 200 OK
    {
        [
            {
                "messageId": 3567281,
                "level": 0,
                "subject": "Der Apple Thread Nr 44 - Bigger than Bigger",
                "mod": false,
                "username": "Stitch",
                "date": "2014-09-09T21:08:00+02:00"
            },
            {
                "messageId": 3585057,
                "level": 1,
                "subject": "2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Wurzelgnom",
                "date": "2014-10-08T10:18:00+02:00"
            },
            {
                "messageId": 3585192,
                "level": 2,
                "subject": "Re:2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Stitch",
                "date": "2014-10-08T12:24:00+02:00"
            },
            {
                "messageId": 3585540,
                "level": 3,
                "subject": "Re:2 Wochen mit dem iPhone 6",
                "mod": false,
                "username": "Wurzelgnom",
                "date": "2014-10-08T17:30:00+02:00"
            },
            {
                "messageId": 3585158,
                "level": 2,
                "subject": "Mir ist in 15 Jahren mein Handy fast nie...",
                "mod": false,
                "username": "PoP",
                "date": "2014-10-08T11:55:00+02:00"
            },
            {
                "messageId": 3586454,
                "level": 3,
                "subject": "Re:Mir ist in 15 Jahren mein Handy fast nie...",
                "mod": false,
                "username": "Lizardking",
                "date": "2014-10-09T21:09:00+02:00"
            },
            ...
        ]
    }    


## Message

Daten des unteren Frames, eine Message.

### HTTP Method: `GET`

    mservice/board/:boardId/message/:messageId

### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Response Data

| Feld               | Typ       | Beschreibung                             |
| ------------------ | --------- | ---------------------------------------- |
| messageId          | Number    | Message ID                               |
| userId             | Number    | Account-Nr.                              |
| username           | String    | Benutzername                             |
| subject            | String    | Betreff                                  |
| date               | Date      | Erstellungsdatum                         |
| text               | String    | Message Body als Plain Text              |
| textHtml           | String    | Message Body als HTML                    |
| textHtmlWithImages | String    | Message Body als HTML Images in IMG-Tags |

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


## Quote Message

Zitierter Text einer Message.

### HTTP Method: `GET`

    mservice/board/:boardId/quote/:messageId

### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Response Data

| Feld               | Typ       | Beschreibung        |
| ------------------ | --------- | --------------------|
| quote              | String    | Zitat (Plain Text)  |
    
### Example Success Response

    HTTP/1.1 200 OK    
    {
        "quote": ">[img:https://i.imgur.com/ETtsCml.jpg]\n>\n>Link zum Vorgänger:\n>[https://www.maniac-forum.de/forum/pxmboard.php?mode=message&brdid=6&msgid=3502734]"
    }    

## User

Daten eines User-Profils.

### HTTP Method: `GET`

    mservice/user/:userId

### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| userId    | Account-Nr.  |


### Response Data

| Feld               | Typ       | Beschreibung        |
| ------------------ | --------- | --------------------|
| userId             | Number    | Account-Nr.         |
| image              | String    | URL zum Profilbild  |
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
        "picture": "https://maniac-forum.de/forum/images/profile/2600/2615.jpg",
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

	HTTP/1.1 404 Not Found
    {
        "error": "userId not found"
    }


## Message Preview

Erzeugt das Vorschau-HTML für ein Posting.

### HTTP Method: `POST`

    mservice/board/:boardId/message/preview
    
### URL Params

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

	HTTP/1.1 404 Not Found
    {
        "error": "boardId not found"
    }
        

## Create Thread

Erstellt einen neuen Thread.

### HTTP Method: `POST`

    mservice/board/:boardId/message
    
__`NEEDS AUTHENTICATION`__    
    
### URL Params

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

## Create Reply

Erzeugt eine Antwort zur übergebenen Message ID.

### HTTP Method: `POST`

    mservice/board/:boardId/message/:messageId

__`NEEDS AUTHENTICATION`__    
    
### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Data Params

| Parameter    | Beschreibung                        |
| ------------ | ------------------------------------|
| subject      | Thema (Betreff)                     |
| text         | Inhalt / Text                       |
| notification | Flag für Mailbenachrichtigung (1/0) |
    
    
### Example Success Response

    HTTP/1.1 200 OK

    
## Edit Message

Editiert die Message mit der übergebenen Message ID. Dies ist nur möglich sofern die Message von den mitgegeben Login Daten erzeugt wurde und noch keine Antwort erstellt wurde. 

### HTTP Method: `PUT`

    mservice/board/:boardId/message/:messageId    

__`NEEDS AUTHENTICATION`__

### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |

### Data Params

| Parameter    | Beschreibung                        |
| ------------ | ------------------------------------|
| subject      | Thema (Betreff)                     |
| text         | Inhalt / Text                       |


### Example Success Response

    HTTP/1.1 200 OK
    

## Notification

Schaltet die Mailbenachrichtigung für die übergebene Message ID an oder aus. Die Original API des Maniac Forums bietet leider keine Möglichkeit die Mailbenachrichtigung explizit an oder auszuschalten. Ist die Mailbenachrichtigung also bereits aktiv schaltet dieser Request sie aus, ist sie nicht aktiv wird sie entspechend aktiviert.

### HTTP Method: `GET`

    mservice/board/:boardId/notification/:messageId

__`NEEDS AUTHENTICATION`__
    
### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |
    
## Status of Notification

### HTTP Method: `GET`

    mservice/board/:boardId/notification-status/:messageId    
    
__`NEEDS AUTHENTICATION`__    
    
### URL Params

| Parameter | Beschreibung |
| --------- | ------------ |
| boardId   | Board ID     |
| messageId | Message ID   |
    

## Search Threads

Schnelle Suche nach dem Thema eines Threads. Entspricht der neuen Schnellsuche im oberen Frame. Die Original API des Maniac Forums nimmt hier keine Fehlerbehandlung vor, M!Service schaltet diese aus Gründen der Performance ebenfalls nicht vor. Wird also eine ungültige Board ID referenziert wird in jedem Fall ein leeres Suchergebnis zurückgegeben.    

### HTTP Method: `POST`

    mservice/board/:boardId/search-threads

### URL Params

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
