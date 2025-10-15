import type { Camera } from "./camera.js"
import { drawTriangle } from "./drawPrimitives.js"
import { Mat, ObjectFrustumRelation, Vec3 } from "./math.js"

export abstract class SceneObject {
    protected vertices: Vec3[] = []
    protected triangles: Vec3[] = []
    protected color: Vec3[] = []

    private translate: Vec3
    private rotation: Vec3
    private scale: Vec3

    private modelMatrix: Mat = new Mat(4, 4)
    private projectionMatrix: Mat = new Mat(4, 4)

    protected static d = 1;
    private static vw = 2;
    private static vh = 2;

    private cw: number
    private ch: number

    constructor(translate: Vec3, rotation: Vec3, scale: Vec3, cw: number, ch: number) {
        this.translate = translate;
        this.rotation = rotation;
        this.scale = scale;
        this.cw = cw;
        this.ch = ch

        const projectionMatrix = Mat.makeProjectionMatrix(SceneObject.d);
        const viewportToCanvasMatrix = Mat.makeViewportToCanvasMatrix(cw, this.ch, SceneObject.vw, SceneObject.vh, SceneObject.d)
        this.projectionMatrix = viewportToCanvasMatrix.mult(projectionMatrix);
        
        this.updateModelMatrix();
    }

    private updateModelMatrix() {
        const tranlationMatrix = Mat.makeTranslationMatrix(this.translate);

        const rotateX = Mat.rotateX(this.rotation.r);
        const rotateY = Mat.rotateY(this.rotation.g);
        const rotateZ = Mat.rotateZ(this.rotation.b);
        const rotationMatrix = rotateZ.mult(rotateY).mult(rotateX);

        const scaleMatrix = Mat.makeScaleMatrix(this.scale); 

        this.modelMatrix = tranlationMatrix.mult(rotationMatrix).mult(scaleMatrix);
    }

    public setTranslate(translate: Vec3) {
        this.translate = translate;
        this.updateModelMatrix();
    }

    public setRotate(rotate: Vec3) {
        this.rotation = rotate;
        this.updateModelMatrix();
    }

    public setScale(scale: Vec3) {
        this.scale = scale
        this.updateModelMatrix();
    }

    private toCameraSpace(p0: Mat, p1: Mat, p2: Mat, viewMatrix: Mat) : [Mat, Mat, Mat] {
        return [viewMatrix.mult(p0), viewMatrix.mult(p1), viewMatrix.mult(p2)]
    }

    private isInsideClippingSpace(viewMatrix: Mat, camera: Camera): ObjectFrustumRelation {
        const sphereInModelSpace = this.getBoundingSphere()
        const sphereCenterViewSpace = viewMatrix.mult(sphereInModelSpace.center.toMat());
        const radiusScale = Math.max(Math.max(this.scale.r, this.scale.g), this.scale.b);
        return camera.isSphereInsideFrustum({center: sphereCenterViewSpace.toVec3(), radius: sphereInModelSpace.radius * radiusScale}) 
    }

    public renderObject(data: ImageDataArray, camera: Camera): void {
        const viewMatrix = Mat.cameraMatrix(camera.translate, camera.rotation).mult(this.modelMatrix);
        const completeMatrix = this.projectionMatrix.mult(viewMatrix);

        const state  = this.isInsideClippingSpace(viewMatrix, camera); 
        if(state === ObjectFrustumRelation.OUTSIDE) {
            console.log("SKIPPING RENDERING OUTSIDE OF FRUSTUM")
            return
        }

        if(state === ObjectFrustumRelation.CUTS) {
            console.log("IT CUTS NOT YET IMPLEMENTED")
        }

        this.triangles.forEach( (v, i) => {

            const p0 = this.vertices[v.r]?.toMat();
            const p1 = this.vertices[v.g]?.toMat();
            const p2 = this.vertices[v.b]?.toMat();

            if(p0 == undefined || p1 == undefined || p2 == undefined) {
                console.log("UNEXPETCED");
                return
            }

            const p0Canvas = completeMatrix.mult(p0);
            const p1Canvas = completeMatrix.mult(p1)
            const p2Canvas = completeMatrix.mult(p2)

            console.log(p0Canvas, p1Canvas, p2Canvas)
            
            const triangleColor = this.color[i] ?? new Vec3(0, 0, 0)
            const final0 = p0Canvas.toPoint();
            const final1 = p1Canvas.toPoint();
            const final2 = p2Canvas.toPoint();

            drawTriangle(final0, final1, final2, triangleColor, data, this.cw);
        })        
    }

    public getBoundingSphere() : {center: Vec3, radius: number} {
        let center = new Vec3();
        this.vertices.forEach((v) => {
            center.add(v);
        })

        center = center.div(this.vertices.length);
        let radius: number = 0
        this.vertices.forEach((v) => {
            const curDist = v.dist(center);
            if(curDist > radius) {
                radius = curDist
            }
        })

        return {center: center, radius: radius}

    }
}