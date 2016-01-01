'use strict';


// https://beradrian.wordpress.com/2008/11/14/rotate-exif-images/
export function rotate( originalOrientation, rotation ) {
	switch ( originalOrientation ) {
		default:
		case 1: // straight
			switch ( rotation ) {
				default:
				case 0:
					return 0;
				case 1:
					return 8;
				case 2:
					return 3;
				case 3:
					return 6;
			}
			break;
		case 2: // straight but flipped horizontally
			switch ( rotation ) {
				default:
				case 0:
					return 2;
				case 1:
					return 7;
				case 2:
					return 4;
				case 3:
					return 5;
			}
			break;
		case 3: // upside down
			switch ( rotation ) {
				default:
				case 0:
					return 3;
				case 1:
					return 6;
				case 2:
					return 1;
				case 3:
					return 8;
			}
			break;
		case 4: // upside down and flipped horizontally
			switch ( rotation ) {
				default:
				case 0:
					return 4;
				case 1:
					return 5;
				case 2:
					return 2;
				case 3:
					return 7;
			}
			break;
		case 5: // 90* anticlockwise flipped
			switch ( rotation ) {
				default:
				case 0:
					return 5;
				case 1:
					return 2;
				case 2:
					return 7;
				case 3:
					return 4;
			}
			break;
		case 6: // 90* anticlockwise
			switch ( rotation ) {
				default:
				case 0:
					return 6;
				case 1:
					return 1;
				case 2:
					return 8;
				case 3:
					return 3;
			}
			break;
		case 7: // 90* clockwise flipped
			switch ( rotation ) {
				default:
				case 0:
					return 7;
				case 1:
					return 4;
				case 2:
					return 5;
				case 3:
					return 2;
			}
			break;
		case 8: // 90* clockwise
			switch ( rotation ) {
				default:
				case 0:
					return 8;
				case 1:
					return 3;
				case 2:
					return 6;
				case 3:
					return 1;
			}
			break;
	}
}

