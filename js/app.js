require([ "text", "jquery", "underscore",
          "jquery-ui",
          "text!../template/flight-list.html" ],
	function( text, $, _, ui,
        flightListTemplate ) {

	var fromAirport = $( "#from-airport" ),
		toAirport = $( "#to-airport" ),
		date = $( "#date" ),
		processingDialog = $( "<div>" ).dialog({
			autoOpen: false,
			modal: true,
			title: "Searching for available flights..."
		}),
		progressbar = $( "<div>" ).progressbar({ value: false });

	function init() {
		processingDialog.append( progressbar );
		$( "#search" ).button();

		if ( !isTypeSupported( "date" ) ) {
			date.datepicker({ dateFormat: "yy-mm-dd" });
		}

		lookupAirports().then(function( data ) {
			fromAirport.add( toAirport )
				.autocomplete({
					source: data.airports,
					minLength: 2
				});
		});

		setupValidation();
		setupEvents();
	};

	function isTypeSupported( type ) {
		var input = document.createElement( "input" );
		input.setAttribute( "type", type );
		return input.type === type;
	};

	function lookupAirports() {
		return $.getJSON( "json/airports.json" );
	};

	function searchFlights() {
		console.log('Inside lookup flights');
		var base_url = "https://google-flights-search.p.rapidapi.com/search"
        var from = "?departure_airport_code=" + $('#from-airport').val();
        var to = "&arrival_airport_code=" + $('#to-airport').val()
        var depart_date = "&departure_date=" + $('#date').val()
        url = base_url + from + to + depart_date
        // console.log(url);
		const settings = {
			"async": true,
			"crossDomain": true,
			"url": url,
			"method": "GET",
			"headers": {
                "x-rapidapi-key": "6a8489a615msh780044398d27559p186972jsn7d0ac6021974",
                "x-rapidapi-host": "google-flights-search.p.rapidapi.com"
            }
		};
		
		return $.ajax(settings);
	};

	function parseFlights( data ) {
		console.log('inside parse flights');
		var flights = []
		var resp = JSON.parse(data);
		Object.entries(resp.flights).forEach(
			(entry) => {
			const [key, value] = entry;
			console.log(entry);
			flight = {
				from: entry[1].departure_airport_code,
				to: entry[1].arrival_airport_code,
				departureDate: entry[1].departure_date,
				departureTime: entry[1].departure_time,
				arrivalDate: entry[1].arrival_date,
				arrivalTime: entry[1].arrival_time,
				duration: entry[1].trip_duration
			};
			console.log(flight);
			flights.push( flight );
		});
		return flights;
	};

	function flightsTemplate( flights ) {
		var html = _.template( flightListTemplate, { flights: flights });
		$( "#flights-container" ).html( html );
	};

	function setupValidation() {
		date.on( "change", function() {
			var value;
			try {
				value = $.datepicker.parseDate( "yy-mm-dd", date.val() );
			} catch ( error ) { }
			if ( value ) {
				date[ 0 ].setCustomValidity( "" );
			} else {
				date[ 0 ].setCustomValidity( "Please provide a valid date." );
			}
		});
	};

	function validateForm() {
		var invalidFields,
			form = $( "form" );

		form.find( ".ui-state-error-text" )
			.removeClass( "ui-state-error-text" )
		form.find( "[aria-invalid]" ).attr( "aria-invalid", false )
		form.find( ":ui-tooltip" ).tooltip( "destroy" );

		invalidFields = form.find( ":invalid" ).each(function() {
			form.find( "label[for=" + this.id + "]" )
				.addClass( "ui-state-error-text" )
			$( this ).attr( "aria-invalid", true )
				.attr( "title", this.validationMessage )
				.tooltip({ tooltipClass: "ui-state-error" });
		}).first().focus();

		return invalidFields.length === 0;
	};

	function setupEvents() {
		$( "form" ).on( "submit", function( event ) {
			event.preventDefault();
			event.stopImmediatePropagation();
			if ( validateForm() ) {
				processingDialog.dialog( "open" );
				searchFlights().then(
					function( data ) {
						var flights = parseFlights( data );
						flightsTemplate( flights );
						processingDialog.dialog( "close" );
				});
			}
		});
	};

	init();
});