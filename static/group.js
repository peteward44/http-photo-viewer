'use strict';

var allGroupNames = [];
var groupName = '';
var selectedGroupId = '';


function addGroupButton( index, id, text ) {
	return '<input type="checkbox" id="' + id + '" name="dialog-group-select-button" class="dialog-group-select-class"><label tabindex="' + index + '" for="' + id + '" class="dialog-group-select-text-class">' + text + '</label><br/>';
}


function onGroupChanged() {
	$( "#lastkeypress" ).text( groupName || '' );
}


function showNewGroupNameDialog() {
	$( "#dialog-new-group-name" ).dialog( {
		resizable: true,
		height: 200,
		modal: true,
		close: function( event, ui ) {
			modalOn = false;
		},
		open: function( event, ui ) {
			setTimeout( function() { $( "#dialog-new-group-name-text" ).focus(); }, 10 );
		},
		buttons: {
			Close: function() {
				var text = $( "#dialog-new-group-name-text" ).val();
				// TODO: check name doesn't already exist / is valid
				groupName = text.trim();
				if ( groupName.length > 0 ) {
					allGroupNames.push( groupName );
				}
				onGroupChanged();
				$( this ).dialog( "close" );
			}
		}
	} );
}


function onGroupKeyPress( evt ) {
	var pressed = false;
	if ( !modalOn ) {
		// key presses only allowed when a modal dialog is not displayed
		switch ( evt.which ) {
			case 40: // down
				pressed = true;
				break;
			case 38: // up
				pressed = true;
				break;
		}
	}
	if ( pressed ) {
//		evt.preventDefault();
	}
	return true;
}


function doGroupDialog() {
	modalOn = true;
	
	var select = $( "#dialog-group-select" );
	var html = '';
	// add each group name, along with a 'new' and 'remove' option
	for ( var i=0; i<allGroupNames.length; ++i ) {
		var g = allGroupNames[i];
		var name = i.toString();
		html += addGroupButton( i, name, g );
	}
	
	html += addGroupButton( i++, 'new', 'New Group...' );
	html += addGroupButton( i++, 'remove', 'Remove' );
	
	select[0].innerHTML = html;
		
	$( "#dialog-group-select" ).buttonset();
	
	$( ".dialog-group-select-class" ).change( function( evt ) {
		var id = evt.target.id;
		if ( evt.target.value === "on" ) {
			// uncheck the other checkboxes
			$(".dialog-group-select-class").not( $( evt.target ) ).attr("checked", false).button( "refresh" );
			selectedGroupId = id;
		}
	});

	// if ( allGroupNames.length > 0 ) {
		// selectSelectableElement( select, $('#dialog-group-select li:first') );
	// }
	
	var triggeredNewDialog = false;
	
	$( "#dialog-group" ).dialog({
		resizable: true,
		height: 200,
		modal: true,
		open: function( event, ui ) {
			$(window).on( 'keyDown', onGroupKeyPress );
		},
		close: function( event, ui ) {
			$(window).off( 'keyDown', onGroupKeyPress );
			if ( !triggeredNewDialog ) {
				modalOn = false;
			}
		},
		buttons: {
			"Assign": function() {
				switch ( selectedGroupId ) {
					case 'new':
						triggeredNewDialog = true;
						showNewGroupNameDialog();
					break;
					case 'remove':
						groupName = '';
						onGroupChanged();
					break;
					default:
						groupName = allGroupNames[ parseInt( selectedGroupId, 10 ) ];
						onGroupChanged();
					break;
				}
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});	
}

