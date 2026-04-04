// The final transformation matrix used to render the mesh.
// The order is: rotate around X, rotate around Y, translate, then apply perspective.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
    // Translation moves the object in front of the camera.
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotation around the X axis controls vertical tilt.
    var cx = Math.cos(rotationX);
    var sx = Math.sin(rotationX);
    var rotX = [
        1,  0,  0, 0,
        0, cx, sx, 0,
        0,-sx, cx, 0,
        0,  0,  0, 1
    ];

    // Rotation around the Y axis controls horizontal turn.
    var cy = Math.cos(rotationY);
    var sy = Math.sin(rotationY);
    var rotY = [
         cy, 0,-sy, 0,
          0, 1,  0, 0,
         sy, 0, cy, 0,
          0, 0,  0, 1
    ];

    // Combine model transforms first, then apply the projection matrix.
    var modelMatrix = MatrixMult(trans, MatrixMult(rotY, rotX));
    return MatrixMult(projectionMatrix, modelMatrix);
}



class MeshDrawer
{
    constructor()
    {
        // Vertex shader:
        // - transforms vertex positions
        // - optionally swaps Y and Z
        // - optionally flips the V texture coordinate
        const vs = `
            attribute vec3 pos;
            attribute vec2 txc;

            uniform mat4 mvp;
            uniform bool swapYZ;
            uniform bool flipV;

            varying vec2 vTexCoord;

            void main()
            {
                vec3 p = pos;

                // This is useful for models exported with a different up-axis.
                if (swapYZ) {
                    p = vec3(pos.x, pos.z, pos.y);
                }

                gl_Position = mvp * vec4(p, 1.0);

                // Some models use the opposite vertical UV convention.
                float v = txc.y;
                if (flipV) {
                    v = 1.0 - v;
                }

                vTexCoord = vec2(txc.x, v);
            }
        `;

        // Fragment shader:
        // - either samples the texture
        // - or shows a fallback color based on fragment depth
        const fs = `
            precision mediump float;

            varying vec2 vTexCoord;

            uniform sampler2D tex;
            uniform bool showTex;

            void main()
            {
                if (showTex) {
                    gl_FragColor = texture2D(tex, vTexCoord);
                } else {
                    gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
                }
            }
        `;

        // Compile and link the shader program once.
        this.prog = InitShaderProgram(vs, fs);

        // Cache uniform locations to avoid repeated lookups during rendering.
        this.mvpLoc     = gl.getUniformLocation(this.prog, 'mvp');
        this.swapYZLoc  = gl.getUniformLocation(this.prog, 'swapYZ');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.texLoc     = gl.getUniformLocation(this.prog, 'tex');
        this.flipVLoc   = gl.getUniformLocation(this.prog, 'flipV');

        // Cache attribute locations for positions and UVs.
        this.posLoc = gl.getAttribLocation(this.prog, 'pos');
        this.txcLoc = gl.getAttribLocation(this.prog, 'txc');

        // Create GPU buffers for positions and texture coordinates.
        this.vertBuffer = gl.createBuffer();
        this.txcBuffer  = gl.createBuffer();

        // Create the texture object once and reuse it.
        this.texture = gl.createTexture();

        this.numVertices = 0;
        this.flipV = false;

        gl.useProgram(this.prog);

        // Default shader state before loading any model or texture.
        gl.uniform1i(this.swapYZLoc, 0);
        gl.uniform1i(this.showTexLoc, 0);
        gl.uniform1i(this.texLoc, 0);
        gl.uniform1i(this.flipVLoc, 0);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Small placeholder texture so drawing still works before a real image is loaded.
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            1, 1, 0,
            gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255,255,255,255])
        );

        // Safe texture settings for generic image loading.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }


    setMesh( vertPos, texCoords )
    {
        console.log("UV:", texCoords.length, "VERT:", vertPos.length);

        let minU = Infinity, maxU = -Infinity;
        let minV = Infinity, maxV = -Infinity;

        // Scan UV range to detect coordinates outside [0,1].
        for (let i = 0; i < texCoords.length; i += 2) {
            let u = texCoords[i];
            let v = texCoords[i + 1];

            minU = Math.min(minU, u);
            maxU = Math.max(maxU, u);
            minV = Math.min(minV, v);
            maxV = Math.max(maxV, v);
        }

        console.log("UV RANGE:", "U:", minU, maxU, "V:", minV, maxV);

        // If UVs go outside [0,1], normalize them to keep sampling stable.
        // This is useful for some meshes that were authored with repeated UV ranges.
        const needsNormalize = (minU < 0 || maxU > 1 || minV < 0 || maxV > 1);

        // Work on a copy so the original mesh data is not modified.
        let finalTexCoords = texCoords.slice();

        if (needsNormalize) {
            const rangeU = maxU - minU;
            const rangeV = maxV - minV;

            console.log("Normalizing UVs...");

            for (let i = 0; i < finalTexCoords.length; i += 2) {
                finalTexCoords[i]   = (finalTexCoords[i]   - minU) / rangeU;
                finalTexCoords[i+1] = (finalTexCoords[i+1] - minV) / rangeV;
            }

            // These meshes also need a vertical UV flip to match the texture.
            this.flipV = true;
        } else {
            this.flipV = false;
        }

        console.log("flipV =", this.flipV);

        // Upload vertex positions to the GPU.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Upload the processed UV coordinates to the GPU.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.txcBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalTexCoords), gl.STATIC_DRAW);

        // Each vertex is stored as 3 floats: x, y, z.
        this.numVertices = vertPos.length / 3;

        gl.useProgram(this.prog);

        // Update the shader with the UV orientation rule for the current mesh.
        gl.uniform1i(this.flipVLoc, this.flipV ? 1 : 0);
    }


    swapYZ( swap )
    {
        gl.useProgram(this.prog);

        // Toggle axis conversion directly in the vertex shader.
        gl.uniform1i(this.swapYZLoc, swap ? 1 : 0);
    }


    draw( trans )
    {
        gl.useProgram(this.prog);

        // Send the final transformation matrix to the GPU.
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        // Bind vertex positions to the "pos" attribute.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.enableVertexAttribArray(this.posLoc);
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);

        // Bind texture coordinates to the "txc" attribute.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.txcBuffer);
        gl.enableVertexAttribArray(this.txcLoc);
        gl.vertexAttribPointer(this.txcLoc, 2, gl.FLOAT, false, 0, 0);

        // Use texture unit 0 for sampling in the fragment shader.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.texLoc, 0);

        // Draw the mesh as a list of triangles.
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
    }


    setTexture( img )
    {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Texture flipping is handled in the shader, not during upload.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        // Upload the image pixels to the current WebGL texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // Clamp and linear filtering are safe defaults for generic textures.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }


    showTexture( show )
    {
        gl.useProgram(this.prog);

        // Switch between texture rendering and fallback shading.
        gl.uniform1i(this.showTexLoc, show ? 1 : 0);
    }
}
