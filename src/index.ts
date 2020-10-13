import { createBot } from "mineflayer";

// Create fleet of bots.
// For each bot, read the nearby entities and its position.
// Calculate the boids equations for each bot.

const bot = createBot({
    host: "localhost",
    port: 42793,
    username: "bot",
});

let i = 0;
function loop(n) {
    if (i > n) {
        bot.chat("My flight was amazing !");
        return;
    }
    i += 1;

    const { position } = bot.entity;

    // Draw a spiral
    bot.creative.flyTo(
        position.offset(Math.sin(i) * 2, 0.5, Math.cos(i) * 2),
        () => {
            loop(n);
        }
    );
}

bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    switch (message) {
        case "fly":
            bot.creative.startFlying();
            loop(10);
            break;
        case "entities":
            console.log(bot.entities);
            break;
        case "asd":
            console.log("bot hp", bot.health);
            bot.health = 1;
            console.log("bot hp", bot.health);
            break;
    }
});
