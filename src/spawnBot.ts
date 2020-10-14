import { createBot, Bot } from "mineflayer";

// Since sometimes when a bot connects it fails to be spawned for an unknown
// reason, we retry the connection.
export async function spawnBot(
    host: string,
    port: number,
    username: string
): Promise<Bot> {
    // How long we wait before we consider an attempt to fail.
    const retryTimeout = 10000;
    // How many times at most we retry before returning an error.
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        if (i > 0) {
            // Let's sleep for a second as we've just quit the game.
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const bot = createBot({
            host,
            port,
            username,
        });

        try {
            return await new Promise((resolve, reject) => {
                bot.addListener("spawn", () => {
                    console.log(`Prey ${bot.username} ready.`);
                    resolve(bot);
                });

                setTimeout(
                    () => reject(`Spawn timeout for ${username}`),
                    10000
                );
            });
        } catch {
            bot.quit("Cannot spawn.");
        }
    }

    throw new Error(`Cannot spawn bot ${username}`);
}
