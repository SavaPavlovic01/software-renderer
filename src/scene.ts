import { Camera } from "./camera.js";
import { clearScreen } from "./drawPrimitives.js";
import { Vec3 } from "./math.js";
import type { SceneObject } from "./object.js";

export class Scene {
    private objects: SceneObject[] = []
    private camera: Camera
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D 
    private data: ImageDataArray
    private imageData: ImageData
    private zBuffer: number[] = [];

    private initCanvas() {
        this.ctx.imageSmoothingEnabled = false;
        const dpr = window.devicePixelRatio || 1;
        const size = 600 * dpr;
        this.canvas.width =  size
        this.canvas.height = size
        this.canvas.style.width = size.toString();
        this.canvas.style.height = size.toString();
    }

    constructor(canvas: HTMLCanvasElement, camera: Camera = new Camera(new Vec3(0, 0, 0), new Vec3(0 ,0, 0), new Vec3(0, 0, 0))) {
        this.camera = camera
        this.canvas = canvas
        const context =  this.canvas.getContext("2d")
        if(context == null) {
            throw new Error("Cant get canvas context") 
        }
        this.ctx = context;

        this.initCanvas()

        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height)
        this.data = this.imageData.data

        this.zBuffer = Array(this.data.length / 4).fill(Number.MAX_VALUE);
    }

    public addObject(object :SceneObject) {
        this.objects.push(object);
    }

    public renderScene() {
        clearScreen(this.data); 
        this.objects.forEach((object) => {
            object.renderObject(this.data, this.camera)
        })

        this.ctx.putImageData(this.imageData, 0, 0)
    }
}