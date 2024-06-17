class DjangoMapWidgetBase {
	constructor(options) {
		Object.assign(this, options);
		this.coordinatesOverlayToggleBtn.addEventListener("click", this.toggleCoordinatesOverlay.bind(this));
		this.coordinatesOverlayDoneBtn.addEventListener("click", this.handleCoordinatesOverlayDoneBtnClick.bind(this));
		this.coordinatesOverlayInputs.forEach(input => input.addEventListener("change", this.handleCoordinatesInputsChange.bind(this)));
		this.addMarkerBtn.addEventListener("click", this.handleAddMarkerBtnClick.bind(this));
		//this.myLocationBtn.addEventListener("click", this.handleMyLocationBtnClick.bind(this));
		this.deleteBtn.addEventListener("click", this.resetMap.bind(this));

		// if the location field is in a collapse on Django admin form, the map needs to initialize again when the collapse opens by user.
		if (this.wrapElemSelector.closest('.module.collapse')) {
			document.addEventListener('show.fieldset', this.initializeMap.bind(this));
		}

		const autocomplete = new google.maps.places.Autocomplete(this.addressAutoCompleteInput, this.GooglePlaceAutocompleteOptions);
		google.maps.event.addListener(autocomplete, 'place_changed', this.handleAutoCompletePlaceChange.bind(this, autocomplete));
		// google.maps.event.addDomListener(this.addressAutoCompleteInput, 'keydown', this.handleAutoCompleteInputKeyDown.bind(this));
		// google.maps.event.addDomListener() is deprecated
		this.addressAutoCompleteInput.addEventListener('keydown', this.handleAutoCompleteInputKeyDown.bind(this));
		this.geocoder = new google.maps.Geocoder();
		this.initializeMap();
	}

	initializeMap() {
		console.warn("Implement initializeMap method.");
	}

	updateMap(lat, lng) {
		console.warn("Implement updateMap method.");
	}

	addMarkerToMap(lat, lng) {
		console.warn("Implement this method for your map js library.");
	}

	fitBoundMarker() {
		console.warn("Implement this method for your map js library.");
	}

	removeMarker() {
		console.warn("Implement this method for your map js library.");
	}

	dragMarker(e) {
		console.warn("Implement dragMarker method.");
	}

	handleMapClick(e) {
		console.warn("Implement handleMapClick method.");
	}

	handleAddMarkerBtnClick(e) {
		console.warn("Implement handleAddMarkerBtnClick method.");
	}

	isInt(value) {
		return !isNaN(value) &&
			parseInt(Number(value)) === value &&
			!isNaN(parseInt(value, 10));
	}

	getLocationValues() {
		const latlng = this.locationInput.value.split(' ');
		const lat = latlng[2].replace(/[\(\)]/g, '');
		const lng = latlng[1].replace(/[\(\)]/g, '');
		return {
			"lat": lat,
			"lng": lng
		};
	}

	callPlaceTriggerHandler(lat, lng, place) {
		if (place === undefined) {
			const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
			this.geocoder.geocode({ 'location': latlng }, (results, status) => {
				if (status === google.maps.GeocoderStatus.OK) {
					const placeObj = results[0] || {};
					this.addressAutoCompleteInput.value = placeObj.formatted_address || "";
					document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace, {
						detail: [placeObj, lat, lng, this.wrapElemSelector, this.locationInput]
					}));
					if (!this.locationFieldValue || Object.keys(this.locationFieldValue).length === 0) {
						document.dispatchEvent(new CustomEvent(this.markerCreateTriggerNameSpace, {
							detail: [placeObj, lat, lng, this.wrapElemSelector, this.locationInput]
						}));
					} else {
						document.dispatchEvent(new CustomEvent(this.markerChangeTriggerNameSpace, {
							detail: [placeObj, lat, lng, this.wrapElemSelector, this.locationInput]
						}));
					}
				}
			});
		} else {  // user entered an address
			document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace, {
				detail: [place, lat, lng, this.wrapElemSelector, this.locationInput]
			}));
		}
	}

	updateLocationInput(lat, lng, place) {
		const location_input_val = "POINT (" + lng + " " + lat + ")";
		this.locationInput.value = location_input_val;
		this.updateCoordinatesInputs(lat, lng);
		this.addMarkerToMap(lat, lng);
		this.callPlaceTriggerHandler(lat, lng, place);
		this.locationFieldValue = {
			"lng": lng,
			"lat": lat
		};
		this.deleteBtn.classList.remove("mw-btn-default", "disabled");
		this.deleteBtn.classList.add("mw-btn-danger");
	}

	resetMap() {
		if (this.locationFieldValue && Object.keys(this.locationFieldValue).length > 0) {
			this.hideOverlay();
			this.locationInput.value = "";
			this.coordinatesOverlayInputs.value = "";
			this.addressAutoCompleteInput.value = "";
			this.addMarkerBtn.classList.remove("active");
			this.removeMarker();
			this.deleteBtn.classList.remove("mw-btn-danger");
			this.deleteBtn.classList.add("mw-btn-default", "disabled");
			document.dispatchEvent(new CustomEvent(this.markerDeleteTriggerNameSpace, {
				detail: [this.locationFieldValue.lat, this.locationFieldValue.lng, this.wrapElemSelector, this.locationInput]
			}));
			this.locationFieldValue = null;
		}
	}

	toggleCoordinatesOverlay() {
		this.coordinatesOverlayToggleBtn.classList.toggle("active");
		this.wrapElemSelector.querySelector(".mw-coordinates-overlay").classList.toggle("hide");
	}

	updateCoordinatesInputs(lat, lng) {
		this.wrapElemSelector.querySelector(".mw-overlay-latitude").value = Number(lat).toFixed(5) || "";
		this.wrapElemSelector.querySelector(".mw-overlay-longitude").value = Number(lng).toFixed(5) || "";
	}

	handleCoordinatesInputsChange(e) {
		const lat = this.wrapElemSelector.querySelector(".mw-overlay-latitude").value;
		const lng = this.wrapElemSelector.querySelector(".mw-overlay-longitude").value;
		if (lat && lng) {
			this.updateLocationInput(lat, lng);
			this.fitBoundMarker();
		}
	}

	handleCoordinatesOverlayDoneBtnClick() {
		this.wrapElemSelector.querySelector(".mw-coordinates-overlay").classList.add("hide");
		this.coordinatesOverlayToggleBtn.classList.remove("active");
	}

	handleCurrentPosition(location) {
		this.updateLocationInput(location.coords.latitude, location.coords.longitude);
		this.hideOverlay();
		this.fitBoundMarker();
	}

	handlecurrentPositionError() {
		this.hideOverlay();
		alert("Your location could not be found.");
	}

	handleAutoCompleteInputKeyDown(e) {
		const keyCode = e.keyCode || e.which;
		if (keyCode === 13) {  // pressed enter key
			e.preventDefault();
			return false;
		}
	}

	handleAutoCompletePlaceChange(autocomplete) {
		const place = autocomplete.getPlace();
		if (!place.geometry) {
			// User entered the name of a Place that was not suggested and
			// pressed the Enter key, or the Place Details request failed.
			return;
		}
		const lat = place.geometry.location.lat();
		const lng = place.geometry.location.lng();
		this.updateLocationInput(lat, lng, place);
		this.fitBoundMarker();
	}

	showOverlay() {
		this.loaderOverlayElem.classList.remove("hide");
	}

	hideOverlay() {
		this.loaderOverlayElem.classList.add("hide");
	}
}
