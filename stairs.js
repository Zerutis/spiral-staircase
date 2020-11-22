    // once everything is loaded, we run our Three.js stuff.
    $(function () {
        var stats = initStats();

        // create a scene, that will hold all our elements such as objects, cameras and lights.
        var scene = new THREE.Scene();

        // create a camera, which defines where we're looking at.
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        // position and point the camera to the center of the scene
        camera.position.x = -30;
        camera.position.y = 40;
        camera.position.z = 30;
        camera.lookAt(scene.position);

        // add spotlight for the shadows
        var ambientLight = new THREE.AmbientLight(0x000000);
		scene.add(ambientLight);
        var spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( -40, 60, -10 );
        spotLight.castShadow = true;
        scene.add( spotLight );

        // create a render and set the size
        var renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xEEEEEE, 1.0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;

        var axes = new THREE.AxisHelper( 20 );
        scene.add(axes);

        // add gui for better user experience
        var gui = new dat.GUI();

        var controls = new function() {
            this.numberOfStairs = 5;
            this.angle = 30;
            this.radius = 15;
        }

        gui.add(controls, 'numberOfStairs', 1,20).name('Laiptų skaičius').step(1);
        gui.add(controls, 'angle', 0, 180).name('Laiptų sukimosi kampas').step(1);
        gui.add(controls, 'radius', 0, 60).name('Spindulys').step(1);

        // add the output of the renderer to the html element
        $("#WebGL-output").append(renderer.domElement);
        var controls = new THREE.TrackballControls( camera, renderer.domElement );     
        render();

        //create the ground plane
        function createGround(length, width){
            var planeGeometry = new THREE.PlaneGeometry(length,width);
            var planeMaterial = new THREE.MeshLambertMaterial({color: 0xabcdef});
            var floor = new THREE.Mesh(planeGeometry,planeMaterial);
            floor.receiveShadow = true;

            // rotate and position the plane
            floor.rotation.x=-0.5*Math.PI;
            floor.position.x=15

            scene.add(floor);
        }
        createGround(80,40);

        function generatePoints(points, segments, radius, radiusSegments, closed) {
            spGroup = new THREE.Object3D();
            var material = new THREE.MeshPhongMaterial({color: 0xff0000, transparent: false});
            points.forEach(function (point) {

                var spGeom = new THREE.SphereGeometry(0.2);
                var spMesh = new THREE.Mesh(spGeom, material);
                spMesh.position = point;
                spGroup.add(spMesh);
            });
            // add the points as a group to the scene
            scene.add(spGroup);

            // use the same points to create a convexgeometry
            var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(points), segments, radius, radiusSegments, closed);
            tubeMesh = createMesh(tubeGeometry, 0xff0000);
            return tubeMesh;
        }

        function createMesh(geom, color) {
            var meshMaterial = new THREE.MeshLambertMaterial({color: color});
            // create a multimaterial
            var mesh = THREE.SceneUtils.createMultiMaterialObject(geom, [meshMaterial]);

            return mesh;
        }

        function drawShape() {
            // create a basic shape
            var shape = new THREE.Shape();
            shape.moveTo(-1, 1)
            shape.lineTo(-1, 2)
            shape.lineTo(1.5, 2)
            shape.lineTo(1.5, 1.0)
            shape.lineTo(-1, 1.0)
            return shape;
        }

        var options = {
            amount: 7,
            bevelThickness: 0,
            bevelSize: 0.5,
            bevelSegments: 6,
            bevelEnabled: true,
            curveSegments: 8,
            steps: 5
        };


        // creates support construction that contains handling, and cylinder that hold stairs from bottom and step.
        function createStaircase(numberOfStairs, degree, radius, x0, y0 ,z0) {
            var groupSupport = new THREE.Object3D();

            var angle = degree / numberOfStairs;
            var axis = new THREE.Vector3( 0, 1, 0 );

            var cylinderColor = 0xAAAAAA;

            var percent = degree/360;
            
            const plusX = 2-(2*percent);
            const plusY = 2;
            const plusZ = 7; 

            var handrail = [];
            for (var i = 0; i < numberOfStairs; i++){


                // First point of rod
                var points = [];
                var axisX = x0 + plusX * i;
                var axisY = y0 + plusY * i;
                var axisZ = z0 + radius;

                // for small cylinder and step position
                var vector = new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180)

                // creates small cylinder for holding step.
                const geometry = new THREE.CylinderGeometry( 1, 1, 2, 64 );
                const material = new THREE.MeshPhongMaterial ( {color: cylinderColor} );
                const base = new THREE.Mesh( geometry, material );
                base.position.set(vector.x,vector.y,vector.z);
                groupSupport.add(base);

                // creates step
                step = createMesh(new THREE.ExtrudeGeometry(drawShape(), options),0x654321);
                step.position.set(vector.x,vector.y,vector.z);
                step.rotation.y = (angle * i * Math.PI / 180);
                groupSupport.add(step);

                // second point of rod
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));
                axisX = x0 + plusX * i;
                axisY = y0 + plusY * i + 0.5;
                axisZ = z0 + plusZ + radius;
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                // third point of rod
                axisX = x0 + plusX * i;
                axisY = y0 + plusY * i + 7;
                axisZ = z0 + plusZ + radius;
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                // connect all third point to make a handrail
                handrail.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                var cylinderMesh = generatePoints(points,64,0.2,8,false);
                groupSupport.add(cylinderMesh);
            }
            var handleMesh = generatePoints(handrail,64,0.3,8,false);

            groupSupport.add(handleMesh);
            groupSupport.castShadow = true;
            return groupSupport;
        }
        
        //scene.add(createStaircase(10, 180, 0, 1, 1, 1));

        function render() {
            var group = new THREE.Object3D();

            var numberOfStairs = controls.numberOfStairs;
            var angle = controls.angle;
            var radius = controls.radius;

            //console.log(numberOfStairs);

            //group.add(createStaircase(numberOfStairs, angle, radius, 1, 1, 1));
           

            stats.update();
 
            renderer.render( scene, camera );
            requestAnimationFrame( render );
            controls.update(); 

            
        }

        function initStats() {

            var stats = new Stats();
            stats.setMode(0); // 0: fps, 1: ms
        
            // Align top-left
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = '0px';
            stats.domElement.style.top = '0px';
        
            $("#Stats-output").append(stats.domElement);
        
            return stats;
        }
    });