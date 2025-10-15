import  { Frustum, ObjectFrustumRelation, Vec3 } from "./math.js";
import { SceneObject } from "./object.js";

export class Camera extends SceneObject {
    private frustum = new Frustum(SceneObject.d);

    constructor(translate: Vec3, rotation: Vec3, scale: Vec3) {
        super(translate, rotation, scale, 0, 0)
    }

    public renderObject(data: ImageDataArray, camera: Camera): void {
        console.log("camera does not get rendered")
    }

    public isSphereInsideFrustum(sphere: {center: Vec3, radius: number}) : ObjectFrustumRelation {
        return this.frustum.getSphereFrustumRelation(sphere); 
    }
}