/// <reference path="three.min.js" />
/// <reference path="OrbitControls.js" />
/// <reference path="progressbar.min.js" />
/// <reference path="w2ui-1.4.2.min.js />

var container;
var camera, controls, scene, renderer, currCam;
var sceneBB, box;
var selectable = [];
var cameras = [];
var flag = 0;
var ui = true;

detect();

function detect() {

    if (Detector.webgl) {

        window.onload = function () {
            init();
            animate();
        };

    } else {
        var warning = Detector.getWebGLErrorMessage();
        var warningElement = document.getElementById('container');
        if (warningElement === null) {
            warningElement = document.createElement('div');
            warningElement.id = 'container';
            document.body.insertBefore(warningElement, window.document.getElementById('footer'));
        }
        warningElement.appendChild(warning);
    }
}

function init() {

    var contentElem = window.document.getElementById('content');
    if (contentElem === null) //no UI mode
    {
        ui = false;
        contentElem = document.createElement('div');
        contentElem.id = 'content';
        document.body.insertBefore(contentElem, window.document.getElementById('footer'));
    }

    //Progress Bar
    var loaderElem = document.createElement('div');
    loaderElem.id = 'loader';
    container = document.createElement('div');
    container.id = "container";
    var circle = new ProgressBar.Circle(container, {
        color: '#000000',
        text: {
            value: '0'
        },
        step: function (state, bar) {
            bar.setText((bar.value() * 100).toFixed(0));
        }
    });

    loaderElem.appendChild(container);
    document.body.appendChild(loaderElem);
    loaderElem.style.display = "block";

    //camera

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 100;
    camera.position.y = 100;

    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //controls
    controls = new THREE.OrbitControls(camera);
    controls.damping = 0.2;

    //scene
    scene = new THREE.Scene();

    //load assets
    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {

        console.log(item, loaded, total);

    };

    var loader = new THREE.ObjectLoader(manager);

    loader.load(
		// resource URL coming from other file
		'data/data.json',
		// Function when resource is loaded
		function (result) {
		    scene = result;
		    processScene(scene);

		},
		// Function called when download progresses
		function (xhr) {
		    //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );

		    if ((xhr.loaded / xhr.total) < 1) {
		        circle.set(xhr.loaded / xhr.total);
		    }

		    if ((xhr.loaded / xhr.total) == 1) {
		        circle.destroy();

		        container.outerHTML = "";
		        delete container;
		        loaderElem.style.display = "none";

		    }
		},
		// Function called when download errors
		function (xhr) {
		    console.log('An error happened');
		});

    //render
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0xffffff, 1);

    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    contentElem.appendChild(renderer.domElement);

    //events
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('layerOff', onLayerOff);
    window.addEventListener('layerOn', onLayerOn);
    window.addEventListener('viewChange', onViewChange);
    window.addEventListener('viewCapture', onCaptureView);
    window.addEventListener('zoomExtents', onZoomExtent);
    window.addEventListener('zoomSelected', onZoomSelected);

    contentElem.addEventListener('mousedown', function () {
        flag = 0;
    }, false);
    contentElem.addEventListener('mousemove', function () {
        flag = 1;
    }, false);
    contentElem.addEventListener('mouseup', function (e) {
        if (flag === 0) {
            console.log("click");
            onClick(e);
        } else if (flag === 1) {
            console.log("drag");
        }
    }, false);

    render();
}

function processScene(scene) {

    sceneBB = new THREE.Geometry(); //for computing the scene BB

    for (i = 0; i < scene.children.length; i++) {

        switch (scene.children[i].type) {
            case "Line":

                sceneBB.merge(scene.children[i].geometry);
                selectable.push(scene.children[i]);
                addLayer(scene.children[i]);

                break;

            case "Points":
            case "PointCloud":

                selectable.push(scene.children[i]);
                addLayer(scene.children[i]);

                break;

            case "Mesh":

                sceneBB.merge(scene.children[i].geometry);
                selectable.push(scene.children[i]);
                addLayer(scene.children[i]);

                break;

            case "DirectionalLight":

                scene.children[i].castShadow = true;
                //scene.children[i].shadowCameraVisible = true;

                scene.children[i].shadowMapWidth = 4096;
                scene.children[i].shadowMapHeight = 4096;

                sceneBB.computeBoundingSphere();

                var d = sceneBB.boundingSphere.radius;

                scene.children[i].shadowCameraLeft = -d;
                scene.children[i].shadowCameraRight = d;
                scene.children[i].shadowCameraTop = d;
                scene.children[i].shadowCameraBottom = -d;

                scene.children[i].shadowCameraNear = 10;
                scene.children[i].shadowCameraFar = d * 2;

                scene.children[i].shadowDarkness = 0.2;
                scene.children[i].shadowBias = -0.00001;
                scene.children[i].intensity = 0.7;

                break;

            case "SpotLight":
                scene.children[i].castShadow = true;
                //also need to add spotlight parameters

                break;

            case "PerspectiveCamera":

                cameras.push(scene.children[i]);

                //add to views

                var divID = scene.children[i].name.split(' ').join('_');

                if (!document.getElementById(divID)) {

                    var data = {
                        detail: {
                            viewName: scene.children[i].name,
                            viewID: divID
                        }
                    };

                    window.dispatchEvent(new CustomEvent('add-view', data));
                }

                break;

            case "Group":

                selectable.push(scene.children[i]);
                addLayer(scene.children[i]);

                var gBBox = new THREE.BoundingBoxHelper(scene.children[i], 0x888888);
                gBBox.update();
                sceneBB.mergeMesh(gBBox);

                break;

            default:

                break;
        }
    }

    var light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);

    //point lights
    sceneBB.computeBoundingSphere();
    var bbcenter = sceneBB.boundingSphere.center;
    var bbradius = sceneBB.boundingSphere.radius * 2;

    var plightE = new THREE.PointLight(0x666666, 0.33, 0);
    plightE.position.set(bbcenter.x + bbradius, bbcenter.y, bbcenter.z);
    scene.add(plightE);

    var plightS = new THREE.PointLight(0x666666, 0.33, 0);
    plightS.position.set(bbcenter.x, bbcenter.y - bbradius, bbcenter.z);
    scene.add(plightS);

    var plightW = new THREE.PointLight(0x666666, 0.33, 0);
    plightW.position.set(bbcenter.x - bbradius, bbcenter.y, bbcenter.z);
    scene.add(plightW);

    var plightN = new THREE.PointLight(0x666666, 0.33, 0);
    plightN.position.set(bbcenter.x, bbcenter.y + bbradius, bbcenter.z);
    scene.add(plightN);

    var plightT = new THREE.PointLight(0x666666, 1, 0);
    plightT.position.set(bbcenter.x, bbcenter.y, bbcenter.z + bbradius);
    scene.add(plightT);

    var plightB = new THREE.PointLight(0x666666, 0.66, 0);
    plightB.position.set(bbcenter.x, bbcenter.y, bbcenter.z - bbradius);
    scene.add(plightB);

    //deal with cameras and controls

    camera = new THREE.PerspectiveCamera(cameras[cameras.length - 1].fov, window.innerWidth / window.innerHeight, cameras[cameras.length - 1].near, cameras[cameras.length - 1].far);
    camera.position.copy(cameras[cameras.length - 1].position);
    camera.rotation.copy(cameras[cameras.length - 1].rotation);
    camera.up = new THREE.Vector3(0, 0, 1);

    controls.object = camera;
    controls.target.set(cameras[cameras.length - 1].userData[0].tX, cameras[cameras.length - 1].userData[0].tY, cameras[cameras.length - 1].userData[0].tZ);

    currCam = cameras[cameras.length - 1].name;

    processLayers(scene.userData[1]);

    var report = new Function("num", scene.userData[0].ga)();
    report(scene.children.length);

    onZoomExtent();
}

function processLayers(layerInfo) {

    for (var key in layerInfo) {
        var divID = key.split(' ').join('_');
        if (!layerInfo[key]) {
            var data = {
                detail: {
                    layer: key,
                    state: layerInfo[key],
                    'divID': divID
                }
            };
            window.dispatchEvent(new CustomEvent('layerOff', data));

            if (ui)
                w2ui[divID].onSetState(data);

        }
    }

}

function addLayer(child) {

    var divID = child.userData[0].Layer.split(' ').join('_');

    if (!document.getElementById(divID)) {

        var data = {
            detail: {
                layer: child.userData[0].Layer
            }
        };

        window.dispatchEvent(new CustomEvent('add-layer', data));
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}

function onLayerOff(event)
{

    for (var i = 0; i < scene.children.length; i++) {

        if (scene.children[i].userData[0] !== undefined && event.detail.layer == scene.children[i].userData[0].Layer) {

            scene.children[i].visible = false;

            if (scene.children[i].userData[0].Selected) {

                scene.remove(scene.getObjectById(scene.children[i].userData[0].BBoxId));
                scene.children[i].userData[0].Selected = false;
                scene.children[i].userData[0].BBoxId = null;

            }
        }
    }
}

function onLayerOn(event) {

    for (var i = 0; i < scene.children.length; i++) {

        if (scene.children[i].userData[0] !== undefined && event.detail.layer == scene.children[i].userData[0].Layer) {

            scene.children[i].visible = true;

        }
    }
}

function onCaptureView(event) {

    var imgData, imgNode;

    try {
        imgData = renderer.domElement.toDataURL("image/png");
        imgNode = window.open(imgData, "_blank");
        imgNode.focus();
        console.log(imgData);
    } catch (e) {
        console.log("Browser does not support taking screenshot of 3d context");
        return;
    }

}

function onViewChange(event) {

    var cam = scene.getObjectByName(event.detail.view);
    controls.object.position.set(cam.position.x, cam.position.y, cam.position.z);
    controls.target.set(cam.userData[0].tX, cam.userData[0].tY, cam.userData[0].tZ);
}

function onZoomExtent(event) {

    var boundingSphere = sceneBB.boundingSphere;
    var center = boundingSphere.center;
    var radius = boundingSphere.radius;
    var offset = radius / Math.tan(Math.PI / 180.0 * controls.object.fov * 0.5);
    var vector = new THREE.Vector3(0, 0, 1);
    var viewDir = vector.applyQuaternion(controls.object.quaternion);
    var viewPos = new THREE.Vector3();
    viewDir.multiplyScalar(offset * 1.25);
    viewPos.addVectors(center, viewDir);
    controls.object.position.set(viewPos.x, viewPos.y, viewPos.z);
    controls.target.set(center.x, center.y, center.z);

}

function onZoomSelected(event) {

    var selectedBB = new THREE.Geometry();
    var cntSelected = 0;
    for (i = 0; i < scene.children.length; i++) {
        if (scene.children[i].userData[0] !== undefined && scene.children[i].userData[0].Selected === true) {

            var selBBox = new THREE.BoundingBoxHelper(scene.children[i], 0x888888);
            selBBox.update();
            selectedBB.mergeMesh(selBBox);

            cntSelected++;
        }
    }

    if (cntSelected === 0) return;

    selectedBB.computeBoundingSphere();

    var boundingSphere = selectedBB.boundingSphere;
    var center = boundingSphere.center;
    var radius = boundingSphere.radius;
    var offset = radius / Math.tan(Math.PI / 180.0 * controls.object.fov * 0.5);
    var vector = new THREE.Vector3(0, 0, 1);
    var viewDir = vector.applyQuaternion(controls.object.quaternion);
    var viewPos = new THREE.Vector3();
    viewDir.multiplyScalar(offset * 1.25);
    viewPos.addVectors(center, viewDir);
    controls.object.position.set(viewPos.x, viewPos.y, viewPos.z);
    controls.target.set(center.x, center.y, center.z);
}

function onClick(event) {

    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);

    vector.unproject(camera);

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects(selectable, true);

    if (intersects.length > 0) {

        console.log(intersects[0]);

        var tmpElement = null;

        if (intersects[0].object.parent.type == "Group") {

            //find last parent
            tmpElement = getSceneParent(intersects[0].object);

        } else {

            tmpElement = intersects[0].object;
        }

        if (tmpElement.userData[0].Selected === true) {

            //delesect
            scene.remove(scene.getObjectById(tmpElement.userData[0].BBoxId));
            tmpElement.userData[0].Selected = false;
            tmpElement.userData[0].BBoxId = null;

        } else {

            //select
            var bbox = new THREE.BoxHelper(tmpElement);
            tmpElement.userData[0].BBoxId = bbox.id;
            tmpElement.userData[0].Selected = true;
            scene.add(bbox);

        }

    } else {
        //deselect all
        for (var s = 0; s < selectable.length; s++) {
            if (selectable[s].userData[0].Selected === true) {
                scene.remove(scene.getObjectById(selectable[s].userData[0].BBoxId));
                selectable[s].userData[0].Selected = false;
                selectable[s].userData[0].BBoxId = null;
            }
        }
    }
}

function getSceneParent(obj) {
    if (obj.parent.type != 'Scene') {
        return getSceneParent(obj.parent);
    } else {
        return obj;
    }
}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {

    renderer.render(scene, camera);

}
