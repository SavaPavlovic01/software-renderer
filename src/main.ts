import { Camera } from "./camera.js"
import { Cube } from "./cube.js"
import { Mat, Vec3, Point } from "./math.js"
import { SceneObject } from "./object.js"
import { Scene } from "./scene.js"
import { TriangleObject } from "./TriangleObject.js"
import { ModelObject, ObjParser } from "./objParser.js"

const viewPortToCanvas = (point: Point, canvasW: number, canvasH:number, viewPortW:number, viewPortH: number) : Point => {
    return new Point(Math.round(point.x * canvasW / viewPortW + canvasW / 2), Math.round(-point.y * canvasH / viewPortH + canvasH / 2))
}

const projectVertex = (point: Vec3, d: number, cw: number, ch: number, vw: number, vh: number) : Point => {
    const p =  new Point(point.r * d / point.b, point.g * d / point.b)
    return viewPortToCanvas(p, cw, ch, vw, vh)
} 

// TODO: Try out clipping with all planes, right now near is tested and works
const makeObjectMoveCallback = (object : SceneObject, scene: Scene): (ev: KeyboardEvent) => void => {
    return (ev: KeyboardEvent) => {
        if(ev.key === 'a'){
            object.move(-0.25, 0, 0);
            scene.renderScene();
        }

        if(ev.key === 'd'){
            object.move(0.25, 0, 0);
            scene.renderScene();
        }
        
        if(ev.key === 'w'){
            object.move(0, 0.25, 0);
            scene.renderScene();
        }
        if(ev.key === 's'){
            object.move(0, -0.25, 0);
            scene.renderScene();
        }

        if(ev.key === 'q'){
            object.move(0, 0, -0.25);
            scene.renderScene();
        }
        if(ev.key === 'e'){
            object.move(0, 0, 0.25);
            scene.renderScene();
        }
    }
}

const main = (spin: boolean = true) => {    
    const canvas = document.getElementById("screen") as HTMLCanvasElement
    const scene = new Scene(canvas)

    const cubePos = new Vec3(-3, 0, 10)
    const cubeRotation = new Vec3(0, 0, 0);
    const cubeScale = new Vec3(0.5, 0.5, 0.5)

    //const cube = new Cube(cubePos, cubeRotation, cubeScale, canvas.width, canvas.height)
    //const triangle = new TriangleObject(cubePos.add(new Vec3(4, 0, -5)), cubeRotation, cubeScale, canvas.width, canvas.height);
    //const cube2 = new Cube(cubePos.add(new Vec3(3, 0, 0)), cubeRotation, cubeScale, canvas.width, canvas.height)

    const cube = new ModelObject(cubePos, cubeRotation, cubeScale, canvas.width, canvas.height);
    window.onkeydown = makeObjectMoveCallback(cube, scene);

    if(spin) {
        setInterval(() => {
            cube.rotate(0.1, 0.1, 0.1);
            scene.renderScene();
        }, 20);
    }

    scene.addObject(cube);
    //scene.addObject(triangle);
    //scene.addObject(cube2);
    scene.renderScene();
}

const test = () => {

    const canvas = document.getElementById("screen") as HTMLCanvasElement
    const scene = new Scene(canvas)
    const triangles = scene.test();
    window.onkeydown = makeObjectMoveCallback(triangles[0]!, scene);
}


window.onload = () => {
    main();
}
