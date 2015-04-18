
LIGHTS.TerrainMap = function( renderer ) {

	this.initialize( renderer );
};

LIGHTS.TerrainMap.size = 512;
LIGHTS.TerrainMap.uvOffset = 0.2;

LIGHTS.TerrainMap.prototype = {

	post:       true,
    opacity:    0.98,
    subtract:   0.005,

    // _______________________________________________________________________________________ Constructor

	initialize: function( renderer ) {

        this.renderer = renderer;

        var size = LIGHTS.TerrainMap.size,
	        sizeHalf = size / 2,
            postSize = size * (1 + 2 * LIGHTS.TerrainMap.uvOffset),
            postSizeHalf = postSize * 0.5,
            postTextureParams = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat },
            textureParams = { minFilter: THREE.LinearMipMapLinearFilter, magFilter: THREE.LinearMipMapLinearFilter, format: THREE.RGBFormat },
            screenShader, screenUniforms, screenFragmentShader, texturedUniforms, texturedFragmentShader, combinedUniforms, combinedMaterial, texturedQuad, planeGeometry;

        this.offset = size * LIGHTS.TerrainMap.uvOffset;
        this.viewRadius = postSizeHalf;

        this.camera = new THREE.Camera();
        this.camera.projectionMatrix = THREE.Matrix4.makeOrtho( -postSizeHalf, postSizeHalf, postSizeHalf, -postSizeHalf, -10000, 10000 ),
        this.camera.position.z = 100;

		this.scene = new THREE.Scene();
        this.postTexture = new THREE.WebGLRenderTarget( postSize, postSize, postTextureParams );

        // Postprocessing
        this.postCamera = new THREE.Camera();
        this.postCamera.projectionMatrix = THREE.Matrix4.makeOrtho( -sizeHalf, sizeHalf, sizeHalf, -sizeHalf, -10000, 10000 ),
        this.postCamera.position.z = 100;

        this.postScene = new THREE.Scene();
        this.glowScene = new THREE.Scene();

		// Textures
        this.texture = new THREE.WebGLRenderTarget( size, size, textureParams );
		this.combinedTexture = new THREE.WebGLRenderTarget( size, size, postTextureParams );
        this.canvasTexture = new THREE.WebGLRenderTarget( size, size, postTextureParams );

        // Screen Material
        screenShader = THREE.ShaderUtils.lib["screen"];
		screenUniforms = { tDiffuse: { type: "t", value: 0, texture: this.postTexture }	};

		screenFragmentShader = [

			"varying vec2 vUv;",
			"uniform sampler2D tDiffuse;",

			"void main() {",

				"gl_FragColor = texture2D( tDiffuse, vUv );",
			"}"

		].join("\n");

        this.screenMaterial = new THREE.MeshShaderMaterial( {

            uniforms: screenUniforms,
            vertexShader: screenShader.vertexShader,
            fragmentShader: screenFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true
        } );

        // Textured Material
        texturedUniforms = {

            tDiffuse:   { type: "t", value: 0, texture: this.canvasTexture },
            opacity:    { type: "f", value: this.opacity },
            subtract:   { type: "f", value: this.subtract }
        };

        texturedFragmentShader = [

            "varying vec2 vUv;",
            "uniform sampler2D tDiffuse;",
            "uniform float opacity;",
            "uniform float subtract;",

            "void main() {",

                "vec4 texel = texture2D( tDiffuse, vUv );",
                "texel.r = min( texel.r - subtract, texel.r * opacity );",
                "texel.g = min( texel.g - subtract, texel.g * opacity );",
                "texel.b = min( texel.b - subtract, texel.b * opacity );",
                "gl_FragColor = texel;",
            "}"

        ].join("\n");

        this.texturedMaterial = new THREE.MeshShaderMaterial( {

            uniforms: texturedUniforms,
            vertexShader: screenShader.vertexShader,
            fragmentShader: texturedFragmentShader
        } );

		// Combined Material
        combinedUniforms = THREE.UniformsUtils.clone( screenUniforms );
        combinedUniforms["tDiffuse"].texture = this.combinedTexture;

		combinedMaterial = new THREE.MeshShaderMaterial( {

		    uniforms: combinedUniforms,
		    vertexShader: screenShader.vertexShader,
		    fragmentShader: screenFragmentShader
		} );

		// Quads
		planeGeometry = new THREE.PlaneGeometry( size, size );
        texturedQuad = new THREE.Mesh( planeGeometry, this.texturedMaterial );
        texturedQuad.position.z = -10;
        this.postScene.addObject( texturedQuad );

        // Tiled quads
        this.setupTiledQuad();

        // Combined
        this.combinedScene = new THREE.Scene();

		// Combined Quad
        this.combinedQuad = new THREE.Mesh( planeGeometry, combinedMaterial );
		this.combinedScene.addObject( this.combinedQuad );

		var canvasQuad = new THREE.Mesh( new THREE.PlaneGeometry( postSize, postSize ), new THREE.MeshBasicMaterial( { map: this.canvasTexture } ) );
		canvasQuad.z = -10;
		this.glowScene.addObject( canvasQuad );

		// Combined Black
		this.combinedColor = new THREE.Mesh( planeGeometry, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
		this.combinedColor.position.z = 10;
		this.combinedColor.visible = false;
		this.combinedScene.addObject( this.combinedColor );

        // Test
//        this.tests = [];
//        var colors = [ 0xFFFF00, 0x00FFFF, 0xFF00FF, 0xFF0000, 0x00FF00, 0x0000FF ];
//
//        for( var i = 0; i < colors.length; i++ ) {
//
//            var test = new THREE.Mesh( new THREE.SphereGeometry( 300, 10, 10 ), new THREE.MeshBasicMaterial( {wireframe: true, color: colors[ i ] } ) );
//            test.position.x = Math.random() * 200 - 100;
//            test.position.y = Math.random() * 200 - 100;
//            test.speed = 0.005 * Math.random();
//            this.scene.addChild( test );
//            this.tests.push( test );
//        }
    },

    // _______________________________________________________________________________________ Setup

	setupTiledQuad: function() {

		var s = LIGHTS.TerrainMap.size,
			v1 = s / 2,
			u0 = LIGHTS.TerrainMap.uvOffset,
			u1 = 1 - LIGHTS.TerrainMap.uvOffset,
			v0 = (0.5 - LIGHTS.TerrainMap.uvOffset) * v1,
			quad, combined;

		// Center
		combined = new THREE.PlaneGeometry( s, s );
		this.setQuadUVs( combined, u0, u0, u0, u1, u1, u1, u1, u0 );

		// Left
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, v0, v1, v0, -v1, v1, -v1, v1, v1 );
		this.setQuadUVs( quad, 0, u0, 0, u1, u0, u1, u0, u0 );
		GeometryUtils.merge( combined, quad );

		// Right
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, -v1, v1, -v1, -v1, -v0, -v1, -v0, v1 );
		this.setQuadUVs( quad, u1, u0, u1, u1, 1, u1, 1, u0 );
		GeometryUtils.merge( combined, quad );

		// Top
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, -v1, v1, -v1, v0, v1, v0, v1, v1 );
		this.setQuadUVs( quad, u0, u1, u0, 1, u1, 1, u1, u1 );
		GeometryUtils.merge( combined, quad );

		// Bottom
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, -v1, -v0, -v1, -v1, v1, -v1, v1, -v0 );
		this.setQuadUVs( quad, u0, 0, u0, u0, u1, u0, u1, 0 );
		GeometryUtils.merge( combined, quad );

		// Top Left
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, v0, v1, v0, v0, v1, v0, v1, v1 );
		this.setQuadUVs( quad, 0, u1, 0, 1, u0, 1, u0, u1 );
		GeometryUtils.merge( combined, quad );

		// Top Right
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, -v1, v1, -v1, v0, -v0, v0, -v0, v1 );
		this.setQuadUVs( quad, u1, u1, u1, 1, 1, 1, 1, u1 );
		GeometryUtils.merge( combined, quad );

		// Bottom Left
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, v0, -v0, v0, -v1, v1, -v1, v1, -v0 );
		this.setQuadUVs( quad, 0, 0, 0, u0, u0, u0, u0, 0 );
		GeometryUtils.merge( combined, quad );

		// Bottom Right
		quad = new THREE.PlaneGeometry( s, s );
		this.setQuadVertices( quad, -v1, -v0, -v1, -v1, -v0, -v1, -v0, -v0 );
		this.setQuadUVs( quad, u1, 0, u1, u0, 1, u0, 1, 0 );
		GeometryUtils.merge( combined, quad );

		// Add to scene
        this.postScene.addObject( new THREE.Mesh( combined, this.screenMaterial ) );
	},
/*
    setupTiledQuads: function() {

        var v1 = LIGHTS.TerrainMap.size / 2,
            u0 = LIGHTS.TerrainMap.uvOffset,
            u1 = 1 - LIGHTS.TerrainMap.uvOffset,
            v0 = (0.5 - LIGHTS.TerrainMap.uvOffset) * v1,
            quad;

        // Center
        quad = this.createQuad();
        this.setQuadUVs( quad, u0, u0, u0, u1, u1, u1, u1, u0 );

        // Left
        quad = this.createQuad();
        this.setQuadVertices( quad, v0, v1, v0, -v1, v1, -v1, v1, v1 );
        this.setQuadUVs( quad, 0, u0, 0, u1, u0, u1, u0, u0 );

        // Right
        quad = this.createQuad();
        this.setQuadVertices( quad, -v1, v1, -v1, -v1, -v0, -v1, -v0, v1 );
        this.setQuadUVs( quad, u1, u0, u1, u1, 1, u1, 1, u0 );

        // Top
        quad = this.createQuad();
        this.setQuadVertices( quad, -v1, v1, -v1, v0, v1, v0, v1, v1 );
        this.setQuadUVs( quad, u0, u1, u0, 1, u1, 1, u1, u1 );

        // Bottom
        quad = this.createQuad();
        this.setQuadVertices( quad, -v1, -v0, -v1, -v1, v1, -v1, v1, -v0 );
        this.setQuadUVs( quad, u0, 0, u0, u0, u1, u0, u1, 0 );

        // Top Left
        quad = this.createQuad();
        this.setQuadVertices( quad, v0, v1, v0, v0, v1, v0, v1, v1 );
        this.setQuadUVs( quad, 0, u1, 0, 1, u0, 1, u0, u1 );

        // Top Right
        quad = this.createQuad();
        this.setQuadVertices( quad, -v1, v1, -v1, v0, -v0, v0, -v0, v1 );
        this.setQuadUVs( quad, u1, u1, u1, 1, 1, 1, 1, u1 );

        // Bottom Left
        quad = this.createQuad();
        this.setQuadVertices( quad, v0, -v0, v0, -v1, v1, -v1, v1, -v0 );
        this.setQuadUVs( quad, 0, 0, 0, u0, u0, u0, u0, 0 );

        // Bottom Right
        quad = this.createQuad();
        this.setQuadVertices( quad, -v1, -v0, -v1, -v1, -v0, -v1, -v0, -v0 );
        this.setQuadUVs( quad, u1, 0, u1, u0, 1, u0, 1, 0 );
    },

    createQuad: function() {

        var screenQuad = new THREE.Mesh( new THREE.PlaneGeometry( LIGHTS.TerrainMap.size, LIGHTS.TerrainMap.size ), this.screenMaterial );
        this.postScene.addObject( screenQuad );

        return screenQuad;
    },
*/
    setQuadVertices: function( quad, x0, y0, x1, y1, x2, y2, x3, y3 ) {

        var geo = (quad instanceof THREE.Mesh)? quad.geometry : quad;
	        vertices = geo.vertices,
            face = geo.faces[0],
            a = vertices[ face.a ].position,
            b = vertices[ face.b ].position,
            c = vertices[ face.c ].position,
            d = vertices[ face.d ].position;

        a.x = x0;
        a.y = y0;
        b.x = x1;
        b.y = y1;
        c.x = x2;
        c.y = y2;
        d.x = x3;
        d.y = y3;
    },

    setQuadUVs: function( quad, u0, v0, u1, v1, u2, v2, u3, v3 ) {

	    var geo = (quad instanceof THREE.Mesh)? quad.geometry : quad;
		    uvs = geo.faceVertexUvs[ 0 ][ 0 ];

        uvs[ 0 ].u = u0;
        uvs[ 0 ].v = v0;
        uvs[ 1 ].u = u1;
        uvs[ 1 ].v = v1;
        uvs[ 2 ].u = u2;
        uvs[ 2 ].v = v2;
        uvs[ 3 ].u = u3;
        uvs[ 3 ].v = v3;
    },

   // _______________________________________________________________________________________ Update

    update: function() {

	    if( this.post ) {

	        // Render scene
	        this.renderer.render( this.scene, this.camera, this.postTexture, true );

			// Postprocessing
	        this.texturedMaterial.uniforms.opacity.value = this.opacity;
	        this.texturedMaterial.uniforms.subtract.value = this.subtract;
			this.renderer.render( this.postScene, this.postCamera, this.combinedTexture, true );

			// Render canvas
			this.renderer.render( this.combinedScene, this.postCamera, this.canvasTexture, true );

			// Render glows
		    this.renderer.render( this.glowScene, this.camera, this.texture, true );
	    }
	    else {

	        // Render scene
		    this.renderer.render( this.scene, this.camera, this.texture, true );
	    }
    },

    clear: function( color ) {

	    if( color === undefined ) color = 0x000000;

	    this.combinedColor.materials[ 0 ].color.setHex( color );
	    this.combinedColor.visible = true;
	    this.combinedQuad.visible = false;

        this.renderer.render( this.combinedScene, this.postCamera, this.canvasTexture, true );

	    this.combinedColor.visible = false;
	    this.combinedQuad.visible = true;
    }
};

/**
 * @author mr.doob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

LIGHTS.TerrainPlane = function( size, resolution, height, image ) {

	THREE.Geometry.call( this );

	this.resolution = resolution;
	this.segmentSize = size / resolution;

    var ix, iy, x, y,
    sizeHalf = size / 2,
    resolution1 = resolution + 1,
    segmentSize = this.segmentSize,
    vertex, vertexPosition, a, b, c, d, heightMap;

    heightMap = createHeightMap( resolution, height, image );

    this.grid = [];
    this.vertexGrid = [];
	this.uvGrid = [];
	this.indexGrid = [];
	this.heightGrid = [];

    // Vertices
    for( ix = 0; ix <= resolution; ix++ ) {

        x = ix * segmentSize - sizeHalf;
        this.grid[ ix ] = [];
        this.vertexGrid[ ix ] = [];
	    this.indexGrid[ ix ] = [];
	    this.heightGrid[ ix ] = [];

        for( iy = 0; iy <= resolution; iy++ ) {

            y = iy * segmentSize - sizeHalf;
            vertexPosition = new THREE.Vector3( x, heightMap[ ix ][ iy ], y );
            vertex = new THREE.Vertex( vertexPosition );

            this.grid[ ix ][ iy ] = vertexPosition;
            this.vertexGrid[ ix ][ iy ] = vertex;
            this.indexGrid[ ix ][ iy ] = this.vertices.length;
	        this.heightGrid[ ix ][ iy ] = vertexPosition.y;

	        this.vertices.push( vertex );
		}
	}

	// UVs
	for( ix = 0; ix <= resolution; ix++ ) {

		this.uvGrid[ ix ] = [];

	    for( iy = 0; iy <= resolution; iy++ )
			this.uvGrid[ ix ][ iy ] = new THREE.UV( iy / resolution, ix / resolution );
	}

    // Faces
    for( ix = 0; ix < resolution; ix++ ) {

        for( iy = 0; iy < resolution; iy++ ) {

			a = ix + resolution1 * iy;
            b = ( ix + 1 ) + resolution1 * iy;
			c = ( ix + 1 ) + resolution1 * ( iy + 1 );
            d = ix + resolution1 * ( iy + 1 );

			this.faces.push( new THREE.Face4( a, b, c, d ) );
			this.faceVertexUvs[ 0 ].push( [
				this.uvGrid[ ix     ][ iy     ],
				this.uvGrid[ ix + 1 ][ iy     ],
				this.uvGrid[ ix + 1 ][ iy + 1 ],
				this.uvGrid[ ix     ][ iy + 1 ]
            ] );
		}
	}

	this.computeCentroids();
	this.computeFaceNormals();
    this.computeVertexNormals();

    this.vertexNormals = THREE.MeshUtils.getVertexNormals( this );

    // _______________________________________________________________________________________ Create Height Maps

    function createHeightMap( resolution, height, image ) {

        // ImageData
        var heightMap = [],
            imageCanvas = document.createElement( 'canvas' ),
            imageContext = imageCanvas.getContext( '2d' ),
            imageData, x, y, ix, iy, blurRadius, blurBuffer, blurAcc, bx, by;

        imageContext.drawImage( image, 0, 0 );
        imageData = imageContext.getImageData( 0, 0, resolution, resolution ).data;

        // Height map
        for( x = 0; x <= resolution; x++ )
            heightMap[ x ] = [];

        // Interior
        for( x = 0; x <= resolution; x++ ) {

            ix = (x < resolution)? x : 0;

            for( y = 0; y <= resolution; y++ ) {

                iy = (y < resolution)? y : 0;
                heightMap[ x ][ y ] = imageData[ (ix + iy * resolution) * 4 ];
            }
        }

        // Blur
        blurRadius = 2;
        blurBuffer = [];

        for( x = 0; x <= resolution; x++ )
            blurBuffer[ x ] = heightMap[ x ].slice( 0 );

        for( x = 0; x <= resolution; x++ ) {

            for( y = 0; y <= resolution; y++ ) {

                blurAcc = 0;

                for( by = -blurRadius; by <= blurRadius; by++ ) {

                    for( bx = -blurRadius; bx <= blurRadius; bx++ ) {

                        ix = x + bx;
                        iy = y + by;

                        if( ix < 0 )
                            ix += resolution;
                        else if( ix > resolution )
                            ix -= resolution;

                        if( iy < 0 )
                            iy += resolution;
                        else if( iy > resolution )
                            iy -= resolution;

                        blurAcc += blurBuffer[ ix ][ iy ];
                    }
                }

                heightMap[ x ][ y ] = blurAcc / ((blurRadius * 2 + 1) * (blurRadius * 2 + 1));
            }
        }

        // Scale
        for( x = 0; x <= resolution; x++ )
            for( y = 0; y <= resolution; y++ )
                heightMap[ x ][ y ] = height * ((heightMap[ x ][ y ] - 128) / 255);

        return heightMap;
    }
};

LIGHTS.TerrainPlane.prototype = new THREE.Geometry();
LIGHTS.TerrainPlane.prototype.constructor = LIGHTS.TerrainPlane;

// _______________________________________________________________________________________ Public

LIGHTS.TerrainPlane.prototype.displaceVertex = function( x, y, radius, height ) {

	var radius2 = radius * radius,
		diameter = radius * 2,
		resolution = this.resolution,
		grid = this.grid,
		ix, iy, dx2, dy2, gx, gy, gridX, gridX0, h;

	// Vertices
	for( ix = 0; ix < diameter; ix++ ) {

		dx2 = (ix - radius) * (ix - radius);
		gx = (resolution + x + ix - radius) % resolution;
		gridX = grid[ gx ];

		for( iy = 0; iy < diameter; iy++ ) {

			dy2 = (iy - radius) * (iy - radius);
			gy = (resolution + y + iy - radius) % resolution;
			h = Math.max( 0, 1 - ((dx2 + dy2) / radius2) );

			if( h > 0 )
				gridX[ gy ].y += height * (Math.sin( rad180 * h - rad90 ) + 1) * 0.5;
		}
	}

	// Fix tiled border
	gridX = grid[ resolution ];
	gridX0 = grid[ 0 ];

	for( iy = 0; iy <= resolution; iy++ )
		gridX[ iy ].y = gridX0[ iy ].y;

	for( ix = 0; ix < resolution; ix++ )
		grid[ ix ][ resolution ].y = grid[ ix ][ 0 ].y;

	// Dirty
	this.__dirtyVertices = true;
};

LIGHTS.TerrainPlane.prototype.tileBorders = function() {

	var resolution = this.resolution,
		grid = this.grid,
		ix, iy, dx2, dy2, gx, gy, gridX, gridX0, h;

	// Fix tiled border
	gridX = grid[ resolution ];
	gridX0 = grid[ 0 ];

	for( iy = 0; iy <= resolution; iy++ )
		gridX[ iy ].y = gridX0[ iy ].y;

	for( ix = 0; ix < resolution; ix++ )
		grid[ ix ][ resolution ].y = grid[ ix ][ 0 ].y;

	// Dirty
	this.__dirtyVertices = true;
};

LIGHTS.TerrainPlane.prototype.resetVertices = function() {

	for( x = 0; x <= this.resolution; x++ )
	    for( y = 0; y <= this.resolution; y++ )
		    this.grid[ x ][ y ].y = this.heightGrid[ x ][ y ];

	// Dirty
	this.__dirtyVertices = true;

	this.computeCentroids();
	this.computeFaceNormals();
    this.computeVertexNormals();
};
