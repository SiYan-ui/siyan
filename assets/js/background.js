(function () {
    "use strict";

    const canvas = document.getElementById("stars");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const TAU = Math.PI * 2;
    const FOUR_D_DISTANCE = 8;
    const CAMERA_DISTANCE = 12;
    const palette = [
        [68, 181, 253],
        [193, 60, 60],
        [193, 60, 193],
        [60, 60, 193],
        [60, 193, 193],
        [60, 193, 60],
        [193, 193, 60]
    ];

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const geometries = {
        cube: createCube(),
        pyramid: createPyramid(),
        sphere: createSphere(7, 12)
    };

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let objects = [];
    let animationFrame = 0;
    let previousTime = 0;

    function createCube() {
        const vertices = [];
        const edges = [];

        for (let i = 0; i < 8; i += 1) {
            vertices.push([
                i & 1 ? 1 : -1,
                i & 2 ? 1 : -1,
                i & 4 ? 1 : -1,
                0
            ]);
        }

        for (let i = 0; i < vertices.length; i += 1) {
            for (let axis = 0; axis < 3; axis += 1) {
                const neighbor = i ^ (1 << axis);
                if (i < neighbor) edges.push([i, neighbor]);
            }
        }

        return { vertices, edges };
    }

    function createPyramid() {
        return {
            vertices: [
                [-1, -0.8, -1, 0],
                [1, -0.8, -1, 0],
                [1, -0.8, 1, 0],
                [-1, -0.8, 1, 0],
                [0, 1.25, 0, 0]
            ],
            edges: [
                [0, 1], [1, 2], [2, 3], [3, 0],
                [0, 4], [1, 4], [2, 4], [3, 4]
            ]
        };
    }

    function createSphere(latitudeBands, longitudeBands) {
        const vertices = [];
        const edges = [];

        for (let latitude = 0; latitude <= latitudeBands; latitude += 1) {
            const polar = Math.PI * latitude / latitudeBands - Math.PI / 2;
            const ringRadius = Math.cos(polar);
            const y = Math.sin(polar);

            for (let longitude = 0; longitude < longitudeBands; longitude += 1) {
                const azimuth = TAU * longitude / longitudeBands;
                vertices.push([
                    ringRadius * Math.cos(azimuth),
                    y,
                    ringRadius * Math.sin(azimuth),
                    0
                ]);

                const current = latitude * longitudeBands + longitude;
                const nextLongitude = latitude * longitudeBands + (longitude + 1) % longitudeBands;
                edges.push([current, nextLongitude]);

                if (latitude < latitudeBands) {
                    edges.push([current, current + longitudeBands]);
                }
            }
        }

        return { vertices, edges };
    }

    function randomBetween(minimum, maximum) {
        return minimum + Math.random() * (maximum - minimum);
    }

    function createObject(index, count) {
        const types = ["cube", "pyramid", "sphere"];
        const type = types[index % types.length];
        const columnCount = Math.ceil(Math.sqrt(count * 1.7));
        const rowCount = Math.ceil(count / columnCount);
        const column = index % columnCount;
        const row = Math.floor(index / columnCount);
        const horizontalSpan = 13.6 * Math.max(1, width / Math.max(1, height));

        return {
            geometry: geometries[type],
            type,
            base: [
                (column / Math.max(1, columnCount - 1) - 0.5) * horizontalSpan + randomBetween(-0.75, 0.75),
                (row / Math.max(1, rowCount - 1) - 0.5) * 9.2 + randomBetween(-0.6, 0.6),
                randomBetween(1, 9),
                randomBetween(-2.4, 2.4)
            ],
            scale: randomBetween(type === "sphere" ? 0.34 : 0.4, type === "sphere" ? 0.72 : 0.9),
            color: palette[index % palette.length],
            phase: randomBetween(0, TAU),
            drift: randomBetween(0.08, 0.2),
            rotation: Array.from({ length: 6 }, () => randomBetween(0, TAU)),
            velocity: Array.from({ length: 6 }, (_, plane) => {
                const direction = (index + plane) % 2 ? 1 : -1;
                return direction * randomBetween(0.08, plane > 2 ? 0.2 : 0.34);
            })
        };
    }

    function resetScene() {
        const area = width * height;
        const count = Math.max(24, Math.min(42, Math.round(area / 43000)));
        objects = Array.from({ length: count }, (_, index) => createObject(index, count));
    }

    function resize() {
        const nextWidth = window.innerWidth;
        const nextHeight = window.innerHeight;
        const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

        if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return;

        width = nextWidth;
        height = nextHeight;
        pixelRatio = nextPixelRatio;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        resetScene();
    }

    function rotatePlane(point, firstAxis, secondAxis, angle) {
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const first = point[firstAxis];
        const second = point[secondAxis];
        point[firstAxis] = first * cosine - second * sine;
        point[secondAxis] = first * sine + second * cosine;
    }

    function transformVertex(vertex, object, time) {
        const point = vertex.map((coordinate) => coordinate * object.scale);
        const rotationPlanes = [
            [0, 1], [0, 2], [1, 2],
            [0, 3], [1, 3], [2, 3]
        ];

        for (let plane = 0; plane < rotationPlanes.length; plane += 1) {
            rotatePlane(
                point,
                rotationPlanes[plane][0],
                rotationPlanes[plane][1],
                object.rotation[plane] + time * object.velocity[plane]
            );
        }

        const orbit = time * object.drift + object.phase;
        point[0] += object.base[0] + Math.sin(orbit) * 0.45;
        point[1] += object.base[1] + Math.cos(orbit * 0.8) * 0.35;
        point[2] += object.base[2] + Math.sin(orbit * 0.55) * 0.7;
        point[3] += object.base[3];

        // A slow XW/YW rotation moves the complete scene through four-dimensional space.
        rotatePlane(point, 0, 3, Math.sin(time * 0.075) * 0.34);
        rotatePlane(point, 1, 3, Math.cos(time * 0.06) * 0.24);

        return point;
    }

    function project(point) {
        const fourScale = Math.max(0.42, Math.min(2.25, FOUR_D_DISTANCE / (FOUR_D_DISTANCE - point[3])));
        const x3 = point[0] * fourScale;
        const y3 = point[1] * fourScale;
        const z3 = point[2] * fourScale;
        const depth = CAMERA_DISTANCE + z3;
        const focalLength = Math.min(width, height) * 1.08;
        const threeScale = focalLength / Math.max(3.2, depth);

        return {
            x: width / 2 + (x3 + pointer.x * (0.8 + z3 * 0.035)) * threeScale,
            y: height / 2 + (y3 + pointer.y * (0.55 + z3 * 0.025)) * threeScale,
            depth,
            fourScale
        };
    }

    function drawObject(object, time, darkMode) {
        const points = object.geometry.vertices.map((vertex) => project(transformVertex(vertex, object, time)));
        const averageDepth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
        const depthFade = Math.max(0.22, Math.min(0.72, 1.04 - averageDepth / 28));
        const alpha = depthFade * (darkMode ? 0.72 : 0.55);
        const [red, green, blue] = object.color;

        context.beginPath();
        for (const edge of object.geometry.edges) {
            const start = points[edge[0]];
            const end = points[edge[1]];
            if (start.depth <= 3 || end.depth <= 3) continue;
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
        }

        context.lineWidth = object.type === "sphere" ? 0.65 : 0.9;
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        context.stroke();

        if (object.type !== "sphere") {
            context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.72})`;
            for (const point of points) {
                const radius = Math.max(0.55, Math.min(1.25, point.fourScale));
                context.beginPath();
                context.arc(point.x, point.y, radius, 0, TAU);
                context.fill();
            }
        }

        return averageDepth;
    }

    function render(timestamp) {
        resize();
        const elapsed = reducedMotion.matches ? 0 : timestamp / 1000;
        const delta = previousTime ? Math.min(32, timestamp - previousTime) : 16;
        previousTime = timestamp;

        pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 0.0035);
        pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 0.0035);

        context.clearRect(0, 0, width, height);
        context.lineCap = "round";
        context.lineJoin = "round";

        const darkMode = document.body.classList.contains("dark-theme");
        const orderedObjects = objects.slice().sort((first, second) => second.base[2] - first.base[2]);
        for (const object of orderedObjects) drawObject(object, elapsed, darkMode);

        if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(render);
    }

    function start() {
        window.cancelAnimationFrame(animationFrame);
        previousTime = 0;
        animationFrame = window.requestAnimationFrame(render);
    }

    function updatePointer(event) {
        pointer.targetX = (event.clientX / Math.max(1, width) - 0.5) * 0.75;
        pointer.targetY = (event.clientY / Math.max(1, height) - 0.5) * 0.55;
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            window.cancelAnimationFrame(animationFrame);
        } else {
            start();
        }
    });
    reducedMotion.addEventListener("change", start);

    resize();
    start();
}());
