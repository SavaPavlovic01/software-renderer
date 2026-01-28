import { Vec3 } from "./math.js";
import { SceneObject } from "./object.js";

export class Quad {
    private points:Vec3[];
    constructor(points:Vec3[]){
        if(points.length != 4) throw new Error("i need 4 points");
        this.points =  points
    }
}

export class ModelObject extends SceneObject {
    constructor(worldPos: Vec3, rotation: Vec3, scale: Vec3, cw: number, ch: number, color: Vec3 = new Vec3(255, 0, 0)) {
        super(worldPos, rotation, scale, cw, ch);

        ObjParser.parseStatue().then(value => {
            console.log(value[0])
            console.log(value[1])
            this.vertices = value[0];
            this.triangles = value[1];
        });
    }
}


export class ObjParser {
    public static async parseStatue(): Promise<[Vec3[], Vec3[]]>  {
        const resp = await fetch("/brat.obj");
        const objText = await resp.text();
    
        const lines = objText.split("\n")

        let verticies:Vec3[] = []
        let triangles:Vec3[] = []

        for(const line of lines){
            const trimmed = line.trim();
            if(trimmed === "" || trimmed.startsWith("#")) continue;

            const parts = trimmed.split(/\s+/);
            switch(parts[0]) {
                case "v": {
                    if(parts.length < 4){
                        console.log("malformed");
                        throw new Error("kek")
                    }

                    const x = parseFloat(parts[1]!);
                    const y = parseFloat(parts[2]!);
                    const z = parseFloat(parts[3]!);
                    verticies.push(new Vec3(x, y, z));
                    break
                }

                case "f": {
                    // you can have different shit here, my obj file has f (int/int/int) x 4
                    // TODO: maybe add the other shit here
                    const indecies:number[] = []

                    if(parts.length == 4) {
                        for(let i = 0; i < 3; i++) {
                            indecies.push(parseInt(parts[i + 1]!) - 1);
                        }
                        triangles.push(new Vec3(indecies[0], indecies[1], indecies[2]))
                        break;
                    }

                    for(let i = 0; i < 4; i++) {
                        let vertIndex = -1;
                        if(parts[i + 1]!.includes("\\")) vertIndex = parseInt(parts[i + 1]!.split('\\')[0]!) - 1;
                        else vertIndex = parseInt(parts[i + 1]!) - 1
                        indecies.push(vertIndex);
                    }

                    triangles.push(new Vec3(indecies[0], indecies[1], indecies[2]))
                    triangles.push(new Vec3(indecies[0], indecies[2], indecies[3]))
                    break;
                }
            }
        }

        return [verticies, triangles];

    }
}