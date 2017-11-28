var city = "";
var attractions = [];
var infoWindow;
var model;

$(function() {
    $("[data-toggle=\"tooltip\"]").tooltip()
})

// KNOCKOUT APP
function CityAttraction(marker, rating, address, icon, isOpenNow, placeId) {
    // var self = this;
    this.name = marker.getTitle();
    // self.location = marker.getPosition();
    this.marker = marker;
    this.rating = rating;
    this.address = address;
    this.icon = icon;
    this.isOpenNow = isOpenNow;
    this.placeId = placeId;
}

// var markerOptions = new google.maps.markerOptions({});

function ViewModel() {
    model = this;
    model.currentCity = ko.observable();
    model.cityAttractions = ko.observableArray([]);
    model.cityList = ["Toronto", "New York", "Miami"];
    model.searchString = ko.observable("");
    model.filteredArray = ko.computed(function() {
        // return "city " + model.searchString();
        return ko.utils.arrayFilter(model.cityAttractions(), function(data) {
            if (data.name.toLowerCase().startsWith(model.searchString())) {
                return true;
            } else {
                return false;
            }
        });
    });
}

// var ViewModel = {
//     currentCity: ko.observable(),
//     cityAttractions: ko.observableArray([]),
//     cityList: ["Toronto", "New York", "Miami"],
//     searchString: ko.observable(),
//     filteredArray: ko.computed(function() {
//         console.log(this.cityAttractions);
//         return ko.utils.arrayFilter(this.cityAttractions, function(data) {
//             searchString = data.name;
//         });
//     }),
//
//     filteredAttractionsList: ko.computed({
//         read: function() {
//             console.log(this.cityAttractions);
//             return "text " + this.cityAttractions;
//         },
//         write: this.cityAttractions
//     })
// };

ko.applyBindings(new ViewModel());

// GOOGLE MAP
var map;

function initMap() {

    infoWindow = new google.maps.InfoWindow();

    var toronto = {
        "lat": 43.653226,
        "lng": -79.3831843
    };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: toronto
    });
}

// Select city from the list in modal
function selectCity(city) {

    model.currentCity(city);
    var request = {
        query: city + "+point+of+interest",
        language: "en"
    }

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, citySearchCallback);
}

// Get attractions from city textSearch and create markers for map
function citySearchCallback(results, status) {

    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // Clear city attractions
        model.cityAttractions([]);
        for (var i = 0; i < results.length; i++) {
            var attraction = results[i];
            // console.log(results[i]);
            createMarkerForAttraction(attraction);
        }
    }
}

function createMarkerForAttraction(attraction) {

    // Create marker on the map
    var marker = new google.maps.Marker({
        position: attraction.geometry.location,
        title: attraction.name,
        animation: google.maps.Animation.DROP,
        map: map
    });

    // Create CityAttraction object based on attraction info
    var cityAttration = new CityAttraction(marker,
        attraction.rating, attraction.formatted_address, attraction.icon,
        (attraction.opening_hours === undefined) ? false : attraction.opening_hours.open_now, attraction.place_id);

    // Add cityAttration to list of attractions
    model.cityAttractions.push(cityAttration);

    // Add click event to the marker
    marker.addListener("click", function() {
        showAttractionDetailsOnTheMap(cityAttration);
    });
}

// Show attraction details in infoWindow on the map
function showAttractionDetailsOnTheMap(cityAttration) {

    // Close any open infoWindow
    infoWindow.close();

    var marker = cityAttration.marker;

    marker.setAnimation(google.maps.Animation.BOUNCE);

    setTimeout((function() {
        marker.setAnimation(null);
    }).bind(marker), 1400);

    map.panTo(marker.getPosition());

    createAndOpenInfoWindow(cityAttration);
}

// Create InfoWindow and open it on the Map
function createAndOpenInfoWindow(attraction) {

    var request = {
        placeId: attraction.placeId
    };

    infoWindow.close();
    infoWindow.setContent("<div class=\"text-muted p-2\">Loading...</div>");
    service = new google.maps.places.PlacesService(map);
    // console.log("Get place details");
    service.getDetails(request, placeDetailsCallback);
    infoWindow.open(map, attraction.marker);
}

function placeDetailsCallback(place, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // console.log(place);

        var TITLE = "<h6 class=\"info-title text-primary\">" + place.name + "</h6>";
        var ADDRESS = "<div class=\"info-address text-secondary\">" + place.formatted_address + "</div>";
        // var OPEN_OR_CLOSED = (attraction.isOpenNow === true) ?
        var OPEN_OR_CLOSED = (place.opening_hours !== undefined && place.opening_hours.open_now == true) ?
            "<div class=\"info-open text-success p-1\">Now Open</div>" : "<div class=\"info-open text-danger p-1\">Now Closed</div>";

        infoWindow.setContent(TITLE + ADDRESS + OPEN_OR_CLOSED);
    }
}
