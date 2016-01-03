'use strict';

var viewport = $( "#viewport" );
var viewimg = $( "#canvas" );
var filenameDiv = $( "#filename" );
var canvas = viewimg[0];
var photoIndex = 0;
var rotation = 0;
var rotationChange = 0;
var photoImg = new Image();
var flipHorz = false;
var flipVert = false;
var modalOn = false;
var allGroupNames = [];
var groupName = '';
var selectedGroupId = '';


function render() {
	while ( rotation < 0 ) {
		rotation += 4;
	}
	rotation %= 4;
	var sideways = ( rotation % 2 ) === 1;
	var ctx = canvas.getContext("2d");
	ctx.clearRect( 0, 0, canvas.width, canvas.height );
	canvas.height = sideways ? photoImg.width : photoImg.height;
	canvas.width = sideways ? photoImg.height : photoImg.width;
	ctx = canvas.getContext("2d");	
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	if ( flipHorz || flipVert ) {
		ctx.scale( flipHorz ? -1 : 1, flipVert ? -1 : 1 );
	}
	ctx.rotate( rotation * ( Math.PI / 2 ) );
	ctx.drawImage(photoImg, -photoImg.width/2, -photoImg.height/2);
	ctx.restore();
	viewimg.show();
	setBodyHeight();
}


function setPhotoData( data ) {
	photoImg.onload = function() {
		rotation = data.imageMeta.rotation;
		rotationChange = 0;
		groupName = data.imageMeta.group || '';
		selectedGroupId = '';
		onGroupChanged();
		flipHorz = false;
		flipVert = false;
		switch ( data.image.orientation ) {
			case 2:
				flipHorz = true;
				break;
			case 3: // upside down
				rotation += 2;
				break;
			case 4:
				rotation += 2;
				flipHorz = true;
				break;
			case 5:
				rotation += 3;  // 90* anticlockwise
				flipVert = true;
				break;
			case 6:
				rotation += 3;
				break;
			case 7:
				rotation += 1; // 90* clockwise - needs to be rotated 270* to correct
				flipVert = true;
				break;
			case 8:
				rotation += 1;
				break;
		}
		render();
		hideLoadingDialog();
	};
	photoImg.src = data.image.src;
}


function setFilename( data ) {
	filenameDiv[0].innerHTML = data.imageMeta.path.substr( data.rootPath.length + 1 );
}


function showLoadingDialog() {
	$( "#dialog-loading" ).dialog( {
		closeOnEscape: false,
		height: 95,
		close: function( event, ui ) {
			modalOn = false;
		},
		open: function(event, ui) {
			modalOn = true;
			$(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
			$( "#progressbar" ).progressbar({
				value: false
			});
		}
	} );
}


function hideLoadingDialog() {
	$( "#dialog-loading" ).dialog( "close" );
}


function loadNextPhoto( next, deleted ) {
	var previousPhotoData;
	var nextIndex = 0;
	if ( next !== undefined ) {
		nextIndex = photoIndex + ( next ? 1 : -1 );
	}
	$.getJSON( '/next', { next: { index: nextIndex }, previous: { index: photoIndex, rotationChange: rotationChange, deleted: deleted, group: groupName } }, function( data ) {
		setPhotoData( data );
		setFilename( data );
		photoIndex = nextIndex;
	} );
	showLoadingDialog();
}


function setBodyHeight() { // set body height = window height
	// set size of viewport div
	viewport.height($(window).height());
	var canvasAr = canvas.width / canvas.height;
	var windowAr = viewport.innerWidth() / viewport.innerHeight();
	// set aspect ratio of canvas
	if ( canvasAr > windowAr ) {
		canvas.style.width = viewport.innerWidth() + 'px';
		canvas.style.height = Math.floor( viewport.innerWidth() * canvasAr ) + 'px';
	} else {
		canvas.style.height = viewport.innerHeight() + 'px';
		canvas.style.width = Math.floor( viewport.innerHeight() * canvasAr ) + 'px';
	}
}


function inc( base, diff ) {
	base += diff;
	if ( base > 3 ) {
		base = 0;
	}
	if ( base < 0 ) {
		base = 3;
	}
	return base;
}


function rotate( clockwise ) {
	var diff = clockwise ? 1 : -1;
	rotation = inc( rotation, diff );
	rotationChange = inc( rotationChange, diff );
	render();
}


function deletePicture() {
	modalOn = true;
	$( "#dialog-confirm" ).dialog({
		resizable: false,
		height: 200,
		modal: true,
		close: function( event, ui ) {
			modalOn = false;
		},
		buttons: {
			"Delete picture": function() {
				loadNextPhoto( true, true );
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
}


function doCommit() {
	showLoadingDialog();
	$.getJSON( '/commit', {}, function() {
		hideLoadingDialog();
	} );
}


function doCommitConfirmation() {
	modalOn = true;
	$( "#dialog-confirm-commit" ).dialog({
		resizable: false,
		height: 200,
		modal: true,
		close: function( event, ui ) {
			modalOn = false;
		},
		buttons: {
			"Commit": function() {
				doCommit();
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
}


function selectSelectableElement( selectableContainer, elementsToSelect ) {
	$(".ui-selected", selectableContainer).not(elementsToSelect).removeClass("ui-selected");
	$(elementsToSelect).addClass("ui-selected");
	selectableContainer.selectable( "refresh" );
}


function addGroupButton( id, text ) {
	return '<input type="checkbox" id="' + id + '" name="dialog-group-select-button" class="dialog-group-select-class"><label for="' + id + '" class="dialog-group-select-text-class">' + text + '</label><br/>';
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


function doGroupDialog() {
	modalOn = true;
	
	var select = $( "#dialog-group-select" );
	var html = '';
	// add each group name, along with a 'new' and 'remove' option
	for ( var i=0; i<allGroupNames.length; ++i ) {
		var g = allGroupNames[i];
		var name = i.toString();
		html += addGroupButton( name, g );
	}
	
	html += addGroupButton( 'new', 'New Group...' );
	html += addGroupButton( 'remove', 'Remove' );
	
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
		close: function( event, ui ) {
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


function onKeyPress( evt ) {
	console.log( evt.which );
	//$( "#lastkeypress" ).text( evt.which.toString() );
	var pressed = false;
	if ( !modalOn ) {
		// key presses only allowed when a modal dialog is not displayed
		switch ( evt.which ) {
			case 37: // left
				loadNextPhoto( false );
				pressed = true;
				break;
			case 13: // enter
			case 39: // right
				loadNextPhoto( true );
				pressed = true;
				break;
			case 40: // down
				rotate( true );
				pressed = true;
				break;
			case 38: // up
				rotate( false );
				pressed = true;
				break;
			case 46: // delete
				deletePicture();
				pressed = true;
				break;
			case 67: // C
			case 116: // L1
				doCommitConfirmation();
				pressed = true;
				break;
			case 117: // L2
			case 32: // space
				doGroupDialog();
				pressed = true;
				break;
		}
	}
	if ( pressed ) {
		evt.preventDefault();
	}
	return true;
}


window.onload = function() {
	var win = $(window);
	win.bind('resize', setBodyHeight);
	win.keydown( onKeyPress );
	loadNextPhoto();
	setBodyHeight();
};

