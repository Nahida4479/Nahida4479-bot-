// token_bot token_db url_db
import { createClient } from "@libsql/client";
import "dotenv/config";
import { Client, GatewayIntentBits, InteractionResponse, REST, Routes, SlashCommandBuilder} from "discord.js"

const db = createClient({
    url: process.env.url_db,
    authToken: process.env.token_db,
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,

    ],
});

client.once("ready", () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
});

client.login(process.env.token_bot);

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "Zapisz") {
        const tekst = interaction.options.getString("tekst");
    
        await db.execute({
            sql: "INSERT INTO notatki (user_id, tresc) VALUES (?, ?)",
            args: [interaction.user.id, tekst],
        });
        await interaction.reply("Zapisano do bazy!");
    }

    if (interaction.commandName === "pobierz") {
        const wynik = await db.execute({
            sql: "SELECT trest FROM notatki where user_id = ?",
            args: [interaction.user.id],
        });
        const wiersze = wynik.rows.map((r) => r.tresc).join ("\n");
        await interaction.reply(wiersze || "Brak zapisów.");
    }

});

client.login(process.env.token_bot)