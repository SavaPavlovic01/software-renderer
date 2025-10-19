import { Point, Vec3 } from "./math.js"

export const writePixel = (pixelCoords: Point, data: ImageDataArray, w: number, h: number, r: number = 0, g: number = 0, b: number = 0) => {
    //if(pixelCoords.y > w || pixelCoords.x > w) { // TODO: change when you fix the h
    //    console.log("NPT")
    //    return
    //}
    const index = (Math.round(pixelCoords.y) * w + Math.round(pixelCoords.x)) * 4
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = 255
}

export const writePixelWithZBuffering = (pixelCoords: Vec3, data: ImageDataArray, w: number, h: number, color: Vec3, zBuffer: number[]) => {
    const zBufferIndex = (Math.round(pixelCoords.g) * w + Math.round(pixelCoords.r)) 
    const DEPTH_EPSILON = 1e-4;

    if(zBuffer[zBufferIndex]! + DEPTH_EPSILON >= pixelCoords.b) {
        return
    }
    zBuffer[zBufferIndex] = pixelCoords.b;
    const index = zBufferIndex * 4
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = 255
}

export const clearScreen = (data: ImageDataArray, zBuffer: number[]) => {
    data.fill(0);
    zBuffer.fill(0)
}

export const interpolate = (i0: number, d0: number, i1: number, d1: number) : number[] => {
    let values : number[] =  []
    if(i0 === i1) {
        return [d0]
    }
    const a = (d1 - d0) / (i1 - i0)
    let d = d0;
    for(let i = i0; i <= i1; i++) {
        values.push(d);
        d += a
    }
    return values;
}


export const DrawLine = (startV: Vec3, endV: Vec3, color: Vec3, data: ImageDataArray, w: number, zBuffer: number[]) => {
    let start = startV.xy();
    let end = endV.xy();
    if(Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) { 
        if(start.x > end.x) {
            [start, end] = [end, start];
            [startV, endV] = [endV, startV];
        }
        const ys = interpolate(start.x, start.y, end.x, end.y)
        const zs = interpolate(startV.r, startV.b, endV.r, endV.b);
        for(let x = start.x; x <= end.x; x++) {
            let y = ys[x - start.x]
            const z = zs[x - startV.r];
            if(y == undefined) {
                console.log("ERRROR")
                return
            }
            writePixelWithZBuffering(new Vec3(x, y, z), data, w, w, color, zBuffer);
            //writePixel(new Point(x, Math.round(y)), data, w, 0, color.r, color.g, color.b)
        }
    } else {
        if (start.y > end.y) {
            [start, end] = [end, start];
            [startV, endV] = [endV, startV]; 
        }
        const xs = interpolate(start.y, start.x, end.y, end.x)
        const zs = interpolate(startV.g, startV.b, endV.g, endV.b)
        for(let y = start.y; y <= end.y; y++) {
            let x = xs[y - start.y]
            const z = zs[y - startV.g];
            if(x == undefined) {
                console.log("ERROR")
                return
            }
            writePixelWithZBuffering(new Vec3(x, y, z), data, w, w, color, zBuffer);
            //writePixel(new Point(Math.round(x), y), data, w, 0, color.r, color.g, color.b)
            
        }
    } 
}

export const drawTriangle = (p0: Vec3, p1: Vec3, p2: Vec3, color: Vec3, data: ImageDataArray, w: number, zBuffer: number[]) => {
    DrawLine(p0, p1, color, data, w, zBuffer)
    DrawLine(p1, p2, color, data, w, zBuffer)
    DrawLine(p2, p0, color, data, w, zBuffer)
}

export const DrawFilledTriangle = (p0V: Vec3, p1V: Vec3, p2V: Vec3, color:Vec3, data: ImageDataArray, w: number, zBuffer: number[]) => {
    const pts = [p0V, p1V, p2V].sort((a, b) => a.g - b.g) as [Vec3, Vec3, Vec3];
    [p0V, p1V, p2V] = pts;
    
    let p0 = p0V.xy();
    let p1 = p1V.xy();
    let p2 = p2V.xy();


    let x01 = interpolate(p0.y, p0.x, p1.y, p1.x)
    const h01 = interpolate(p0.y, p0.h, p1.y, p1.h);
    const z01 = interpolate(p0.y, p0V.b, p1.y, p1V.b);

    const x12 = interpolate(p1.y, p1.x, p2.y, p2.x)
    const h12 = interpolate(p1.y, p1.h, p2.y, p2.h);
    const z12 = interpolate(p1.y, p1V.b, p2.y, p2V.b);

    const x02 = interpolate(p0.y, p0.x, p2.y, p2.x)
    const h02 = interpolate(p0.y, p0.h, p2.y, p2.h);
    const z02 = interpolate(p0.y, p0V.b, p2.y, p2V.b);

    x01.pop()
    z01.pop();
    const x012 = [...x01, ...x12]
    const h012 = [...h01, ...h12]
    const z012 = [...z01, ...z12];

    const m = Math.floor(x012.length / 2)
    const one = x02[m]
    const two = x012[m]
    if(one == undefined || two == undefined) return;
    let x_left = x012
    let x_right = x02

    let h_left = h012
    let h_right = h02

    let z_left = z012
    let z_right = z02
    if(one < two) {
        x_left = x02;    
        x_right = x012;
        h_left = h02;
        h_right = h012;
        z_left = z02;
        z_right = z012;
    }

    for(let y = p0.y; y <= p2.y; y++) {
        const indexY = Math.round(y - p0.y);
        let curLeft = x_left[indexY]
        let curRight = x_right[indexY]
        const curHLeft = h_left[indexY]
        const curHRight = h_right[indexY]
        const curZLeft = z_left[indexY]!;
        const curZRight = z_right[indexY]!;

        if(curLeft == undefined || curRight == undefined || curHLeft == undefined || curHRight == undefined) return
        const h_segment = interpolate(curLeft, curHLeft, curRight, curHRight)
        const z_segment = interpolate(curLeft, curZLeft, curRight, curZRight);
        for(let x = curLeft; x <= curRight; x++) {
            const curH = h_segment[Math.round(x - curLeft)]
            const curZ = z_segment[Math.round(x - curLeft)]!;
            if(curH == undefined) return;
            const shaded_color = new Vec3()
            writePixelWithZBuffering(new Vec3(x, y, curZ), data, w, 0,color, zBuffer);
            //writePixel(new Point(x, y), data, w, 0, color.r * curH, color.g * curH, color.b * curH)
        }
    }
}
