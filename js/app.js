var map;

function initMap() {

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
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            console.log(results[i]);
            createMarker(results[i]);

        }
    }
}

function createMarker(place) {
    var marker = new google.maps.Marker({
        position: place.geometry.location,
        title: place.name,
        animation: google.maps.Animation.DROP,
        map: map
    });
}

$('.dropdown-menu .dropdown-item').click(function() {
    var city = $(this).attr("value");
    console.log(city);

    var request = {
        query: city + "+point+of+interest",
        language: "en"
    }

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
})
