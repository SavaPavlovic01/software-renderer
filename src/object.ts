import type { Camera } from "./camera.js"
import { drawTriangle } from "./drawPrimitives.js"
import { ClippingPlane, Mat, ObjectFrustumRelation, Triangle, Vec3 } from "./math.js"

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

    private isInsideClippingSpace(viewMatrix: Mat, camera: Camera): {relation: ObjectFrustumRelation, cutPlanes: ClippingPlane[]} {
        const sphereInModelSpace = this.getBoundingSphere()
        const sphereCenterViewSpace = viewMatrix.mult(sphereInModelSpace.center.toMat());
        const radiusScale = Math.max(Math.max(this.scale.r, this.scale.g), this.scale.b);
        return camera.isSphereInsideFrustum({center: sphereCenterViewSpace.toVec3(), radius: sphereInModelSpace.radius * radiusScale}) 
    }

    // null means that we are not clipping the triangle
    private clipTriangle(p0: Vec3, p1: Vec3, p2: Vec3, plane: ClippingPlane): Triangle[] | null {
        const pointsInside: Vec3[] = [];
        const pointsOutside: Vec3[] = [];

        const linePlaneRelation = (point: Vec3) => {
            if (plane.distFromPoint(point) < 0) {
                pointsOutside.push(point);
            } else {
                pointsInside.push(point);
            }
        }

        linePlaneRelation(p0);
        linePlaneRelation(p1);
        linePlaneRelation(p2);

        if(pointsInside.length == 3) return [new Triangle(p0, p1, p2)];
        if(pointsOutside.length == 3) return [];
        if(pointsInside.length == 2) {
            const intersectionPoint1 = plane.intersectsLine(pointsOutside[0]!, pointsInside[0]!);
            if(intersectionPoint1 == null) return null
            const intersectionPoint2 = plane.intersectsLine(pointsOutside[0]!, pointsInside[1]!);
            if(intersectionPoint2 == null) return null

            return [ 
                new Triangle(pointsInside[0]!, pointsInside[1]!, intersectionPoint1),
                new Triangle(pointsInside[1]!, intersectionPoint2, intersectionPoint1)
            ];
        } else {
            // one point is inside, 2 outside
            const intersectionPoint1 = plane.intersectsLine(pointsInside[0]!, pointsOutside[0]!);
            if(intersectionPoint1 == null) return null
            const intersectionPoint2 = plane.intersectsLine(pointsInside[0]!, pointsOutside[1]!);
            if(intersectionPoint2 == null) return null;

            return [ new Triangle(pointsInside[0]!, intersectionPoint1, intersectionPoint2)];
        }
    }

    private clipTriangleAgainstMultiplePlanes(p0: Vec3, p1: Vec3, p2: Vec3, planes: ClippingPlane[]) : Triangle[] {
        const triangles: Triangle[] = [new Triangle(p0, p1, p2)];
        for(const plane of planes) {
            for(let i = 0; i < triangles.length; i++) {
                const triangle = triangles[i]!;
                const newTriangles = this.clipTriangle(triangle.points[0]!, triangle.points[1]!, triangle.points[2]!, plane)
                if(newTriangles == null) continue;
                if(newTriangles.length == 1) triangles[i] = newTriangles[0]!;
                if(newTriangles.length == 2) {
                    triangles[i] = newTriangles[0]!;
                    triangles.push(newTriangles[1]!);
                }
            } 
        }
        return triangles
    }

    public renderObject(data: ImageDataArray, camera: Camera): void {
        const viewMatrix = Mat.cameraMatrix(camera.translate, camera.rotation).mult(this.modelMatrix);

        const state= this.isInsideClippingSpace(viewMatrix, camera); 
        
        if(state.relation === ObjectFrustumRelation.OUTSIDE) {
            console.log("SKIPPING RENDERING OUTSIDE OF FRUSTUM")
            return
        }

        if(state.relation === ObjectFrustumRelation.CUTS) {
            console.log("IT CUTS")
        }

        this.triangles.forEach( (v, i) => {

            const p0 = this.vertices[v.r]?.toMat();
            const p1 = this.vertices[v.g]?.toMat();
            const p2 = this.vertices[v.b]?.toMat();

            if(p0 == undefined || p1 == undefined || p2 == undefined) {
                console.log("UNEXPETCED");
                return
            }

            const pointInCameraSpace = this.toCameraSpace(p0, p1, p2, viewMatrix);
            let triangles: Triangle[] | null = [];
            if(state.relation == ObjectFrustumRelation.CUTS) {
                triangles = this.clipTriangleAgainstMultiplePlanes(pointInCameraSpace[0]!.toVec3(),pointInCameraSpace[1]!.toVec3(),pointInCameraSpace[2]!.toVec3(), state.cutPlanes)
                //triangles = this.clipTriangle(pointInCameraSpace[0]!.toVec3(),pointInCameraSpace[1]!.toVec3(),pointInCameraSpace[2]!.toVec3(), state.cutPlanes[0]!)
            } else {
                triangles = [new Triangle(pointInCameraSpace[0]!.toVec3(),
                    pointInCameraSpace[1]!.toVec3(), pointInCameraSpace[2]!.toVec3())]
            }

            const triangleColor = this.color[i] ?? new Vec3(0, 0, 0)
            if(triangles == null) {
                console.log("SOME FUCK SHIT");
                return;
            }
            for(const triangle of triangles){
                const p0Canvas = this.projectionMatrix.mult(triangle.points[0]!.toMat());
                const p1Canvas = this.projectionMatrix.mult(triangle.points[1]!.toMat());
                const p2Canvas = this.projectionMatrix.mult(triangle.points[2]!.toMat());

                drawTriangle(p0Canvas.toPoint(), p1Canvas.toPoint(), p2Canvas.toPoint(), triangleColor, data, this.cw);
            }

        })        
    }

    public move(x : number, y: number, z: number) {
        this.translate = this.translate.add(new Vec3(x, y, z));
        this.updateModelMatrix();
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