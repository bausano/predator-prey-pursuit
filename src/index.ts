import {
    ALIGNMENT_FORCE,
    COHESION_FORCE,
    MIN_TICK_MS,
    PREY_AVOID_RADIUS_SQ,
    PREY_VISION_RADIUS_SQ,
    SEPARATION_FORCE,
} from "./consts";
import { steerTowards, vec3Splat } from "./helpers";
import { spawnBot } from "./spawnBot";

const host = "localhost";
const port = 34295;
// Note that when you run this locally over "Open to LAN" the limit is 8 players
// including yourself.
const preyCount = 7;

(async () => {
    console.log(`Creating ${preyCount} prey bots.`);
    const prey = await Promise.all(
        new Array(preyCount)
            .fill(undefined)
            .map((_, i) => spawnBot(host, port, `prey_${i}`))
    );

    console.log(`${preyCount} prey bots connected.`);

    // Bots always go forward. We just change where they look.
    for (let bot of prey) {
        bot.setControlState("forward", true);
    }

    console.log("Beginning boids behavior.");
    let lastRun = Date.now();
    let msDelta = 0;
    while (true) {
        msDelta = lastRun - Date.now();
        if (msDelta < MIN_TICK_MS) {
            // Sleep if we updated too quick.
            await new Promise((resolve) =>
                setTimeout(resolve, MIN_TICK_MS - msDelta)
            );
            msDelta = lastRun - Date.now();
        }
        lastRun = Date.now();

        await Promise.all(
            prey.map(async (bot) => {
                let { position, velocity } = bot.entity;
                position = position.clone();
                velocity = velocity.clone();

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

                    // Skip entities too far away for us to care or are animals.
                    if (sqDist > PREY_VISION_RADIUS_SQ || !entity.username) {
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
                        if (sqDist < PREY_AVOID_RADIUS_SQ) {
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
                    let cohesionForce = steerTowards(
                        velocity,
                        offsetToFlockCenter
                    );
                    acceleration.add(cohesionForce.scale(COHESION_FORCE));

                    // Aligns velocity vectors with nearby flockmates.
                    let alignmentForce = steerTowards(velocity, headingDir);
                    acceleration.add(alignmentForce.scale(ALIGNMENT_FORCE));

                    // If there is some separation to be sustained with nearby
                    // flockmates, apply the force to the acceleration.
                    if (separationDir.x !== 0 || separationDir.z !== 0) {
                        let separationForce = steerTowards(
                            velocity,
                            separationDir
                        );
                        acceleration.add(
                            separationForce.scale(SEPARATION_FORCE)
                        );
                    }
                }

                // Applies acceleration to a velocity given how long should the acceleration
                // last and max speed.
                const lookAtPoint = velocity
                    .add(acceleration.scale(msDelta / 1000))
                    .add(position);
                // We don't want the bot to look into the ground.
                lookAtPoint.y = position.y + bot.entity.height;

                // The bots always go forward. We just change the direction they
                // look.
                bot.lookAt(lookAtPoint);
            })
        );
    }
})();
