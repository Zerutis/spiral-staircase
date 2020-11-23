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
            this.numberOfStairs = 4;
            this.angle = 90;
            this.radius = 0;
        }

        // add spotlight for the shadows
        var ambientLight = new THREE.AmbientLight(0x000000);
        scene.add(ambientLight);
        var spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( -40, 60, -10 );
        spotLight.castShadow = true;
        scene.add(spotLight);

        var listeners = []
        listeners.push(gui.add(controls, 'numberOfStairs', 1,20).name('Laiptų skaičius').step(1));
        listeners.push(gui.add(controls, 'angle', 0, 360).name('Laiptų posūkis').step(1));
        listeners.push(gui.add(controls, 'radius', 0, 10).name('Spindulys').step(1));

        listeners.forEach(listener => listener.onFinishChange(reload));

        function reload(){
            deleteScene();
            scene.add(createStaircase(controls.numberOfStairs, controls.angle, controls.radius, 1, 1, 1));
        }

        function deleteScene()
        {
            scene.remove(scene.children[scene.children.length-1]);
        }

        // add the output of the renderer to the html element
        $("#WebGL-output").append(renderer.domElement);
        var control = new THREE.TrackballControls( camera, renderer.domElement );     
        render();

        //create the ground plane
        function createGround(length, width, x, y, z){
            var planeGeometry = new THREE.PlaneGeometry(length,width);
            var planeMaterial = new THREE.MeshPhongMaterial({color: 0xabcdef});
            var floor = new THREE.Mesh(planeGeometry,planeMaterial);
            floor.receiveShadow = true;

            // rotate and position the plane
            floor.rotation.x=-0.5*Math.PI;
            floor.position.x=x
            floor.position.y=y;
            floor.position.z=z;

            return floor;
        }
        scene.add(createGround(80,40,0,0,0));

        function generatePoints(points, segments, radius, radiusSegments, closed) {
            var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(points), segments, radius, radiusSegments, closed);
            tubeMesh = createMesh(tubeGeometry, 0xff0000);
            return tubeMesh;
        }

        function createMesh(geom, color) {
            var meshMaterial = new THREE.MeshLambertMaterial({color: color});
            var mesh = new THREE.Mesh(geom,meshMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        var stepProps = new function(){
			this.steps = 1,
			this.amount = 1,
            this.bevelEnabled = true,
			this.bevelThickness = 0.1,
			this.bevelSize = 0.1,
			this.bevelSegments = 10,
            this.corner = 0.1;
            
        }

        var extrudeSettings = {
                steps: stepProps.steps,
                amount: stepProps.amount,
                bevelEnabled: stepProps.bevelEnabled,
                bevelThickness: stepProps.bevelThickness,
                bevelSize: stepProps.bevelSize,
                bevelSegments: stepProps.bevelSegments
        };

        function drawShape(x,y) {
			var step = new THREE.Shape();
			step.moveTo(-x/2,-y/2+stepProps.corner);
			step.bezierCurveTo(-x/2,-y/2,-x/2,-y/2,-x/2+stepProps.corner,-y/2);
			step.lineTo(x/2-stepProps.corner,-y/2);
			step.bezierCurveTo(x/2,-y/2,x/2,-y/2,x/2,stepProps.corner-y/2);
			step.lineTo(x/2,y/2-stepProps.corner);
			step.bezierCurveTo(x/2,y/2,x/2,y/2,x/2-stepProps.corner,y/2);
			step.bezierCurveTo(0,y/2,-x/2+stepProps.corner,stepProps.corner,-x/2+stepProps.corner,0);
			step.bezierCurveTo(-x/2,-stepProps.corner,-x/2,-stepProps.corner,-x/2,-stepProps.corner*2);
			step.lineTo(-x/2,-y/2+1);
            return step;
        } 

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
                base.castShadow = true;
                groupSupport.add(base);


                // second point of rod
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));
                axisX = x0 + plusX * i;
                axisY = y0 + plusY * i + 0.5;
                axisZ = z0 + plusZ + radius;
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                // creates step
                var step;
                if(i%2 == 0){
                    vector = new THREE.Vector3(axisX-1, axisY+1.2, axisZ-4).applyAxisAngle(axis, angle * i * Math.PI / 180)
                    const shapeGeometry = new THREE.ExtrudeGeometry(drawShape(8,4.5), extrudeSettings);
                    const stepMesh = new THREE.MeshLambertMaterial({color: 0x654321});
                    step = new THREE.Mesh(shapeGeometry,stepMesh);
                    step.position.set(vector.x, vector.y, vector.z);
                    step.rotateX(90 * Math.PI / 180);
                    step.rotateZ((90 - (angle * i)) * Math.PI / 180);
                }
                else{
                    vector = new THREE.Vector3(axisX-1, axisY+1.2, axisZ-4).applyAxisAngle(axis, angle * i * Math.PI / 180)
                    const shapeGeometry = new THREE.ExtrudeGeometry(drawShape(8,4.5), extrudeSettings);
                    const stepMesh = new THREE.MeshLambertMaterial({color: 0x654321});
                    step = new THREE.Mesh(shapeGeometry,stepMesh);
                    step.position.set(vector.x, vector.y-1, vector.z);
                    step.rotateX(-90 * Math.PI / 180);
                    step.rotateZ((90 + (angle * i)) * Math.PI / 180);
                }
                step.castShadow = true;
                step.receiveShadow = true;
                groupSupport.add(step);

                // third point of rod
                axisX = x0 + plusX * i;
                axisY = y0 + plusY * i + 7;
                axisZ = z0 + plusZ + radius;
                points.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                // connect all third point to make a handrail
                handrail.push(new THREE.Vector3(axisX, axisY, axisZ).applyAxisAngle(axis, angle * i * Math.PI / 180));

                var cylinderMesh = generatePoints(points,64,0.2,8,false);
                cylinderMesh.castShadow = true;
                groupSupport.add(cylinderMesh);
            }
            var handleMesh = generatePoints(handrail,64,0.4,12,false);

            groupSupport.add(handleMesh);
            return groupSupport;
        }
    
        scene.add(createStaircase(controls.numberOfStairs, controls.angle, controls.radius, 1, 1, 1));

        function render() {
            stats.update();
 
            renderer.render( scene, camera );
            requestAnimationFrame( render );
            control.update(); 
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