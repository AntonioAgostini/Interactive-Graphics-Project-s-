
//@author: Agostini Antonio - 1995653

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.


	var transl = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];


	var cosx = Math.cos(rotationX);
	var sinx = Math.sin(rotationX);
	var rotX = [
		1,  0,   0,  0,
		0,  cosx,  sinx, 0,
		0, -sinx,  cosx, 0,
		0,  0,   0,  1
	];


	var cosy = Math.cos(rotationY);
	var siny = Math.sin(rotationY);
	var rotY = [
		 cosy, 0, -siny, 0,
		  0, 1,   0, 0,
		 siny, 0,  cosy, 0,
		  0, 0,   0, 1
	];

	// Combined: transl * rotY * rotX
	var mv = MatrixMult( transl, MatrixMult( rotY, rotX ) );
	return mv;
}



// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations

		// We compile the shader program
		this.prog = InitShaderProgram( meshVS, meshFS );

		this.mvpLoc = gl.getUniformLocation( this.prog, 'mvp' );
		this.mvLoc = gl.getUniformLocation( this.prog, 'mv' );
		this.normalMatLoc  = gl.getUniformLocation( this.prog, 'normalMat' );
		this.swapYZLoc  = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.showTexLoc  = gl.getUniformLocation( this.prog, 'showTexture' );
		this.lightDirLoc = gl.getUniformLocation( this.prog, 'lightDirec' );
		this.shininessLoc = gl.getUniformLocation( this.prog, 'shininessAlpha' );
		this.samplerLoc  = gl.getUniformLocation( this.prog, 'texSampler' );

		this.vertPosLoc  = gl.getAttribLocation( this.prog, 'pos' );
		this.texCoordLoc = gl.getAttribLocation( this.prog, 'txc' );
		this.normalLoc  = gl.getAttribLocation( this.prog, 'normal' );

		this.vertBuffer = gl.createBuffer();
		this.texBuffer  = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();

		this.texture = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );

        
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
		
		gl.bindBuffer( gl.ARRAY_BUFFER,  this.vertBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );

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
                if ( swap ) {
                    gl.uniform1i( this.swapYZLoc, 1 );
                } else {
                    gl.uniform1i( this.swapYZLoc, 0 );
                }
        
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

		
		gl.uniformMatrix4fv( this.mvpLoc, false, matrixMVP );
		gl.uniformMatrix4fv( this.mvLoc, false, matrixMV );
		gl.uniformMatrix3fv( this.normalMatLoc, false, matrixNormal );

	
		gl.bindBuffer( gl.ARRAY_BUFFER,  this.vertBuffer );
		gl.vertexAttribPointer( this.vertPosLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPosLoc );

	
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer );
		gl.vertexAttribPointer( this.texCoordLoc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoordLoc );

		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
		gl.vertexAttribPointer( this.normalLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normalLoc );

		
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

		// Generate mipmaps for better quality when the texture is minified.
		gl.generateMipmap( gl.TEXTURE_2D  );
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
        
		if ( show ) {
            gl.uniform1i( this.showTexLoc, 1 );
        } else {
            gl.uniform1i( this.showTexLoc, 0 );
        }
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram( this.prog );
		gl.uniform3f( this.lightDirLoc, x, y, z );
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininessAlpha )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram( this.prog );
		gl.uniform1f( this.shininessLoc,  shininessAlpha );
	}

}


// VS - Phong shading: normals are interpolated in the fragment shader.

var meshVS = `
    attribute vec3 pos;
    attribute vec2 txc;
    attribute vec3 normal;


    uniform mat4 mvp;
    uniform mat4 mv;
    uniform mat3 normalMat;
    uniform bool swapYZ;


    varying vec3 fragPosition;
    varying vec2 fragText; 
    varying vec3 fragNormal;


    void main()
    {
        vec3 p = pos;
        vec3 n = normal;


        if ( swapYZ ) {
            p = vec3( p.x, p.z, p.y );
            n = vec3( n.x, n.z, n.y );
        }

        vec4 camPos = mv * vec4(p, 1.0);
        fragPosition = camPos.xyz;

        fragNormal = normalMat * n;


        fragText = txc;

        gl_Position = mvp * vec4(p, 1.0);
    }
`;



//FS - Implements Blinn-Phong shading model in camera space:
//   C = Kd * I * max(0, dot(n, l))  + Ks * I * max(0, dot(n, h))^alpha  
//                   (diffuse)                 (specular)
var meshFS = `
    precision mediump float;


    uniform bool  showTexture;
    uniform sampler2D texSampler;
    uniform vec3  lightDirec;
    uniform float shininessAlpha;


    varying vec3 fragPosition;
    varying vec2 fragText;
    varying vec3 fragNormal;


    void main()
    {

        vec3 n = normalize( fragNormal );
        vec3 l = normalize( lightDirec );


        
        vec3 v = normalize( -fragPosition );

        vec3 h = normalize( l + v );


        vec3 Kd;
        if ( showTexture ) {
            Kd = texture2D( texSampler, fragText ).rgb;
        } else {
            Kd = vec3(1.0, 1.0, 1.0);
        }


        // Specular coefficient Ks and light intensity I (both white)
        vec3 Ks = vec3(1.0, 1.0, 1.0);
        vec3 I  = vec3(1.0, 1.0, 1.0);

        // Diffuse term: Kd * I * max(0, n · l)
        float diffuse = max( 0.0, dot(n, l) );

        // Specular term (Blinn): Ks * I * max(0, n · h)^alpha
        float specular = pow( max( 0.0, dot(n, h) ), shininessAlpha );

        // Final color = diffuse + specular
        vec3 color = Kd * I * diffuse + Ks * I * specular;


        gl_FragColor = vec4( color, 1.0 );
    }
`;

