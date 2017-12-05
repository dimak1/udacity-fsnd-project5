// Full Stack Nanodegree Program - Udacity
// Project 5 - Neighborhood Map
// Author - Dima K
// Date - Dec 2017

var infoWindow;
var model;
var markers = [];
var map;

var FB_ACCESS_TOKEN = "1486474141471469%7CCzrnnI77lBmR9Y9s2-LEgHOQ_g4";

// City Attraction class
function CityAttraction(marker, rating, address, icon, isOpenNow, placeId) {

    this.name = marker.getTitle();
    this.marker = marker;
    this.rating = rating;
    this.address = address;
    this.icon = icon;
    this.isOpenNow = isOpenNow;
    this.placeId = placeId;
    this.phone = "";

    // data to be populated from Facebook Graph API
    this.desc = "";
    this.checkinsCount = "n/a";
    this.priceRange = "";
}

// knockout View Model with observables
function ViewModel() {
    model = this;
    model.currentAttraction = ko.observable();
    model.currentCity = ko.observable();
    model.cityAttractions = ko.observableArray([]);
    model.cityList = ["Toronto", "New York", "Miami", "San Francisco"];
    model.searchString = ko.observable("");
    model.filteredAttractionList = ko.computed(function() {
        return ko.utils.arrayFilter(model.cityAttractions(), function(data) {
            if (data.name.toLowerCase().startsWith(model.searchString().toLowerCase())) {
                data.marker.setVisible(true);
                return true;
            } else {
                data.marker.setVisible(false);
                return false;
            }
        });
    });
    model.attractionPhotos = ko.observableArray([]);
    model.attractionReviews = ko.observableArray([]);
    model.attractionDesc = ko.observable();
    model.errorMessage = ko.observable();
}

ko.applyBindings(new ViewModel());

// Call this method when Google Map Api is loaded
function initMap() {
    infoWindow = new google.maps.InfoWindow();

    // Clear search and display markers when closing infoWindow
    google.maps.event.addListener(infoWindow, "closeclick", function() {
        clearSearchAndShowMarkers();
    });

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13
    });

    // Clear search and display markers clicking anywhere on the map
    map.addListener('click', function() {
        clearSearchAndShowMarkers();
    });

    // Load initial city for the map
    selectCity(model.cityList[0]);
}

// Delete all markers from the map
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function clearSearchAndShowMarkers() {
    model.searchString("");
    for (var i = 0; i < markers.length; i++) {
        markers[i].setVisible(true);
    }
}

// Select city from the list in modal
function selectCity(city) {

    clearMarkers();
    model.currentCity(city);
    var geocoder = new google.maps.Geocoder();

    // Get coordinated for the city
    geocoder.geocode({
        'address': city
    }, function(results, status) {
        if (status === 'OK') {
            map.setCenter(results[0].geometry.location);

            var request = {
                query: city + "+point+of+interest"
            }

            try {
                // Seatch all attractions (point of interest) for the city
                service = new google.maps.places.PlacesService(map);
                service.textSearch(request, citySearchCallback);
            } catch (error) {
                showErrorMessage("Error retriveing " + model.currentCity() + " attractions. Check if Google Places Service is enabled.", error.message)
            }

        } else {
            showErrorMessage('Geocode was not successful.', status);
        }
    });
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
    } else {
        showErrorMessage("Error retriveing " + model.currentCity() + " attractions.", status);
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

    markers.push(marker);

    // Add click event to the marker
    marker.addListener("click", function() {
        showAttractionDetailsOnTheMap(cityAttration);
    });
}

// Show attraction details in infoWindow on the map
function showAttractionDetailsOnTheMap(cityAttration) {

    model.currentAttraction(cityAttration);

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

    try {
        infoWindow.close();
        // Set Loading indicator for inforWindow
        infoWindow.setContent("<div class=\"text-muted p-2\">Loading...</div>");
        infoWindow.open(map, attraction.marker);
        service = new google.maps.places.PlacesService(map);
        // Get details about place
        service.getDetails(request, placeDetailsCallback);

    } catch (error) {
        showErrorMessage("Error retriveing " + attraction.name + " details.", error.message);
    }
}

// Get place details and add them to infoWindow
function placeDetailsCallback(place, status) {

    if (status == google.maps.places.PlacesServiceStatus.OK) {

        var attraction = model.currentAttraction();
        attraction.phone = place.formatted_phone_number;

        var lat = attraction.marker.position.lat();
        var lng = attraction.marker.position.lng()

        // Call Facebook API to get additional info about Attraction
        $.getJSON("https://graph.facebook.com/v2.11/search?access_token=" + FB_ACCESS_TOKEN + "&type=place&center=" +
                lat + "," + lng + "&fields=name,price_range,checkins,description",
                function(result) {
                    $.each(result.data, function(index, place) {
                        if (place.name.indexOf(attraction.name) >= 0) {
                            attraction.desc = place.description || "No info available.";
                            // Add desctiption to the model to be available in modal
                            model.attractionDesc(attraction.desc);
                            attraction.checkinsCount = place.checkins;
                            attraction.priceRange = place.price_range || "";
                            return false;
                        }
                    });
                })
            .done(function() {
                infoWindow.setContent(createInfoWindowContent(attraction));
            }).fail(function(error) {
                showErrorMessage("Error getting information from Facebook.", error);
            });

        // Clear attraction photos and reviews
        model.attractionPhotos([]);
        model.attractionReviews([]);

        // Populate attractionPhotos
        for (var i = 0; i < place.photos.length; i++) {
            var placePhoto = place.photos[i];
            var url = placePhoto.getUrl({
                maxWidth: 600,
                maxHeight: 400
            });
            model.attractionPhotos.push(url);
        }

        // Populate attractionReviews
        for (var i = 0; i < place.reviews.length; i++) {
            var review = place.reviews[i];
            model.attractionReviews.push(review);
        }
    } else {
        showErrorMessage("Error retriveing " + place.name + " details.", status);
    }
}

// Create content for InfoWindow
function createInfoWindowContent(attraction) {

    var TITLE = "<span class=\"h6 info-title text-primary\">" + attraction.name + "</span><span class=\"px-2\">" + attraction.rating + "</span><span>" + attraction.priceRange + "</span>";
    var DESC = "<div class=\"info-address text-secondary\">" + attraction.desc + "</div>";
    var ADDRESS = "<div class=\"info-address text-secondary py-1\">" + attraction.address + "</div>";
    var OPEN_OR_CLOSED = (attraction.isOpenNow == true) ?
        "<span class=\"info-open text-success p-1 px-2\"><i class=\"fa fa-clock-o pr-1\" aria-hidden=\"true\"></i>Now Open</span>" : "<span class=\"info-open text-danger p-1 px-2\"><i class=\"fa fa-clock-o pr-1\" aria-hidden=\"true\"></i>Now Closed</span>";
    var CHECKINS = "<span class=\"text-info\"><i class=\"fa fa-facebook pr-1\" aria-hidden=\"true\"></i>Check-ins: " + attraction.checkinsCount + "</span>";
    var PHONE = "<div class=\"text-dark py-1\"><i class=\"fa fa-phone pr-1\" aria-hidden=\"true\"></i>" + attraction.phone + "</div>";
    var VIEW_PHOTOS_BTN = "<button class=\"btn btn-link text-success p-1\" type=\"button\" data-toggle=\"modal\" data-target=\"#attractionPhotosModal\">Photos</button>";
    var READ_REVIEWS_BTN = "<button class=\"btn btn-link text-success p-1\" type=\"button\" data-toggle=\"modal\" data-target=\"#attractionReviewsModal\">Info & Reviews</button>";

    return TITLE + ADDRESS + OPEN_OR_CLOSED + CHECKINS + PHONE + READ_REVIEWS_BTN + VIEW_PHOTOS_BTN;
}

// Hide any visible modals and display error message via modal
function showErrorMessage(errorMessage, status) {
    // Check for infoWindow in case error before it was defined (e.g. during map api load)
    if (infoWindow != undefined) {
        infoWindow.close();
    }
    var msg = errorMessage + "<br/><br/><div class=\"text-muted small\">" + status + "</div>";
    model.errorMessage(msg);
    $('#errorModal').modal('show');
}

// Google Maps error
function gm_authFailure() {
    showErrorMessage("Error loading Google Maps.", "Check Google Maps API url and/or access key");
}
