import type { Camera } from "./camera.js"
import { DrawFilledTriangle, drawTriangle } from "./drawPrimitives.js"
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

    private toCameraSpaceFaster(p0: Vec3, p1: Vec3, p2: Vec3, viewMatrix: Mat) : [Mat, Mat, Mat] {
        return [viewMatrix.multWithVec(p0), viewMatrix.multWithVec(p1), viewMatrix.multWithVec(p2)]
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
            if(intersectionPoint1 == null)  return null
            const intersectionPoint2 = plane.intersectsLine(pointsInside[0]!, pointsOutside[1]!);
            if(intersectionPoint2 == null) return null;

            return [ new Triangle(pointsInside[0]!, intersectionPoint1, intersectionPoint2)];

        }
    }

    private clipTriangleAgainstMultiplePlanes(p0: Vec3, p1: Vec3, p2: Vec3, planes: ClippingPlane[]) : Triangle[] {
        let triangles: Triangle[] = [new Triangle(p0, p1, p2)];
        for(const plane of planes) {
            const newTriangles: Triangle[] = []
            for(let triangle of triangles) {
                const clipedTriangles = this.clipTriangle(triangle.points[0]!,triangle.points[1]!, triangle.points[2]!, plane )
                if(clipedTriangles == null) continue;
                newTriangles.push(...clipedTriangles);
            }

            triangles = newTriangles;
        }

        return triangles
    }

    private isBackFace(pointsInCameraSpace: [Vec3, Vec3, Vec3], camera: Camera) : boolean {
        const line1 = pointsInCameraSpace[1].sub(pointsInCameraSpace[0]);
        const line2 = pointsInCameraSpace[2].sub(pointsInCameraSpace[0]);

        const normalVector = line1.cross(line2);

        const vertexToCamera = camera.translate.sub(pointsInCameraSpace[0]);
        
        return normalVector.dot(vertexToCamera) <= 0;
    }

    public renderObject(data: ImageDataArray, camera: Camera, zBuffer: number[]): void {
        if(!this.vertices || this.vertices.length === 0) return
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

            const p0 = this.vertices[v.r];
            const p1 = this.vertices[v.g];
            const p2 = this.vertices[v.b];

            if(p0 == undefined || p1 == undefined || p2 == undefined) {
                console.log("UNEXPETCED");
                return
            }

            const pointInCameraSpace = this.toCameraSpaceFaster(p0, p1, p2, viewMatrix);
            if(this.isBackFace([pointInCameraSpace[0]!.toVec3(),pointInCameraSpace[1]!.toVec3(),pointInCameraSpace[2]!.toVec3()], camera)){
                //console.log("BACK FACE SKIP");
                return;
            }
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
                const z0 = triangle.points[0]!.b;
                const z1 = triangle.points[1]!.b;
                const z2 = triangle.points[2]!.b;
                const p0Canvas = this.projectionMatrix.multWithVec(triangle.points[0]!);
                const p1Canvas = this.projectionMatrix.multWithVec(triangle.points[1]!);
                const p2Canvas = this.projectionMatrix.multWithVec(triangle.points[2]!);
                
                const coordWithZ0 = Vec3.fromPoint(p0Canvas.toPoint(), z0);
                const coordWithZ1 = Vec3.fromPoint(p1Canvas.toPoint(), z1);
                const coordWithZ2 = Vec3.fromPoint(p2Canvas.toPoint(), z2);

                DrawFilledTriangle(coordWithZ0, coordWithZ1, coordWithZ2, triangleColor, data, this.cw, zBuffer); 
                //drawTriangle(coordWithZ0, coordWithZ1, coordWithZ2, triangleColor, data, this.cw, zBuffer);
            }

        })        
    }

    public move(x : number, y: number, z: number) {
        this.translate = this.translate.add(new Vec3(x, y, z));
        this.updateModelMatrix();
    }

    public rotate(x : number, y: number, z: number) {
        this.rotation = this.rotation.add(new Vec3(x, y, z));
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