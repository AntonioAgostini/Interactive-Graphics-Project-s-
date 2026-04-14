// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.

	// Translation matrix (column-major)
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// Rotation around X axis (column-major)
	var cx = Math.cos(rotationX);
	var sx = Math.sin(rotationX);
	var rotX = [
		1,  0,   0,  0,
		0,  cx,  sx, 0,
		0, -sx,  cx, 0,
		0,  0,   0,  1
	];

	// Rotation around Y axis (column-major)
	var cy = Math.cos(rotationY);
	var sy = Math.sin(rotationY);
	var rotY = [
		 cy, 0, -sy, 0,
		  0, 1,   0, 0,
		 sy, 0,  cy, 0,
		  0, 0,   0, 1
	];

	// Combined: trans * rotY * rotX
	var mv = MatrixMult( trans, MatrixMult( rotY, rotX ) );
	return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations

		// Compile the shader program
		this.prog = InitShaderProgram( meshVS, meshFS );

		// Get uniform locations
		this.mvpLoc        = gl.getUniformLocation( this.prog, 'mvp' );
		this.mvLoc         = gl.getUniformLocation( this.prog, 'mv' );
		this.normalMatLoc  = gl.getUniformLocation( this.prog, 'normalMat' );
		this.swapYZLoc     = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.showTexLoc    = gl.getUniformLocation( this.prog, 'showTexture' );
		this.lightDirLoc   = gl.getUniformLocation( this.prog, 'lightDir' );
		this.shininessLoc  = gl.getUniformLocation( this.prog, 'shininess' );
		this.samplerLoc    = gl.getUniformLocation( this.prog, 'texSampler' );

		// Get attribute locations
		this.vertPosLoc    = gl.getAttribLocation( this.prog, 'pos' );
		this.texCoordLoc   = gl.getAttribLocation( this.prog, 'txc' );
		this.normalLoc     = gl.getAttribLocation( this.prog, 'normal' );

		// Create vertex buffer objects
		this.vertBuffer    = gl.createBuffer();
		this.texBuffer     = gl.createBuffer();
		this.normalBuffer  = gl.createBuffer();

		// Create and initialize texture
		this.texture       = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );

		// Default state
		this.numTriangles = 0;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;

		// Upload vertex positions
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );

		// Upload texture coordinates
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );

		// Upload vertex normals
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram( this.prog );
		gl.uniform1i( this.swapYZLoc, swap ? 1 : 0 );
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		// Set transformation matrix uniforms
		gl.uniformMatrix4fv( this.mvpLoc,       false, matrixMVP );
		gl.uniformMatrix4fv( this.mvLoc,        false, matrixMV );
		gl.uniformMatrix3fv( this.normalMatLoc, false, matrixNormal );

		// Bind and enable vertex positions
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertBuffer );
		gl.vertexAttribPointer( this.vertPosLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPosLoc );

		// Bind and enable texture coordinates
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer );
		gl.vertexAttribPointer( this.texCoordLoc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoordLoc );

		// Bind and enable normals
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
		gl.vertexAttribPointer( this.normalLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normalLoc );

		// Bind texture unit 0
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.uniform1i( this.samplerLoc, 0 );

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.bindTexture( gl.TEXTURE_2D, this.texture );

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// Generate mipmaps for better quality
		gl.generateMipmap( gl.TEXTURE_2D );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.useProgram( this.prog );
		gl.uniform1i( this.showTexLoc, 1 );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram( this.prog );
		gl.uniform1i( this.showTexLoc, show ? 1 : 0 );
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram( this.prog );
		gl.uniform3f( this.lightDirLoc, x, y, z );
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram( this.prog );
		gl.uniform1f( this.shininessLoc, shininess );
	}
}

// Vertex Shader
// Phong shading: normals are interpolated in the fragment shader.
// We pass to the fragment shader:
//   - the position in camera (view) space for computing the view vector
//   - the normal transformed into camera space via the normal matrix (inverse-transpose of MV)
var meshVS = `
	attribute vec3 pos;
	attribute vec2 txc;
	attribute vec3 normal;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normalMat;
	uniform bool swapYZ;

	varying vec3 fragPos;     // position in camera space
	varying vec2 fragTex;     // texture coordinates
	varying vec3 fragNormal;  // normal in camera space

	void main()
	{
		vec3 p = pos;
		vec3 n = normal;

		// Optionally swap Y and Z axes (useful for some OBJ files)
		if ( swapYZ ) {
			p = vec3( p.x, p.z, p.y );
			n = vec3( n.x, n.z, n.y );
		}

		// Transform position to camera space (for shading computations)
		vec4 camPos = mv * vec4(p, 1.0);
		fragPos = camPos.xyz;

		// Transform normal to camera space using normal matrix (inverse-transpose of MV upper 3x3)
		fragNormal = normalMat * n;

		// Pass texture coords
		fragTex = txc;

		// Final clip-space position
		gl_Position = mvp * vec4(p, 1.0);
	}
`;

// Fragment Shader
// Implements Blinn-Phong shading model in camera space:
//   color = Kd * I * max(0, dot(n, l))  [diffuse]
//         + Ks * I * max(0, dot(n, h))^alpha  [specular, Blinn half-vector]
// where:
//   l = normalize(lightDir)  -- light direction in camera space (already provided in camera space)
//   v = normalize(-fragPos)  -- view direction (camera is at origin in camera space)
//   h = normalize(l + v)     -- Blinn half-vector
//   n = normalize(fragNormal)
//   I = (1,1,1) white light intensity
//   Kd = texture color if showTexture, else (1,1,1)
//   Ks = (1,1,1)
//   alpha = shininess
var meshFS = `
	precision mediump float;

	uniform bool  showTexture;
	uniform sampler2D texSampler;
	uniform vec3  lightDir;     // light direction in camera space (normalized by CPU or we normalize here)
	uniform float shininess;    // Blinn-Phong exponent alpha

	varying vec3 fragPos;
	varying vec2 fragTex;
	varying vec3 fragNormal;

	void main()
	{
		// Normalize vectors
		vec3 n = normalize( fragNormal );
		vec3 l = normalize( lightDir );

		// In camera space the camera is at the origin, so view direction is -fragPos
		vec3 v = normalize( -fragPos );

		// Blinn half-vector
		vec3 h = normalize( l + v );

		// Diffuse coefficient Kd: use texture if enabled, otherwise white
		vec3 Kd;
		if ( showTexture ) {
			Kd = texture2D( texSampler, fragTex ).rgb;
		} else {
			Kd = vec3(1.0, 1.0, 1.0);
		}

		// Specular coefficient Ks (white) and light intensity I (white)
		vec3 Ks = vec3(1.0, 1.0, 1.0);
		vec3 I  = vec3(1.0, 1.0, 1.0);

		// Diffuse term: Kd * I * max(0, n · l)
		float diffuse = max( 0.0, dot(n, l) );

		// Specular term (Blinn): Ks * I * max(0, n · h)^alpha
		float specular = pow( max( 0.0, dot(n, h) ), shininess );

		// Final color = diffuse + specular
		// (ambient is optional per README; not included as no ambient control in UI)
		vec3 color = Kd * I * diffuse + Ks * I * specular;

		gl_FragColor = vec4( color, 1.0 );
	}
`;
