import {vec3} from 'gl-matrix';

class Mesh {
    vertList: Array<vec3>;
    meshPos: any;

    public constructor(objMesh: any) {
        this.vertList = new Array<vec3>();
        this.meshPos = objMesh.vertices;

        for (let i = 0; i < this.meshPos.length - 2; i += 3) {
            this.vertList.push(vec3.fromValues(this.meshPos[i], this.meshPos[i + 1], this.meshPos[i + 2]));
        }
    }
}

export default Mesh;