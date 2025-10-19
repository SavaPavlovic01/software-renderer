import  { Vec3 } from "./math.js";
import { SceneObject } from "./object.js";

export class TriangleObject extends SceneObject {

    constructor(worldPos: Vec3, rotation: Vec3, scale: Vec3, cw: number, ch: number, color: Vec3 = new Vec3(255, 0, 0)) {
        super(worldPos, rotation, scale, cw, ch);

        const red = new Vec3(255, 0, 0);

        this.vertices =  [new Vec3(0, 1, 0), new Vec3(1, 0, 0), new Vec3(-1, 0, 0)];
        this.triangles = [new Vec3(0, 1, 2)];

        this.color = [color];
    }
}