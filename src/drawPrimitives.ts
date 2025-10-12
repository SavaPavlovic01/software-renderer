import { Point, Vec3 } from "./math.js"

export const writePixel = (pixelCoords: Point, data: ImageDataArray, w: number, h: number, r: number = 0, g: number = 0, b: number = 0) => {
    console.log(pixelCoords, h, w)
    if(pixelCoords.y > w || pixelCoords.x > w) { // TODO: change when you fix the h
        console.log("NPT")
        return
    }
    const index = (Math.round(pixelCoords.y) * w + Math.round(pixelCoords.x)) * 4
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = 255
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


export const DrawLine = (start: Point, end: Point, color: Vec3, data: ImageDataArray, w: number) => {
    console.log(start, end)
    if(Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) { 
        if(start.x > end.x) {
            [start, end] = [end, start]

        }
        const ys = interpolate(start.x, start.y, end.x, end.y)
        for(let x = start.x; x <= end.x; x++) {
            let y = ys[x - start.x]
            if(y == undefined) {
                console.log("ERRROR")
                return
            }
            writePixel(new Point(x, Math.round(y)), data, w, 0, color.r, color.g, color.b)
        }
    } else {
        console.log("HERE")
        if (start.y > end.y) {
            [start, end] = [end, start]
        }
        const xs = interpolate(start.y, start.x, end.y, end.x)
        for(let y = start.y; y <= end.y; y++) {
            let x = xs[y - start.y]
            if(x == undefined) {
                console.log("ERROR")
                return
            }
            writePixel(new Point(Math.round(x), y), data, w, 0, color.r, color.g, color.b)
            
        }
    } 
}

export const drawTriangle = (p0: Point, p1: Point, p2: Point, color: Vec3, data: ImageDataArray, w: number) => {
    DrawLine(p0, p1, color, data, w)
    DrawLine(p1, p2, color, data, w)
    DrawLine(p2, p1, color, data, w)
}

export const DrawFilledTriangle = (p0: Point, p1: Point, p2: Point, color:Vec3, data: ImageDataArray, w: number) => {
    const pts = [p0, p1, p2].sort((a, b) => a.y - b.y) as [Point, Point, Point];
    [p0, p1, p2] = pts;
    console.log(p0, p1, p2)

    let x01 = interpolate(p0.y, p0.x, p1.y, p1.x)
    const h01 = interpolate(p0.y, p0.h, p1.y, p1.h);

    const x12 = interpolate(p1.y, p1.x, p2.y, p2.x)
    const h12 = interpolate(p1.y, p1.h, p2.y, p2.h);

    const x02 = interpolate(p0.y, p0.x, p2.y, p2.x)
    const h02 = interpolate(p0.y, p0.h, p2.y, p2.h);

    console.log(x01, x12, x02)
    x01.pop()
    const x012 = [...x01, ...x12]
    const h012 = [...h01, ...h12]

    const m = Math.floor(x012.length / 2)
    const one = x02[m]
    const two = x012[m]
    if(one == undefined || two == undefined) return;
    let x_left = x012
    let x_right = x02

    let h_left = h012
    let h_right = h02
    if(one < two) {
        x_left = x02;    
        x_right = x012;
        h_left = h02;
        h_right = h012
    }

    for(let y = p0.y; y <= p2.y; y++) {
        let curLeft = x_left[y - p0.y]
        let curRight = x_right[y - p0.y]
        const curHLeft = h_left[y - p0.y]
        const curHRight = h_right[y - p0.y]

        if(curLeft == undefined || curRight == undefined || curHLeft == undefined || curHRight == undefined) return
        const h_segment = interpolate(curLeft, curHLeft, curRight, curHRight)
        for(let x = curLeft; x <= curRight; x++) {
            const curH = h_segment[x - curLeft]
            if(curH == undefined) return;
            const shaded_color = new Vec3()
            writePixel(new Point(x, y), data, w, 0, color.r * curH, color.g * curH, color.b * curH)
        }
    }
}
