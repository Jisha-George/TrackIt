'use strict';

//get width nad height of device. we do not need to wair for the dom
var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

//DECLARE GLOBAL VARS
var i, tracks_recorded, map;//, wallimagedata, image;
var wallslider = null;
var TO_RADIANS = Math.PI / 180;
var inpg = false;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device Ready", device.platform);
    //bypass camera function
    inpg = true;
    //store camera info on device
    destinationType = navigator.camera.DestinationType,
    pictureSource = navigator.camera.PictureSourceType,
    console.log(pictureSource, destinationType);
}

$(document).ready(function () {
    console.log("Ready!");
    innit();
    setup();
});

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
               var geo = {
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
            //push an array into an array (multidimensional)
                tracking_data.push(geo);
                console.log(geo, tracking_data.length);
            },
            //Error
            function (error) {
                console.log(error);
                alert('Failed because: ' + error);
            },
            //settings
            {
                enableHighAccuracy: true
            });
        //tidy up the UI
        track_id = $("#track_id").val();
        $("#track_id").hide();
        $("startTracking_status").html("Tracking workout: <strong>" + track_id + "</strong>");
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
    tracking_data = [];
    console.log('reset');
    
    //tidy UI
    $("#track_id").val("").show();
    $("#startTracking_status").html("Stopped tracking path <strong>" + track_id + "</strong>");
});
    
    $('#TakePic').on('click', function (event) {
        console.log('say cheese');
    if (inpg == true) {
        getPhoto();
        console.log('photo');
    } else {
        onSuccess('ASSETS/London-Skyline-Montage-24x24--186x138.jpg');
        console.log('sucess');
    }
});
   
}

$(document).on('pagecreate pageshow', '#home', function () {
	
	var watch_id = navigator.geolocation.getCurrentPosition(
            //success
        function (position) {
            //temp variable collecting data in an array
            var cLat = position.coords.latitude;
            var cLong = position.coords.longitude;

            var cord = new google.maps.LatLng(cLat,cLong);

            var options = {
            zoom: 18,
            center: cord,
            mapTypeId: google.maps.MapTypeId.HYBRID
            };
            map = new google.maps.Map(document.getElementById("map"), options);
            var marker = new google.maps.Marker({
            position:cord,
            map: map
            });
        },
        //Error
        function (error) {
            console.log(error);
            alert('Failed because: ' + error);
        },
        //settings
        {
            enableHighAccuracy: true
        });	
});

$(document).on('pagecreate pageshow click', '#startTracking', function () {
    console.log('tracking page');
	
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
        $("#track_info").attr("track_id", $(this).text());
		console.log('click track');
    });
});


$(document).on('pagecreate pageshow', '#track_info', function () {
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
		total_km += gps_distance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i+1].coords.longitude);
	}
	
    var total_km_rounded = total_km.toFixed(2);
    
	// Calculate the total time taken for the track
	var start_time = new Date(data[0].timestamp).getTime();
	var end_time = new Date(data[data.length-1].timestamp).getTime();
	var total_time_ms = end_time - start_time;
	var total_time_s = total_time_ms / 1000;
	var final_time_m = Math.floor(total_time_s / 60);
	var final_time_s = Math.floor(total_time_s % 60);
	
	// Display total distance and time
	$("#track_info_info").html('Travelled <strong>' + total_km_rounded + '</strong> km in <strong>' + final_time_m + 'm</strong> and <strong>' + final_time_s + 's</strong>');
		
	//set initial Lat and Long of google map
	//takes first coords of tracking
	var myLatLng = new google.maps.LatLng(data[0].coords.latitude, data[0].coords.longitude);
	//googleMap options
	var myoptions = {
		zoom: 16,
		center: myLatLng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	//create the google map set options - google maps api	
	map = new google.maps.Map(document.getElementById("map_canvas"), myoptions);
	var trackCoords = [];
	
	//add each GPS entery to an array
	for (i = 0; i< data.length; i++) {
		trackCoords.push(new google.maps.LatLng(data[i].coords.latitude, data[i].coords.longitude));
	}
	
	//plot the GPS entries as a line on the Google Map
	var trackPath = new google.maps.Polyline({
		path: trackCoords,
		//geodesic: true
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	
	//apply line
	trackPath.setMap(map);
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

// A button will call this function
function getPhoto() {
    console.log('say cheese');
	// Retrieve image file location from specified source
	navigator.camera.getPicture(onSuccess, onFail, {
		quality: 80,
//        destinationType: navigator.camera.DestinationType,
//        pictureSource: navigator.camera.PictureSourceType,
//        allowEdit: true,
//        cameraDirection: Camera.Direction.BACK
        targetWidth: 300,
        targetHeight: 400
	});
}

// Called if something bad happens.
function onFail(message) {
	alert('Failed because: ' + message);
}

function onSuccess(imgURI) {
    document.getElementById('photo').src = imgURI;
}