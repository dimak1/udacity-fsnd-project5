function initMap() {
    var toronto = {
        lat: 43.653226,
        lng: -79.383184
    };
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: toronto
    });
    var marker = new google.maps.Marker({
        position: toronto,
        map: map
    });
}
