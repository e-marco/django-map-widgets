class DjangoMapboxPointFieldWidget extends DjangoMapWidgetBase {
    init(options) {
        Object.assign(this, options);

        this.coordinatesOverlayToggleBtn.addEventListener("click", this.toggleCoordinatesOverlay.bind(this));
        this.coordinatesOverlayDoneBtn.addEventListener("click", this.handleCoordinatesOverlayDoneBtnClick.bind(this));
        this.coordinatesOverlayInputs.forEach(input => input.addEventListener("change", this.handleCoordinatesInputsChange.bind(this)));
        this.addMarkerBtn.addEventListener("click", this.handleAddMarkerBtnClick.bind(this));
        // this.myLocationBtn.addEventListener("click", this.handleMyLocationBtnClick.bind(this));
        this.deleteBtn.addEventListener("click", this.resetMap.bind(this));

        // if the location field is in a collapse on Django admin form, the map needs to initialize again when the collapse opens by user.
        if (this.wrapElemSelector.closest('.module.collapse')) {
            document.addEventListener('show.fieldset', this.initializeMap.bind(this));
        }

        // set mapbox access_token.
        mapboxgl.accessToken = this.mapOptions.access_token;
        this.mapboxSDK = new mapboxSdk({ accessToken: this.mapOptions.access_token });

        // transform map options
        this.mapboxOptions = this.mapOptions.mapOptions || {};
        this.mapboxOptions.container = this.mapElement.id;

        // transform geocoder options
        this.geocoderOptions = this.mapOptions.geocoderOptions || {};
        this.geocoderOptions.mapboxgl = mapboxgl;
        this.geocoderOptions.accessToken = mapboxgl.accessToken;
        if (!this.geocoderOptions.placeholder) {
            this.geocoderOptions.placeholder = this.geocoderInputPlaceholderText;
        }
        this.geocoder = new MapboxGeocoder(this.geocoderOptions);

        if (this.mapboxOptions.center) {
            this.mapboxOptions.center = [this.mapboxOptions.center[1], this.mapboxOptions.center[0]];
        }
        this.flyToEnabled = this.geocoderOptions.flyTo || false;
        this.geocoder.on('result', (place) => this.handleAutoCompletePlaceChange(place.result));
        this.initializeMap();
    }

    initializeMap() {
        this.map = new mapboxgl.Map(this.mapboxOptions);
        document.getElementById(this.geocoderWrapID).appendChild(this.geocoder.onAdd(this.map));

        if (this.mapOptions.showZoomNavigation) {
            this.map.addControl(new mapboxgl.NavigationControl());
        }
        this.addressAutoCompleteInput = document.querySelector(`#${this.geocoderWrapID} input:first-of-type`);
        this.mapElement.dataset.mapboxMapObj = this.map;
        this.mapElement.dataset.mapboxMapWidgetObj = this;

        if (this.locationFieldValue && Object.keys(this.locationFieldValue).length > 0) {
            this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
            this.fitBoundMarker();
        }
    }

    addMarkerToMap(lat, lng) {
        this.removeMarker();
        this.marker = new mapboxgl.Marker()
            .setLngLat([parseFloat(lng), parseFloat(lat)])
            .setDraggable(true)
            .addTo(this.map);
        this.marker.on("dragend", this.dragMarker.bind(this));
    }

    fitBoundMarker() {
        if (this.marker) {
            if (this.flyToEnabled) {
                this.map.flyTo({
                    center: this.marker.getLngLat(),
                    zoom: this.mapOptions.markerFitZoom || 14
                });
            } else {
                this.map.jumpTo({
                    center: this.marker.getLngLat(),
                    zoom: this.mapOptions.markerFitZoom || 14
                });
            }
        }
    }

    removeMarker() {
        if (this.marker) {
            this.marker.remove();
        }
    }

    dragMarker() {
        const position = this.marker.getLngLat();
        this.updateLocationInput(position.lat, position.lng);
    }

    handleAddMarkerBtnClick() {
        this.mapElement.classList.toggle("click");
        this.addMarkerBtn.classList.toggle("active");
        if (this.addMarkerBtn.classList.contains("active")) {
            this.map.on("click", this.handleMapClick.bind(this));
        } else {
            this.map.off("click", this.handleMapClick.bind(this));
        }
    }

    handleMapClick(e) {
        this.map.off("click", this.handleMapClick.bind(this));
        this.mapElement.classList.remove("click");
        this.addMarkerBtn.classList.remove("active");
        this.updateLocationInput(e.lngLat.lat, e.lngLat.lng);
    }

    callPlaceTriggerHandler(lat, lng, place) {
        if (place === undefined) {
            this.mapboxSDK.geocoding.reverseGeocode({
                query: [parseFloat(lng), parseFloat(lat)]
            }).send().then(response => {
                const address = response?.body?.features?.[0];
                this.geocoder.clear();
                const placeName = address?.place_name || "Unknown Place";
                this.addressAutoCompleteInput.value = placeName;
                document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace, {
                    detail: [address, lat, lng, this.wrapElemSelector, this.locationInput]
                }));
                if (!this.locationFieldValue || Object.keys(this.locationFieldValue).length === 0) {
                    document.dispatchEvent(new CustomEvent(this.markerCreateTriggerNameSpace, {
                        detail: [address, lat, lng, this.wrapElemSelector, this.locationInput]
                    }));
                } else {
                    document.dispatchEvent(new CustomEvent(this.markerChangeTriggerNameSpace, {
                        detail: [address, lat, lng, this.wrapElemSelector, this.locationInput]
                    }));
                }
            });
        } else {  // user entered an address
            document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace, {
                detail: [place, lat, lng, this.wrapElemSelector, this.locationInput]
            }));
        }
    }

    handleAutoCompletePlaceChange(place) {
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            return;
        }
        const [lng, lat] = place.geometry.coordinates;
        this.updateLocationInput(lat, lng, place);
        this.fitBoundMarker();
    }
}

window.DjangoMapboxPointFieldWidget = DjangoMapboxPointFieldWidget;
