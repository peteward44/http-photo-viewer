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
	filenameDiv[0].innerHTML = data.imageMeta.path;
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
	$.getJSON( '/next', { next: { index: nextIndex }, previous: { index: photoIndex, rotationChange: rotationChange, deleted: deleted } }, function( data ) {
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


function onKeyPress( evt ) {
	console.log( evt.which );
	$( "#lastkeypress" ).text( evt.which.toString() );
	if ( !modalOn ) {
		// key presses only allowed when a modal dialog is not displayed
		switch ( evt.which ) {
			case 37: // left
				loadNextPhoto( false );
				break;
			case 13: // enter
			case 39: // right
				loadNextPhoto( true );
				break;
			case 40: // down
				rotate( true );
				break;
			case 38: // up
				rotate( false );
				break;
			case 46: // delete
				deletePicture();
				break;
			case 67: // C
				doCommitConfirmation();
				break;
		}
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

