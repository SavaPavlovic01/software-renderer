import { Vec3, Mat, Point } from "./math.js";
import { SceneObject } from "./object.js";

export class Cube extends SceneObject {
    constructor(worldPos: Vec3, rotation: Vec3, scale: Vec3, cw: number, ch: number) {
        super(worldPos, rotation, scale, cw, ch)

        const red = new Vec3(255, 0, 0)
        this.vertices = [new Vec3(1,1,1), new Vec3(-1, 1, 1), new Vec3(-1, -1, 1), 
            new Vec3(1, -1, 1), new Vec3(1, 1, -1), new Vec3(-1, 1, -1), new Vec3(-1, -1, -1), new Vec3(1, -1, -1)
        ]

        this.triangles = [new Vec3(0, 1, 2), new Vec3(0, 2, 3), new Vec3(4, 0, 3), new Vec3(4, 3, 7), new Vec3(5, 4, 7), new Vec3(5, 7, 6), new Vec3(1, 5, 6),
            new Vec3(1, 6, 2), new Vec3(4, 5, 1,), new Vec3(4, 1, 0), new Vec3(2, 6, 7), new Vec3(2, 7, 3)
        ]

        this.color = Array(12).fill(red)
    } 
}
