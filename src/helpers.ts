import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import {
    PREY_STEERING_FORCE_WEIGHT,
    PREY_MAX_STEERING_FORCE,
    WALL_BLOCK,
} from "./consts";

// Given prey's current velocity, we apply force to it.
export function steerTowards(velocity: Vec3, force: Vec3): Vec3 {
    return force
        .normalize()
        .scale(PREY_STEERING_FORCE_WEIGHT)
        .subtract(velocity)
        .min(vec3Splat(PREY_MAX_STEERING_FORCE));
}

export function vec3Splat(s: number): Vec3 {
    return new Vec3(s, s, s);
}

// Returns fences in 3x3 area around given position.
export function wallsAround(bot: Bot): Vec3[] {
    const walls = [];
    const pos = bot.entity.position.clone().subtract(new Vec3(1, 0, 1));
    for (let z = 0; z < 3; z++) {
        for (let x = 0; x < 3; x++) {
            if ((bot as any).world.getBlockType(pos) === WALL_BLOCK) {
                walls.push(pos.clone());
            }
            pos.add(new Vec3(1, 0, 0));
        }
        pos.subtract(new Vec3(3, 0, 0));
        pos.add(new Vec3(0, 0, 1));
    }
    return walls;
}
