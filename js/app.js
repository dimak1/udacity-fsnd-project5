var city = "";
var attractions = [];
var infoWindow;
var model;

$(function() {
    $("[data-toggle=\"tooltip\"]").tooltip()
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

function filteredAttrations() {
    return "something";
}

function ViewModel() {
    model = this;
    model.currentCity = ko.observable();
    model.cityAttractions = ko.observableArray([]);
    model.cityList = ["Toronto", "New York", "Miami"];
    model.searchString = ko.observable();
    model.filteredArray = ko.computed(function() {
        console.log(model.currentCity);
        // return "city " + model.searchString();
        return ko.utils.arrayFilter(model.cityAttractions(), function(data) {
            data.name.toLowerCase().startsWith(model.searchString());
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
    var marker = new google.maps.Marker({
        position: toronto,
        map: map
    });
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // ViewModel.cityAttractions([]);
        model.cityAttractions([]);
        for (var i = 0; i < results.length; i++) {
            var attraction = results[i];
            // console.log(results[i]);
            createMarkerForAttraction(attraction);
            // var a = new CityAttraction(results[i].name);
        }
    }
}

function createMarkerForAttraction(attraction) {

    // console.log(place);

    var marker = new google.maps.Marker({
        position: attraction.geometry.location,
        title: attraction.name,
        animation: google.maps.Animation.DROP,
        map: map
    });

    var cityAttration = new CityAttraction(marker,
        attraction.rating, attraction.formatted_address, attraction.icon);

    model.cityAttractions.push(cityAttration);
    // ViewModel.cityAttractions.push(cityAttration);
}

function selectCity(city) {

    // ViewModel.currentCity(city);
    model.currentCity(city);
    var request = {
        query: city + "+point+of+interest",
        language: "en"
    }

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
}

function showAttractionDetailsOnTheMap() {

    // $('.collapse').collapse("hide");

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
