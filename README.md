# Puzzle+
By Dan Vanderkam, based on [lmnopuz](https://github.com/martine/lmnopuz), by Evan Martin and Dan Erat

<img src="app/220x140.png" width=220 height=140>

Puzzle+ is a crossword puzzle application for Google+ Hangouts. It allows
collaborative solving of crosswords (i.e. puz files) in G+. The hangout provides
videoconferencing to go along with the puzzle-solving.

## Quickstart

To run locally, you'll need to install [node.js](http://nodejs.org/). Then run:

```bash
git clone https://github.com/puzzleplus/puzzleplus.git
cd puzzleplus
npm install
./node_modules/.bin/lonely app/puzzleplus.xml
```

And visit localhost:8080 in your browser of choice. At this point, you have a standard save-reload iteration cycle.

You can open localhost:8080 in multiple tabs (or multiple browsers) to test multiplayer situations.

This uses [lonely hangouts](https://github.com/danvk/lonely) to simulate the Google+ Hangouts API.

## Development tips

All state in a Hangouts app is contained in the global, shared [state object](https://developers.google.com/+/hangouts/writing#state). For Puzzle+, the state object looks like this:

```javascript
{
  "crossword": "...",         // (bytes of the .puz file)
  "@rgb(178,255,178)": 1234,  // @ + color -> player ID
  "c1234": "4,2",             // c + player ID -> cursor position
  "1,2":"O\t1234",            // (x, y) -> "Answer<tab>Player ID"
  "2,2":"R\t1234",
  "3,2":"T\t1234",
  ...,
  "g1,1,x": "",  // wrong guesses
  "g3,4,y": "",
  ...,
  "v,check,(type),(player_id)": "",  // pending votes
  ...
}
```

If some of the mapping seem a bit strange, it's because the state object is structured to take advantage of the Hangout API's conflict resolution system. For example, rather than mapping player ID→color, it maps color→player ID. This means that the Hangouts server will ensure that no two players ever have the same color.

## Publishing the Hangouts App

To publish an update to "production", run:

    cp app/* ../puzzleplus.github.io/app/

And then push the changes to puzzleplus.github.io.

The [Google API project](https://console.developers.google.com/project/816682636912/apiui/apiview/plusHangouts?tabId=hangout),
which contains branding information and a pointer to the XML file, is called
"puzzle+".

## Puzzle+ history

**2007-2008**

derat and emartin create lmnopuz, with a JS frontend and a Ruby backend.
The service works, but there's no good place to host it.

**2009**

After learning about Wave, danvk remembers lmnopuz and writes the code to store
crossword state in a wave. Work is abandoned after the realization that there's
no way to access uploaded files via JavaScript, a crucial feature of lmnowave.

**2010**

After going on a hike with another developer, danvk learns that Firefox 3.6 has
added support for the HTML5 File API. lmnowave is now possible! Hacking
resumes!

**2011**

Wave is canceled, but the Wave Gadgets API (and hence "lmnowave") lives on as
"Google Shared Spaces".

**2012**

Google Shared Spaces is killed/morphed into the Google+ Hangouts API. lmnowave
is rebranded as "puzzle+" and re-released. Lonely Hangouts is also developed
and released to speed up iteration on multiplayer scenarios.
