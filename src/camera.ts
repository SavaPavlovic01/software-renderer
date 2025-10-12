import  { Vec3 } from "./math.js";
import { SceneObject } from "./object.js";

export class Camera extends SceneObject {

    constructor(translate: Vec3, rotation: Vec3, scale: Vec3) {
        super(translate, rotation, scale, 0, 0)
    }

    public renderObject(data: ImageDataArray, camera: Camera): void {
        console.log("camera does not get rendered")
    }
}