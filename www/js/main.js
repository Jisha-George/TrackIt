'use strict';

//get width nad height of device. we do not need to wair for the dom
var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

//DECLARE GLOBAL VARS
var wall_bg_image;
var wallslider = null;
var wallimagedata;
var image;
var TO_RADIANS = Math.PI / 180;
var inpg = false;
var audioElement;
var i;
var tracks_recorded;

document.addEventListener("deviceready", function () {
    console.log('device ready');
    setupPush();
    setup();
});

function onDeviceReady() {
    console.log("Device Ready", device.platform);
    inpg = true;
    pictureSource = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;
    console.log(pictureSource, destinationType);
}

$(document).bind('pageinit')
{
    console.log("Ready!");
    innit();
    setup();
};


function innit() {
    document.addEventListener("online", onOnline, false);
    document.addEventListener("offline", onOffline, false);
    
    if (window.navigator.onLine) {
        
        $('body').addClass('online');
    } else {
        
        $('body').addClass('offline');
    }
}

function onOffline() {
    $('body').removeClass('online');
    $('body').addClass('offline');
}

function onOnline() {
    $('body').addClass('online');
    $('body').removeClass('offline');
}

function setup() {
    var track_id = '';
    var watch_id = null;
    var tracking_data = [];
    
    if (window.navigator.offLine) {
        $("#home_network_button").text('No Internet Access').attr("data-icon", "delete"). button('refresh');
    } else {
        console.log('online');
    }
    
    $('#home_clearstorage_button').on('click', function (event) {
        console.log('clear');
        //prevent default action i.e go to a link
        event.preventDefault();
        //clear local storage
        window.localStorage.clear();
    });
    
    $("#startTracking_start").on('click', function () {
        console.log('Start Tracking');
        //Start tracking the User
        //watchPosition- Returns the device's current position when a change in position is detected
        watch_id = navigator.geolocation.watchPosition(
            //success
            function (position) {
                //temp variable collecting data in an array
                var g = {
                    timestamp: position.timestamp,
                    coords: {
                        heading: null,
                        alitude: null,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        latitude: position.coords.latitude,
                        speed: position.coords.speed,
                        altitudeAccuracy: null
                    }
                };
                //push an array into an arrray (multidimensional)
                tracking_data.push(g);
                console.log(g, tracking_data.length);
            },
            //Error
            function (error) {
                console.log(error);
            },
            //settings
            {
                enableHighAccuracy: true
            });
        //tidy up the UI
        track_id = $("#track_id").val();
        $("#track_id").hide();
        $("startTracking_status").gtml("Tracking workout: <strong>" + track_id + "</strong>");
    });  

$("#startTracking_stop").on('click', function () {
   //stop tracking the user
    navigator.geolocation.clearWatch(watch_id);
    console.log('stop tracking', tracking_data, tracking_data.length, JSON.stringify(tracking_data));
    //save the tracking data
    if(track_id == '') {
        track_id = 'TrackID: ' + Date();
        window.localStorage.setItem(track_id, JSON.stringify(tracking_data));
    } else {
    window.localStorage.setItem(track_id, JSON.stringify(tracking_data));
    }
    //reset watch_id and tracking_data
    watch_id = null;
    tracking_data = null;
    console.log('reset');
    
    //tidy UI
    $("#track_id").val("").show();
    $("#startTracking_status").html("Stopped tracking path <strong>" + track_id + "</strong>");
});
   
    $("#home_seedgps_button").on('click', function () {
        console.log('add storage');
        window.localStorage.setItem('LINCOLN',
'[{"timestamp":1335700802000,"coords": {"heading":null,"altitude":null,"longitude":-0.544279,"accuracy":0,"latitude":53.226664,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700803000,"coords":{"heading":null,"altitude":null,"longitude":-0.549027,"accuracy":0,"latitude":53.227855,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700804000,"coords":{"heading":null,"altitude":null,"longitude":-0.549128,"accuracy":0,"latitude":53.227976,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700805000,"coords":{"heading":null,"altitude":null,"longitude":-0.548734,"accuracy":0,"latitude":53.228507,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700806000,"coords":{"heading":null,"altitude":null,"longitude":-0.546915,"accuracy":0,"latitude":53.228008,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700807000,"coords":{"heading":null,"altitude":null,"longitude":-0.546687,"accuracy":0,"latitude":53.228063,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700808000,"coords":{"heading":null,"altitude":null,"longitude":-0.546556,"accuracy":0,"latitude":53.228150,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700809000,"coords":{"heading":null,"altitude":null,"longitude":-0.543826,"accuracy":0,"latitude":53.227356,"speed":null,"altitudeAccuracy":null}}]');
});
}

$(document).on('pagecreate', '#history', function () {
    console.log('history page');
	
    //count the number of entries in local Storage and display this information to the user
    tracks_recorded = window.localStorage.length;
    $("#tracks_recorded").html("<strong" + tracks_recorded + "</strong> Workout(s) recorded: ");
    
    //Empty the list of recorded tracks
    $("#history_tracklist").empty();
     
    //Iterate over all of the recorded tracks, populating the list
    for (i = 0; i < tracks_recorded; i++) {
        $("#history_tracklist").append("<li><a href='#track_info' data-ajax='false'>" + window.localStorage.key(i) + "</a></li>").trigger("create");
    }
    
    //tell jquerymobile to refresh the list
    $("#history_tracklist").listview('refresh');
    
    //when the user clicks a link to view track info, set/change the track_id attribute on the track_info page
    $("#history_tracklist li a").on('click', function () {
        console.log('click track');
        $("track_info").attr("track_id", $(this).text());
    });
});

$(document).on('pagecreate', '#track_info', function () {
	//find the track_id of the workout they are viewing
	var key = $(this).attr("track_id");
	console.log('track info', key);
	//Update the Track info page header to the track_id
	$("#track_info div[data-role=header] h1").text(key);
	//get all FPS data for the track
	var data = window.localStorage.getItem(key);
	//turn stringified GPS data into JS object
	data = JSON.parse(data);
	//calculate total distance travelled
	var total_km = 0;
	
	for (i = 0; i < data.length; i++) {
		
		if(i == (data.length - 1)) {
			break;
		}
		total_km += gps_distance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i + 1].coords.longitude);
	}
	var total_km_rounded = total_km.toFixed(2);
								 
	// Calculate the total time taken for the track
	var start_time = new Date(data[0].timestamp).getTime();
	var end_time = new Date(data[data.length-1].timestamp).getTime();
	var total_time_ms = end_time - start_time;
	var total_time_s = total_time_ms / 1000;
	var final_time_m = Math.floor(total_time_s / 1000);
	var final_time_s = total_time_s - (final_time_m * 60);
	// Display total distance and time
	$("#track_info_info").html('Travelled <strong>' + total_km_rounded + '</strong> km in <strong>' + final_time_m + 'm</strong> and <strong>' + final_time_s + 's</strong>');
		
	//set initial Lat and Long of google map
	//takes first coords of tracking
	var myLatLng = new google.maps.LatLng(data[0].coords.latitude, data[0].coords.longitude);
	//googleMap options
	var myoptions = {
		zoom: 16,
		center: myLatLng,
		mapTypeId: google.maps.mapTypeId.ROADMAP
	};
	
	//create the google map set options - google maps api	
		
});

//Array containing GPS position objests
function gps_distance(lat1, lon1, lat2, lon2) {
 // if you like gps maths look at http://www.movable-type.co.uk/scripts/latlong.html
 //Haversine formula
 var R = 6371; // Radius of the earth in km
 var dLat = (lat2 - lat1) * (Math.PI / 180);
 var dLon = (lon2 - lon1) * (Math.PI / 180);
 var lat1 = lat1 * (Math.PI / 180);
 var lat2 = lat2 * (Math.PI / 180);
 var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
 var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 var d = R * c;
 return d;
}

$(document).on("pagebeforeshow", function () {
	// When entering pagetwo
	//alert("page is about to be shown");
});

$(document).on("pagecontainershow", function () {
	// When entering pagetwo
});

$(document).on("pagecontainerload", function (event, data) {
	//alert("pageload event fired!");
});

$(document).on('pagecreate', '#menu', function () {
	console.log("pagecreate menu");
});


	
	
//function onPhotoDataSuccess(imageData) {
//
//	// store image data so we can manipulate it, put it in a canvas or img tag
//	//this is a global variable and can be accessed when we want - jqm uses ajax so there is no page refresh
//	// so we can store and access with no issues
//	//wallimagedata = imageData;
//
//	// this tells JQM to load in a new page programmatically not through a link
//
//}
//
//// Called when a photos file is successfully retrieved
////
//function onPhotoFileSuccess(imageData) {
//	// Get image handle
//	//alert('image taken');
//	console.log(JSON.stringify(imageData));
//
//	var wallImage = new Image();
//
//	// Show the captured photo
//	// The inline CSS rules are used to resize the image
//	//
//	wallImage.src = imageData;
//	document.body.appendChild(wallImage);
//}
//
//// Called when a photo is successfully retrieved
////
//function onPhotoURISuccess(imageURI) {
//	// Uncomment to view the image file URI 
//	console.log('image uri is', imageURI);
//
//	// Get image handle
//	//
//	var largeImage = document.getElementById('largeImage');
//
//	// Unhide image elements
//	//
//	largeImage.style.display = 'block';
//
//	// Show the captured photo
//	// The inline CSS rules are used to resize the image
//	//
//	largeImage.src = imageURI;
//}
//
//// A button will call this function
////
//function capturePhotoWithData() {
//	console.log('photo event fired');
//	// Take picture using device camera and retrieve image as base64-encoded string
//    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
//        quality: 80,
//        correctOrientation: true
//    });
//
//}
//
//function capturePhotoWithFile() {
//	navigator.camera.getPicture(onPhotoFileSuccess, onFail, {
//		quality: 80,
//		destinationType: Camera.DestinationType.FILE_URI
//	});
//}
//
//// A button will call this function
////
//function getPhoto(source) {
//	// Retrieve image file location from specified source
//	navigator.camera.getPicture(onPhotoURISuccess, onFail, {
//		quality: 80,
//		destinationType: destinationType.FILE_URI,
//		sourceType: source
//	});
//}
//
//// Called if something bad happens.
//// 
//function onFail(message) {
//	alert('Failed because: ' + message);
//}
//
//function onSuccess(stream) {
//    var video = document.querySelector('video');
//    Video.src = URL.createObjectURL(stream);
//    Video.onloadedmetadata = function (e) {
//    };
//}