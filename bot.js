// token_bot token_db url_db
import { createClient } from "@libsql/client";
import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder} from "discord.js"

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

client.once("ready", async () => {
    console.log(`Zalogowano jako ${client.user.tag}`);

    const rest = new REST ({ version: "10"}).setToken(process.env.token_bot);
    const commands = [
        new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Odbierz Solid Dice"),

        new SlashCommandBuilder()
        .setName("work")
        .setDescription("Odbierz Solid Dice"),

        new SlashCommandBuilder()
        .setName("skillissues")
        .setDescription("Wieszak zjawia się z dupy i daje ci 5 Solid Dice"),

        new SlashCommandBuilder()
        .setName("pinkpawsheist")
        .setDescription("Bierzesz udział w wydarzeniu - Pink Paws Heist"),

        new SlashCommandBuilder()
        .setName("kawiarnia")
        .setDescription("Odbierz Solid Dice z kawiarni"),

        new SlashCommandBuilder()
        .setName("delivery")
        .setDescription("Wykonaj dostawę aby odebrać Solid Dice"),

        new SlashCommandBuilder()
        .setName("łowienie")
        .setDescription("Zacznij łowić aby odebrać nagrody")

    ].map((cmd) => cmd.toJSON());

    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Komendy zarejestrowane")
});

client.login(process.env.token_bot);

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "zapisz") {
        const tekst = interaction.options.getString("tekst");
    
        await db.execute({
            sql: "INSERT INTO notatki (user_id, tresc) VALUES (?, ?)",
            args: [interaction.user.id, tekst],
        });
        await interaction.reply("Zapisano do bazy!");
    }

    if (interaction.commandName === "pobierz") {
        const wynik = await db.execute({
            sql: "SELECT tresc FROM notatki where user_id = ?",
            args: [interaction.user.id],
        });
        const wiersze = wynik.rows.map((r) => r.tresc).join ("\n");
        await interaction.reply(wiersze || "Brak zapisów.");
    }
});