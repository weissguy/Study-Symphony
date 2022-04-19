// input song name + info from ML, generate youtube video id, output to database
// find some database to store last 10 songs, next ? songs
// ***check that the video does not contain copyrighted music -> unable to play
// runs continually in background, checks if AI sends new info, if new video played to add to queue

/*import axios from "axios";
import cheerio from "cheerio";

const axios = require('axios')
const cheerio = require('cheerio')

const extractLinks = $ => [ 
	...new Set( 
		$('.page-numbers a') // Select pagination links 
			.map((_, a) => $(a).attr('href')) // Extract the href (url) from each link 
			.toArray() // Convert cheerio object to array 
	), 
]; 
 
axios.get('https://scrapeme.live/shop/').then(({ data }) => { 
	const $ = cheerio.load(data); // Initialize cheerio 
	const links = extractLinks($); 
 
	console.log(links); 
	// ['https://scrapeme.live/shop/page/2/', 'https://scrapeme.live/shop/page/3/', ... ] 
});*/








// boolean, set to true if this is first time installing extension, used to customize options page message
var first_time = false;

// contains running list of all video ids to be played in current tab listening session        FIXME will get these from AI
var ids = [
    {"title": "bossa nova jazz", "id": "Y-JQ-RCyPpQ", "artist": "Cafe Music", "genre": "jazz", "length": "4:01:17", "confidence": 0.7, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false},
	{"title": "lofi hip hop radio", "id": "5qap5aO4i9A", "artist": "Lofi Girl", "genre": "lofi", "length": "live", "confidence": 0.3, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false},
	{"title": "Christmas Time is Here", "id": "DxF1rl3Bpms", "artist": "Charles Cornell", "genre": "jazz", "length": "5:23", "confidence": 0.7, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false},
	{"title": "Shortest Math Video", "id": "ALGJtSWToiM", "artist": "Canned Maths", "genre": "?", "length": "0:04", "confidence": 0.7, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false},
	{"title": "Lucy", "id": "z17vPBJzlG0", "artist": "Bluecoats", "genre": "DCI", "length": "13:33", "confidence": 0.7, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false},
	{"title": "Epic Boss Music", "id": "SuVYiUqz7XI", "artist": "Domi, Louis Cole", "genre": "funk", "length": "3:25", "confidence": 0.7, "user_review": -1, "productivity": -1, "start_time": 0, "end_time": 0, "skipped": false}
];

// scrape.js changes to true when it adds new ids, video.js changes to false when it updates ids in session storage
var changeInIds = false;

// updated index of id in ids to play
var idNumber = 0;

// gets id from list
var id = ids[idNumber]["id"];



// addIds("21Ki96Lsxhc");

function addIds(newIds) { // newInfo should look like {title, id, artist, genre, length}

	// console.log("function call, should wait 10 seconds"); // timer is for testing purposes to simulate periodic calls of function

	// setTimeout(() => {
		ids.push(newIds);
		changeInIds = true;
		console.log("updated ids with: " + newIds);
	// }, 10000);

}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.greeting === "ids_updated") {
        ids = request.new_ids;
    } else if (request.action === "add_first_time_message?" && first_time) {
        sendResponse(true);
        first_time = false;
    }
    return true;
});


// when the extension is first installed,
chrome.runtime.onInstalled.addListener(function(object) {

    // if (chrome.runtime.onInstalledReason === "install") { FIXME remove comments for intended final functionality

        chrome.runtime.openOptionsPage(); // open the options page

        chrome.storage.sync.set({ "genres" : Array(12).fill(false) }); // initialize genres variable, post to chrome.storage.sync
        chrome.storage.sync.set({ "artists" : Array(5).fill("") }); // initialize artists variable, post to chrome.storage.sync
        chrome.storage.sync.set({ "background" : "blue" }); // initialize background variable to default blue, post to chrome.storage.sync

        first_time = true;
        
    // } else if (chrome.runtime.onInstalledReason === "update") {
        // chrome.runtime.openOptionsPage();
    // }

});