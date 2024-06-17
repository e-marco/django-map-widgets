(function() {
    class DjangoMapWidgetGenerater {
        constructor(options) {
            Object.assign(this, options);
            document.addEventListener('formset:added', this.handle_added_formset_row.bind(this));
        }

        handle_added_formset_row(e, row, prefix) {
            var mapOptions = this.mapOptions;
            var widgetData = {};

            prefix = prefix || e.target.id.split("-")[0];
            var id_regex = new RegExp("(" + prefix + "-(\\d+|__prefix__))");

            row = row || e.target;
            var row_index = row.id.match(/\d+/g);
            var replacement = prefix + "-" + row_index;
            for (var key in this.widgetDataTemplate) {
                widgetData[key] = this.widgetDataTemplate[key].replace(id_regex, replacement);
            }

            var wrapElemSelector = widgetData.wrapElemSelector;
            var mapElemID = widgetData.mapElemID;
            var googleAutoInputID = widgetData.googleAutoInputID;
            var locationInputID = widgetData.locationInputID;

            var mapWidgetOptions = {
                locationInput: document.querySelector(locationInputID),
                wrapElemSelector: wrapElemSelector,
                locationFieldValue: this.fieldValue,
                mapApiKey: null,
                mapElement: document.getElementById(mapElemID),
                mapCenterLocationName: mapOptions.mapCenterLocationName,
                mapCenterLocation: mapOptions.mapCenterLocation,
                coordinatesOverlayToggleBtn: document.querySelector(".mw-btn-coordinates", wrapElemSelector),
                coordinatesOverlayDoneBtn: document.querySelector(".mw-btn-coordinates-done", wrapElemSelector),
                coordinatesOverlayInputs: document.querySelectorAll(".mw-overlay-input", wrapElemSelector),
                coordinatesOverlay: document.querySelector(".mw-coordinates-overlay", wrapElemSelector),
                myLocationBtn: document.querySelector(".mw-btn-my-location", wrapElemSelector),
                addressAutoCompleteInput: document.getElementById(googleAutoInputID),
                deleteBtn: document.querySelector(".mw-btn-delete", wrapElemSelector),
                addMarkerBtn: document.querySelector(".mw-btn-add-marker", wrapElemSelector),
                loaderOverlayElem: document.querySelector(".mw-loader-overlay", wrapElemSelector),
                zoom: mapOptions.zoom,
                markerFitZoom: mapOptions.markerFitZoom,
                GooglePlaceAutocompleteOptions: mapOptions.GooglePlaceAutocompleteOptions,
                markerCreateTriggerNameSpace: "google_point_map_widget:marker_create",
                markerChangeTriggerNameSpace: "google_point_map_widget:marker_change",
                markerDeleteTriggerNameSpace: "google_point_map_widget:marker_delete",
                placeChangedTriggerNameSpace: "google_point_map_widget:place_changed"
            };
            new DjangoGooglePointFieldWidget(mapWidgetOptions);
        }
    }

    window.DjangoMapWidgetGenerater = DjangoMapWidgetGenerater;
})();
