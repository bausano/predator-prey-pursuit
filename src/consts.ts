// How many blocks can a prey see.
export const PREY_VISION_RADIUS_SQ = 64;
// Prey will attempt to keep distance from each other at least this many blocks.
export const PREY_AVOID_RADIUS_SQ = 8;
// How fast can prey turn around.
export const PREY_MAX_STEERING_FORCE = 5;
// Increases the speed prey turns around.
export const PREY_STEERING_FORCE_WEIGHT = 5;
// Minimal time delay between updates to prey.
export const MIN_TICK_MS = 40;

// TODO
export const WALL_REPELLING_FORCE = 2.0;
export const ALIGNMENT_FORCE = 1.5;
export const SEPARATION_FORCE = 1.5;
export const COHESION_FORCE = 1.0;
export const ESCAPE_FORCE = 3.0;
