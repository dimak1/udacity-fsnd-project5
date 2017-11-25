var city = "";
var attractions = [];
var infoWindow;

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})

// KNOCKOUT APP
function CityAttraction(marker, rating, address, icon) {
    // var self = this;
    this.name = marker.getTitle();
    // self.location = marker.getPosition();
    this.marker = marker;
    this.rating = rating;
    this.address = address;
    this.icon = icon;
}

var ViewModel = {
    currentCity: ko.observable(),
    cityAttractions: ko.observableArray([]),
    cityList: ["Toronto", "New York", "Miami"]
};

ko.applyBindings(ViewModel)

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
    var marker = new google.maps.Marker({
        position: toronto,
        map: map
    });
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        ViewModel.cityAttractions([]);
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            // console.log(results[i]);
            createMarker(results[i]);
            // var a = new CityAttraction(results[i].name);
        }
    }
}

function createMarker(place) {

    // console.log(place);

    var marker = new google.maps.Marker({
        position: place.geometry.location,
        title: place.name,
        animation: google.maps.Animation.DROP,
        map: map
    });

    var cityAttration = new CityAttraction(marker,
        place.rating, place.formatted_address, place.icon);

    ViewModel.cityAttractions.push(cityAttration);
}

function selectCity(city) {

    $('.collapse').collapse("hide");
    ViewModel.currentCity(city);
    var request = {
        query: city + "+point+of+interest",
        language: "en"
    }

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
}

function showAttractionDetails() {

    $('.collapse').collapse("hide");

    infoWindow.close();
    var self = this.marker;
    // var location = this.location;
    self.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout((function() {
        self.setAnimation(null);
    }).bind(self), 1400);
    map.panTo(self.getPosition());

    infoWindow.setContent(self.getTitle() + "<br/>" + this.address);
    infoWindow.open(map, self);
}
