class DjangoGooglePointFieldWidget extends DjangoMapWidgetBase {
    initializeMap() {
        let mapCenter = this.mapCenterLocation;
        if (this.mapCenterLocationName) {
            this.geocoder.geocode({ 'address': this.mapCenterLocationName }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    var geo_location = results[0].geometry.location;
                    mapCenter = [geo_location.lat(), geo_location.lng()];
                }
                this.map = new google.maps.Map(this.mapElement, {
                    center: new google.maps.LatLng(mapCenter[0], mapCenter[1]),
                    scrollwheel: this.scrollWheel,
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.RIGHT
                    },
                    zoom: this.zoom,
                    streetViewControl: this.streetViewControl
                });

                if (this.locationFieldValue && Object.keys(this.locationFieldValue).length > 0) {
                    this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
                    this.fitBoundMarker();
                }
            });
        } else {
            this.map = new google.maps.Map(this.mapElement, {
                center: new google.maps.LatLng(mapCenter[0], mapCenter[1]),
                scrollwheel: this.scrollWheel,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT
                },
                zoom: this.zoom,
                streetViewControl: this.streetViewControl
            });

            if (this.locationFieldValue && Object.keys(this.locationFieldValue).length > 0) {
                this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
                this.fitBoundMarker();
            }
        }
        this.mapElement.dataset.googleMapObj = this.map;
        this.mapElement.dataset.googleMapWidgetObj = this;
    }

    addMarkerToMap(lat, lng) {
        this.removeMarker();
        var marker_position = { lat: parseFloat(lat), lng: parseFloat(lng) };
        this.marker = new google.maps.Marker({
            position: marker_position,
            map: this.map,
            draggable: true
        });
        this.marker.addListener("dragend", this.dragMarker.bind(this));
    }

    fitBoundMarker() {
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(this.marker.getPosition());
        this.map.fitBounds(bounds);
        if (this.markerFitZoom && this.isInt(this.markerFitZoom)) {
            var markerFitZoom = parseInt(this.markerFitZoom);
            var listener = google.maps.event.addListener(this.map, "idle", function () {
                if (this.getZoom() > markerFitZoom) {
                    this.setZoom(markerFitZoom);
                }
                google.maps.event.removeListener(listener);
            });
        }
    }

    removeMarker() {
        if (this.marker) {
            this.marker.setMap(null);
        }
    }

    dragMarker(e) {
        this.updateLocationInput(e.latLng.lat(), e.latLng.lng());
    }

    handleAddMarkerBtnClick() {
        this.mapElement.classList.toggle("click");
        this.addMarkerBtn.classList.toggle("active");
        if (this.addMarkerBtn.classList.contains("active")) {
            this.map.addListener("click", this.handleMapClick.bind(this));
        } else {
            google.maps.event.clearListeners(this.map, 'click');
        }
    }

    handleMapClick(e) {
        google.maps.event.clearListeners(this.map, 'click');
        this.mapElement.classList.remove("click");
        this.addMarkerBtn.classList.remove("active");
        this.updateLocationInput(e.latLng.lat(), e.latLng.lng());
    }
}

window.DjangoGooglePointFieldWidget = DjangoGooglePointFieldWidget;
