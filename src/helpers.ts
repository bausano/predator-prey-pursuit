import { Vec3 } from "vec3";
import { PREY_MAX_STEERING_FORCE } from "./consts";

// Given prey's current velocity, we apply force to it.
export function steerTowards(velocity: Vec3, force: Vec3): Vec3 {
    return force
        .normalize()
        .subtract(velocity)
        .min(vec3Splat(PREY_MAX_STEERING_FORCE));
}

export function vec3Splat(s: number): Vec3 {
    return new Vec3(s, s, s);
}
