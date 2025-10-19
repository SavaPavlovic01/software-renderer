import { Camera } from "./camera.js";
import { clearScreen, drawTriangle } from "./drawPrimitives.js";
import { Triangle, Vec3 } from "./math.js";
import type { SceneObject } from "./object.js";
import { TriangleObject } from "./TriangleObject.js";

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

        this.zBuffer = Array(this.data.length / 4).fill(0);
    }

    public addObject(object :SceneObject) {
        this.objects.push(object);
    }

    public renderScene() {
        clearScreen(this.data, this.zBuffer); 
        this.objects.forEach((object) => {
            object.renderObject(this.data, this.camera, this.zBuffer);
        })

        this.ctx.putImageData(this.imageData, 0, 0)
    }

    public test() : TriangleObject[] {
        const pos = new Vec3(0, 0, 5);
        const rotatin = new Vec3(0, 1, 0);
        const scale = new Vec3(2, 2, 2)

        const triangle1 = new TriangleObject(pos, rotatin, scale, this.canvas.width, this.canvas.height, new Vec3(255, 0, 0));
        const triangle2  = new TriangleObject(pos.add(new Vec3(0.2, 0.2, 10)), rotatin, scale, this.canvas.width, this.canvas.height, new Vec3(0, 255, 0));
        const triangle3 = new TriangleObject(pos.add(new Vec3(-0.2, -0.2, 15)), rotatin, scale, this.canvas.width, this.canvas.height, new Vec3(0,0, 255));

        //this.addObject(triangle2);
        this.addObject(triangle1);
        //this.addObject(triangle3);

        this.renderScene();
        return [triangle1, triangle2, triangle3];
    }

}