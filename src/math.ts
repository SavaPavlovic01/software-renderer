import type { SceneObject } from "./object.js";

export class Mat {
    public mat: number[][];

    constructor(rows: number, cols: number, fill: number = 0) {
        this.mat = Array.from({ length: rows }, () => Array(cols).fill(fill));
    }

    public mult(other: Mat): Mat {
        const rowsA = this.mat.length;
        const colsA = this.mat[0]!.length;
        const rowsB = other.mat.length;
        const colsB = other.mat[0]!.length;

        if (colsA !== rowsB) {
            throw new Error(
                `Matrix multiplication not possible: ${colsA} != ${rowsB}`
            );
        }

        const result = new Mat(rowsA, colsB);

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                let sum = 0;
                for (let k = 0; k < colsA; k++) {
                    sum += this.mat[i]![k]! * other.mat[k]![j]!;
                }
                result.mat[i]![j] = sum;
            }
        }

        return result;
    }


    static makeScaleMatrix(scale: Vec3): Mat {
        const ret = new Mat(4, 4);
        ret.mat[0]![0] = scale.r;
        ret.mat[1]![1] = scale.g;
        ret.mat[2]![2] = scale.b
        ret.mat[3]![3] = 1
        return ret;
    } 

    static makeTranslationMatrix(translation: Vec3) : Mat {
        const ret = new Mat(4, 4);
        for(let i = 0; i < 4; i++) {
            ret.mat[i]![i] = 1
        }

        ret.mat[0]![3] = translation.r;
        ret.mat[1]![3] = translation.g;
        ret.mat[2]![3] = translation.b;
        return ret;
    }

    static makeProjectionMatrix(d: number) {
        const ret = new Mat(3, 4);
        ret.mat[0]![0] = d
        ret.mat[1]![1] = d;
        ret.mat[2]![2] = 1
        return ret;

    }

    static makeViewportToCanvasMatrix(cw: number, ch: number, vw: number, vh: number, d: number): Mat {
        const ret = new Mat(3, 3);
        ret.mat[0]![0] = cw / 2;
        ret.mat[0]![2] = cw / 2;
        ret.mat[1]![1] = -ch / 2;
        ret.mat[1]![2] = ch / 2;
        ret.mat[2]![2] = 1;
        return ret;
    }

    static identity(): Mat {
        const m = new Mat(4, 4);
        for (let i = 0; i < 4; i++) m.mat[i]![i] = 1;
        return m;
    }

    static rotateX(angle: number): Mat {
        const c = Math.cos(angle), s = Math.sin(angle);
        const m = Mat.identity();
        m.mat[1]![1] = c; m.mat[1]![2] = -s;
        m.mat[2]![1] = s; m.mat[2]![2] = c;
        return m;
    }

    static rotateY(angle: number): Mat {
        const c = Math.cos(angle), s = Math.sin(angle);
        const m = Mat.identity();
        m.mat[0]![0] = c; m.mat[0]![2] = s;
        m.mat[2]![0] = -s; m.mat[2]![2] = c;
        return m;
    }

    static rotateZ(angle: number): Mat {
        const c = Math.cos(angle), s = Math.sin(angle);
        const m = Mat.identity();
        m.mat[0]![0] = c; m.mat[0]![1] = -s;
        m.mat[1]![0] = s; m.mat[1]![1] = c;
        return m;
    }

    // ONLY WORKS ON 4X4, FIX
    transpose(): Mat {
        const result = new Mat(4, 4);
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                result.mat[i]![j] = this.mat[j]![i]!;
        return result;
    }

    static cameraMatrix(position: Vec3, rotation: Vec3): Mat {
        const [rx, ry, rz] = [rotation.r, rotation.g, rotation.b];
        const [x, y, z] = [position.r, position.g, position.b];

        // Camera rotation
        const rotX = Mat.rotateX(rx);
        const rotY = Mat.rotateY(ry);
        const rotZ = Mat.rotateZ(rz);

        // Combined rotation (order: Z * Y * X)
        const rotationMatrix = rotZ.mult(rotY).mult(rotX);

        // Camera translation
        const translationMatrix = Mat.makeTranslationMatrix(new Vec3(x, y, z));

        // Camera transform: T * R
        const cameraTransform = translationMatrix.mult(rotationMatrix);

        // View matrix = inverse(camera transform)
        // Since rotation is orthogonal: inverse(R) = R^T
        const rotationInverse = rotationMatrix.transpose();
        const translationInverse = Mat.makeTranslationMatrix(new Vec3(-x, -y, -z));

        // view = R^T * -T
        const viewMatrix = rotationInverse.mult(translationInverse);

        return viewMatrix;
    }

    toPoint() : Point {
        const z = this.mat[2]![0]!
        return new Point(Math.round(this.mat[0]![0]! / z), Math.round(this.mat[1]![0]! / z));
    }

    public toVec3() : Vec3 {
        if(this.mat.length == 4) {
            const z = this.mat[3]![0]!;
            return new Vec3(this.mat[0]![0]! / z, this.mat[1]![0]! / z,this.mat[2]![0]! / z)
        }

        if(this.mat.length == 3) {
            return new Vec3(this.mat[0]![0]!, this.mat[1]![0]! , this.mat[2]![0]!)
        }

        throw new Error("CANT TURN IT INTO VEC3");
    }

}

export class Vec3 {
    public r: number
    public g: number
    public b: number

    constructor(r: number = 0, g: number = 0, b: number = 0) {
        this.r = r;
        this.b = b;
        this.g = g;
    }

    public add(v: Vec3): Vec3 {
        return new Vec3(v.r + this.r, v.g + this.g, v.b + this.b)
    }

    public sub(v: Vec3): Vec3 {
        return new Vec3(-v.r + this.r, -v.g + this.g, -v.b + this.b)
    }

    public dot(v : Vec3) : number {
        return v.r * this.r + v.g * this.g + v.b * this.b
    }

    public mul(v: number) : Vec3 {
        return new Vec3(this.r * v, this.g * v, this.b * v)
    }
    
    public div(v: number): Vec3 {
        return this.mul(1 / v)
    }

    public dist(v: Vec3): number {
        const x = v.r - this.r;
        const y = v.g - this.g;
        const z = v.b - this.b;

        return Math.sqrt(x * x + y * y + z * z);
    }

    public toMat(): Mat {
        const ret = new Mat(4, 1);
        ret.mat[0]![0] = this.r;
        ret.mat[1]![0] = this.g;
        ret.mat[2]![0] = this.b;
        ret.mat[3]![0] = 1
        return ret;
    }

    public xy(): Point {
        return new Point(this.r, this.g);
    }

    public static fromPoint(point: Point, z: number) : Vec3 {
        return new Vec3(point.x, point.y, 1 / z);
    }

    public cross(v : Vec3) : Vec3 {
        return new Vec3(
            this.g * v.b - this.b * v.g, 
            this.b * v.r - this.r * v.b, 
            this.r * v.g - this.g * v.r  
        );
    }
}


export class Point {
    public x: number
    public y: number
    public h: number

    constructor(x: number, y: number, h: number = 1) {
        this.x = x;
        this.y = y
        this.h = h
    }

}

export class ClippingPlane {
    private a: number
    private b: number
    private c: number
    private D: number

    constructor(a: number, b: number, c: number, D: number = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.D = D
    }

    public distFromPoint(point: Vec3) : number {
        const top = this.a * point.r + this.b * point.g + this.c * point.b - this.D
        const bottom = Math.sqrt(this.a * this.a + this.b * this.b + this.c * this.c)
        return top / bottom;
    }


    public intersectsLine(A: Vec3, B: Vec3) : Vec3 | null {
        const planeNormal = new Vec3(this.a, this.b, this.c);

        const AB = B.sub(A);
        const denominator = planeNormal.dot(AB);

        if(Math.abs(denominator) < 1e-6) {
            return null
        }

        const t = (this.D -  planeNormal.dot(A)) / denominator;
        return A.add(AB.mul(t));
    }
}

export enum ObjectFrustumRelation {
    OUTSIDE, 
    INSIDE,
    CUTS
}

// right just 45 degree FOV
export class Frustum {
    private nearPlane: ClippingPlane;
    private leftPlane: ClippingPlane = new ClippingPlane(1 / Math.sqrt(2), 0, 1 / Math.sqrt(2));
    private rightPlane: ClippingPlane = new ClippingPlane(- 1 / Math.sqrt(2), 0, 1 / Math.sqrt(2));
    private bottomPlane: ClippingPlane = new ClippingPlane(0, 1 / Math.sqrt(2), 1 / Math.sqrt(2));
    private topPlane: ClippingPlane = new ClippingPlane(0, -1 / Math.sqrt(2), 1 / Math.sqrt(2));

    private allPlanes : ClippingPlane[]

    constructor(d: number) {
        this.nearPlane = new ClippingPlane(0, 0, 1, d);
        this.allPlanes = [this.nearPlane, this.leftPlane, this.rightPlane, this.bottomPlane, this.topPlane]
    }

    public getSphereFrustumRelation(sphere: {center: Vec3, radius: number}) : {relation: ObjectFrustumRelation, cutPlanes: ClippingPlane[]} {
        const cutPlanes: ClippingPlane[] = []
        let relation = ObjectFrustumRelation.INSIDE;
        for(const plane of this.allPlanes) {
            const dist = plane.distFromPoint(sphere.center);
            if(dist >= sphere.radius) continue;
            if(Math.abs(dist) < sphere.radius){
                cutPlanes.push(plane);
                relation = ObjectFrustumRelation.CUTS;
                continue
            }
            return {relation: ObjectFrustumRelation.OUTSIDE, cutPlanes:[]};
        }
        return {relation: relation, cutPlanes: cutPlanes}
    }


}

export class Triangle {
    public points: Vec3[] = []

    constructor(p0: Vec3, p1: Vec3, p2: Vec3) {
        this.points = [p0, p1, p2];
    }


}