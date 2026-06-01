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
        .setName("zapisz")
        .setDescription("Zapisz notatkę do bazy danych")
        .addStringOption((opt) =>
            opt.setName("tekst").setDescription("Treść").setRequired(true)
        ),
        new SlashCommandBuilder()
        .setName("pobierz")
        .setDescription("Pobieranie notatki"),

        new SlashCommandBuilder()
        .setName("wieszak")
        .setDescription("Wieszak uwu"),

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

    if (interaction.commandName === "wieszak") {
        const losowanie = Math.random();

        const pochwaly = [
            "Wieszak? Ten wieszak to LEGENDA. Respect. 🫡",
            "Wieszak jest git, nie ma co gadać. 👍",
            "Wieszak to szczyt ewolucji. Brawo wieszaku. 🏆",
        ];

        const wyzwizka = [
            "Serio. 🗑️",
            "Wieszak? Żałosny. Nawet ubrań dobrze nie trzyma. 💀",
            "Wieszak to największa pomyłka natury. 😤",
        ];

        const lista = losowanie < 0.5 ? pochwaly : wyzwizka;
        const wynik = lista[Math.floor(Math.random() * lista.length)];

        await interaction.reply(wynik);
    }
});