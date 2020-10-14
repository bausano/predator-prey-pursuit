import { Vec3 } from "vec3";
import { createBot, Bot, ControlState } from "mineflayer";

// When we calculate new velocity we might end up with miniscule updates to our
// velocity. Since we must control the bot via the control "arrows", we will
// ignore all adjustments whose absolute value is smaller than this.
const VELOCITY_DELTA_THRESHOLD = 0.1;
// How many blocks can a prey see.
const PREY_VISION_RADIUS = 10;
// Prey will attempt to keep distance from each other at least this many blocks.
const PREY_AVOID_RADIUS = 3;
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
const preyCount = 3;

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

    console.log(`${preyCount} prey bots connected. Beginning boids behavior.`);

    // Bots always go forward. We just change where they look.
    for (let bot of prey) {
        bot.setControlState("forward", true)
    }

    // Game loop
    while (true) {
        // TODO
        let msDelta = 50;
        for (let bot of prey) {
            const { position, velocity } = bot.entity;

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
                const offset = position.subtract(entity.position);
                // Just making sure this quantity is not zero for convenience.
                const sqDist =
                    position.distanceSquared(entity.position) || 0.0001;

                // Skip entities too far away for us to care or are animals.
                if (sqDist > PREY_VISION_RADIUS || !entity.username) {
                    continue;
                }

                if (entity.username.startsWith("prey")) {
                    flockmates++;
                    // Used to calculate affect of alignment force. See below.
                    headingDir = headingDir.add(entity.velocity);
                    // Used to calculate affect of cohesion force. See below.
                    centerTotal = centerTotal.add(entity.position);

                    // If prey is too close to each other, try change its direction
                    // so that they don't bump.
                    if (sqDist < PREY_AVOID_RADIUS * PREY_AVOID_RADIUS) {
                        separationDir = separationDir.add(
                            offset.scale(1 / sqDist)
                        );
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
                acceleration = acceleration.add(
                    cohesionForce.scale(COHESION_FORCE)
                );

                // Aligns velocity vectors with nearby flockmates.
                let alignmentForce = steerTowards(velocity, headingDir);
                acceleration = acceleration.add(
                    alignmentForce.scale(ALIGNMENT_FORCE)
                );

                // If there is some separation to be sustained with nearby
                // flockmates, apply the force to the acceleration.
                if (separationDir.volume()) {
                    let separationForce = steerTowards(velocity, separationDir);
                    acceleration = acceleration.add(
                        separationForce.scale(SEPARATION_FORCE)
                    );
                }
            }

            // Applies acceleration to a velocity given how long should the acceleration
            // last and max speed.
            const newVelocity = velocity.add(
                acceleration.scale(msDelta / 1000)
            );

            // Now based on the new velocity we calculate which controls should
            // we emit. We don't care about y direction as that's up/down.
            //
            //          x
            //          |
            //          |
            // -z ------+------ z
            //          |
            //          |
            //         -x

            // Alternatively get position, add velocity, look at point. Always
            // have steer on.

            updateMovement(bot, newVelocity.x, "forward", "back")
            updateMovement(bot, newVelocity.z, "left", "right")

            console.log(bot.username, newVelocity.x, newVelocity.z);
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

// Updates bots movement based on direction. If direction is positive, sets the
// state to positive control string, otherwise negative.
// Resets any active state if appropriate.
function updateMovement(
    bot: Bot,
    direction: number,
    positive: ControlState,
    negative: ControlState
) {
    const shouldTurnOn = Math.abs(direction) < VELOCITY_DELTA_THRESHOLD;
    if (shouldTurnOn) {
        bot.setControlState(direction > 0 ? positive : negative, true);
    } else {
        // TODO: Do this only if we need to.
        bot.setControlState(negative, false);
        bot.setControlState(positive, false);
    }
}
