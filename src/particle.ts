import {vec3, vec4} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';

class Particle {
    mass: number;
    pos: vec3;
    vel: vec3;
    acc: vec3;
    col: vec4;

    public constructor(mass: number, pos: vec3, vel: vec3, acc: vec3, col: vec4) {
        this.mass = mass;
        this.pos = pos;
        this.vel = vel;
        this.acc = acc;
        this.col = col;
    }

    public update(force: vec3, deltaT: number) {
        vec3.scale(this.acc, force, 1 / this.mass);
        let deltaV = vec3.fromValues(0, 0, 0);
        vec3.add(this.vel, this.vel, vec3.scale(deltaV, this.acc, deltaT));
        let deltaPos = vec3.fromValues(0, 0, 0);
        vec3.add(this.pos, this.pos, vec3.scale(deltaPos, this.vel, deltaT));
    }

    public stopMoving() {
        this.vel = vec3.fromValues(0, 0, 0);
        this.acc = vec3.fromValues(0, 0, 0);
    }

    public slowdown(factor: number, deltaT: number) {
        this.acc = vec3.fromValues(0, 0, 0);
        vec3.scale(this.vel, this.vel, factor);
        let deltaPos = vec3.fromValues(0, 0, 0);
        vec3.add(this.pos, this.pos, vec3.scale(deltaPos, this.vel, deltaT));
        
        if (vec3.length(this.vel) < 0.05) {
            this.randomMoving(deltaT);
        }

    }

    public randomMoving(deltaT: number) {
        this.vel = vec3.fromValues(Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25);
        let deltaPos = vec3.fromValues(0, 0, 0);
        vec3.add(this.pos, this.pos, vec3.scale(deltaPos, this.vel, deltaT));

    }

}

export default Particle;