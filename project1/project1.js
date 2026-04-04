// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Convert degrees to radians for the Math.sin/cos functions
	var radiant = rotation * Math.PI / 180;
	var c = Math.cos(radiant);
	var s = Math.sin(radiant);

    // In column-major order.
	// The matrix resulting from the combination Translation*Rotation*Scale is: 
	return Array( 
		scale * c,  scale * s,  0,          // Column 1
		-scale * s, scale * c,  0,          // Column 2
		positionX,  positionY,  1           // Column 3
	);
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{

	// The composition of transformations is achieved by matrix multiplication.
	// The operation is: Result = transformation2 * transformation1
	var m = new Array(9);

    // Since matrices m are in column-major format, the index of an element at row r and column c is computed as: r + c * 3.
    // m[row + col*3]
	for (var r = 0; r < 3; r++) {
		for (var c = 0; c < 3; c++) {
			m[r + c*3] = trans2[r + 0*3] * trans1[0 + c*3] + trans2[r + 1*3] * trans1[1 + c*3] + trans2[r + 2*3] * trans1[2 + c*3];
		}
	}

	return m;
}