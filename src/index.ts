import { Vec3 } from "vec3";
import { createBot, Bot, ControlState } from "mineflayer";

// How many blocks can a prey see.
const PREY_VISION_RADIUS = 20;
// Prey will attempt to keep distance from each other at least this many blocks.
const PREY_AVOID_RADIUS = 5;
// TODO
const PREY_MAX_SPEED = 5;
// TODO
const PREY_MAX_STEERING_FORCE = 5;

// TODO
const WALL_REPELLING_FORCE = 2.0;
const ALIGNMENT_FORCE = 1.0;
const SEPARATION_FORCE = 1.5;
const COHESION_FORCE = 1.0;
const ESCAPE_FORCE = 3.0;

const host = "localhost";
const port = 35627;
const preyCount = 1;

(async () => {
    // Creates fleet of prey.
    const prey = new Array(preyCount).fill(undefined).map((_, i) =>
        createBot({
            host,
            port,
            username: `prey_${i}`,
        })
    );

    // Wait for all bots to spawn. If the script stalls here, it's possible that
    // the spawn even has already been sent before we attached the listener.
    await Promise.all(
        prey.map(
            (bot) => new Promise((resolve) => bot.addListener("spawn", resolve))
        )
    );
    console.log(`${preyCount} prey bots connected.`);

    // Bots always go forward. We just change where they look.
    for (let bot of prey) {
        // bot.setControlState("forward", true)
    }

    console.log("Beginning boids behavior.");
    while (true) {
        // TODO
        let msDelta = 100;
        await new Promise((resolve) => setInterval(resolve, msDelta));
        for (let bot of prey) {
            let { position, velocity } = bot.entity;
            position = position.clone();
            position = velocity.clone();

            // How many other prey is nearby.
            let flockmates = 0;
            // Sums all heading vectors of all nearby flockmates.
            let headingDir = vec3Splat(0);
            // Sums all position vectors of all nearby flockmates.
            let centerTotal = vec3Splat(0);
            // We calculate in which direction should we move to avoid other prey.
            // We don't want prey to be too close to one another.
            let separationDir = vec3Splat(0);

            for (let entity of Object.values(bot.entities)) {
                const offset = position.clone().subtract(entity.position);
                // Just making sure this quantity is not zero for convenience.
                const sqDist =
                    position.distanceSquared(entity.position) || 0.0001;

                console.log(
                    entity.username,
                    bot.username,
                    position,
                    sqDist,
                    entity.position
                );

                // Skip entities too far away for us to care or are animals.
                if (sqDist > PREY_VISION_RADIUS || !entity.username) {
                    continue;
                }

                if (
                    entity.type === "player" ||
                    entity.username.startsWith("prey")
                ) {
                    flockmates++;
                    // Used to calculate affect of alignment force. See below.
                    headingDir.add(entity.velocity);
                    // Used to calculate affect of cohesion force. See below.
                    centerTotal.add(entity.position);

                    // If prey is too close to each other, try change its direction
                    // so that they don't bump.
                    if (sqDist < PREY_AVOID_RADIUS * PREY_AVOID_RADIUS) {
                        separationDir.add(offset.scale(1 / sqDist));
                    }
                } else if (entity.username.startsWith("predator")) {
                    // TODO: Maybe we can use "else" as all other usernames
                    // imply predators.
                }
            }

            // We collect acceleration which we want to apply to the bot.
            let acceleration = vec3Splat(0);

            // TODO: Repel from walls.

            if (flockmates > 0) {
                // Weighted sum of positions of nearby flock mates, then an offset
                // to current position is taken.
                let offsetToFlockCenter = centerTotal
                    .scale(1 / flockmates)
                    .subtract(position);
                let cohesionForce = steerTowards(velocity, offsetToFlockCenter);
                acceleration.add(cohesionForce.scale(COHESION_FORCE));

                // Aligns velocity vectors with nearby flockmates.
                let alignmentForce = steerTowards(velocity, headingDir);
                acceleration.add(alignmentForce.scale(ALIGNMENT_FORCE));

                // If there is some separation to be sustained with nearby
                // flockmates, apply the force to the acceleration.
                if (separationDir.volume()) {
                    let separationForce = steerTowards(velocity, separationDir);
                    acceleration.add(separationForce.scale(SEPARATION_FORCE));
                }
            }

            // Applies acceleration to a velocity given how long should the acceleration
            // last and max speed.
            const newVelocity = velocity.add(
                acceleration.scale(msDelta / 1000)
            );

            console.log(bot.username, newVelocity);

            // The bots always go forward. We just change the direction they
            // look.
            bot.lookAt(position.add(newVelocity));
        }
    }
})();

// Given prey's current velocity, we apply force to it.
function steerTowards(velocity: Vec3, force: Vec3): Vec3 {
    return force
        .normalize()
        .scale(PREY_MAX_SPEED)
        .subtract(velocity)
        .min(vec3Splat(PREY_MAX_STEERING_FORCE));
}

function vec3Splat(s: number): Vec3 {
    return new Vec3(s, s, s);
}
