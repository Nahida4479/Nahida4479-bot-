// token_bot token_db url_db
import { createClient } from "@libsql/client";
import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} from "discord.js"

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
        .setDescription("Wieszak zjawia się z az megafonem i daje ci 5 Solid Dice po tym jak zostałem ogłuszony"),

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
        .setDescription("Zacznij łowić aby odebrać nagrody"),

        new SlashCommandBuilder()
        .setName("ntegra")
        .setDescription("Ustaw kanał gry - Nte Gra")
        .addChannelOption((opt) =>
            opt.setName("kanal").setDescription("Wybierz kanał").setRequired(true)
        ),

        new SlashCommandBuilder()
        .setName("administracja")
        .setDescription("Ustaw role które mogą zarządzać botem")
        .addRoleOption((opt) =>
            opt.setName("rola").setDescription("Wybierz rolę").setRequired(true)
    )


    ].map((cmd) => cmd.toJSON());

    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Komendy zarejestrowane")
});

client.login(process.env.token_bot);

async function checkcooldown(userId, guildId, komenda, cooldownMs) {
    const teraz = Date.now();
    const wynik = await db.execute({
        sql: "SELECT ostatnio FROM cooldowny WHERE user_id = ? AND guild_id = ? AND komenda = ?",
        args: [userId, guildId, komenda],
    });
    if (wynik.rows.length > 0) {
        const ostatnio = Number(wynik.rows[0].ostatnio);
        const roznica = teraz - ostatnio;
        if (roznica < cooldownMs) {
            const pozostalo =  cooldownMs - roznica;
            const minuty = Math.floor(pozostalo / 60000);
            const sekundy = Math.floor((pozostalo % 60000) / 1000);
            return `Poczekaj jeszcze **${minuty}m ${sekundy}s**!`;
        }
    }

    await db.execute({
        sql: "INSERT INTO cooldowny (user_id, guild_id, komenda, ostatnio) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, guild_id, komenda) DO UPDATE SET ostatnio = ?",
        args: [userId, guildId, komenda, teraz, teraz]
    });

    return null;
}


//Solid Dice 

async function addSolidDice(userId, guildId, ilosc) {
    await db.execute({
        sql: "INSERT INTO ekonomia (user_id, guild_id, solid_dice) VALUES (?, ?, ?) ON CONFLICT(user_id, guild_id) DO UPDATE SET solid_dice = solid_dice + ?",
        args: [userId, guildId, ilosc, ilosc],
    });
    
}


client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const ustawienia = await db.execute({
        sql: "SELECT kanal_id FROM serwery WHERE guild_id = ?",
        args: [interaction.guild.id],
    });

    const komendyEkonomii = ["daily", "work", "skillissues", "pinkpawsheist", "kawiarnia", "delivery", "łowienie"];

    if (komendyEkonomii.includes(interaction.commandName)) {
        const kanal = ustawienia.rows[0]?.kanal_id;
        if (kanal &&  interaction.channelId !== kanal) {
            await interaction.reply({ content: `Te komendy możesz używać tylko na kanale <#${kanal}>!`, ephemeral: true});
            return;
        }
    }

});