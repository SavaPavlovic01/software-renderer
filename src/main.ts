import { Camera } from "./camera.js"
import { Cube } from "./cube.js"
import { Mat, Vec3, Point } from "./math.js"
import { Scene } from "./scene.js"

const viewPortToCanvas = (point: Point, canvasW: number, canvasH:number, viewPortW:number, viewPortH: number) : Point => {
    return new Point(Math.round(point.x * canvasW / viewPortW + canvasW / 2), Math.round(-point.y * canvasH / viewPortH + canvasH / 2))
}

const projectVertex = (point: Vec3, d: number, cw: number, ch: number, vw: number, vh: number) : Point => {
    const p =  new Point(point.r * d / point.b, point.g * d / point.b)
    return viewPortToCanvas(p, cw, ch, vw, vh)
} 

window.onload = () => {

    const canvas = document.getElementById("screen") as HTMLCanvasElement
    const scene = new Scene(canvas)

    const cubePos = new Vec3(-1.5, 0, 10)
    const cubeRotation = new Vec3(0, 0, 0);
    const cubeScale = new Vec3(2, 2, 2)

    const cube = new Cube(cubePos, cubeRotation, cubeScale, canvas.width, canvas.height)
    //const cube2 = new Cube(cubePos.add(new Vec3(3, 0, 0)), cubeRotation, cubeScale, canvas.width, canvas.height)

    scene.addObject(cube);
    //scene.addObject(cube2);
    scene.renderScene();

}
