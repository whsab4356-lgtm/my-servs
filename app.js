const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const SITES = {
    qessa: "https://qeseh.net/",
    arabseed: "https://asd.pics/category/turkish-series-2/",
    cima4u: "https://cima4u.forum/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D8%AA%D8%B1%D9%83%D9%8A%D8%A9/"
};

const DATA_FILE = "seen.json";

const NUMBERS = [
    "967776911209@c.us",
    "967773533423@c.us",
    "967771163289@c.us",
    "967777549945@c.us"
];

let seen = new Set();

if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    seen = new Set(data);
}

// ✅ QR كرابط
client.on('qr', qr => {
    console.log("📱 افتح الرابط لمسح QR:");
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + qr;
    console.log(qrUrl);
});

client.on('ready', () => {
    console.log('✅ البوت جاهز!');
    setInterval(checkAllSites, 60000);
});

async function checkAllSites() {
    await checkQessa();
    await checkArabSeed();
    await checkCima4u();
}

// ================= قصة عشق =================
async function checkQessa() {
    try {
        console.log("🔍 فحص قصة عشق...");
        const res = await axios.get(SITES.qessa);
        const $ = cheerio.load(res.data);

        $("article.post").each((i, el) => {
            const link = $(el).find("a").attr("href");
            const title = $(el).find(".title").text().trim();
            const img = $(el).find("img").attr("src");

            handleEpisode(title, link, img, "قصة عشق");
        });

    } catch (err) {
        console.log("❌ قصة عشق:", err.message);
    }
}

// ================= عرب سيد =================
async function checkArabSeed() {
    try {
        console.log("🔍 فحص عرب سيد...");
        const res = await axios.get(SITES.arabseed);
        const $ = cheerio.load(res.data);

        $("#ajax__area article").each((i, el) => {
            const link = $(el).find("a").attr("href");
            const title = $(el).find("h3").text().trim();
            const img = $(el).find("img").attr("src");

            handleEpisode(title, link, img, "عرب سيد");
        });

    } catch (err) {
        console.log("❌ عرب سيد:", err.message);
    }
}

// ================= سيما فور يو =================
async function checkCima4u() {
    try {
        console.log("🔍 فحص سيما فور يو...");
        const res = await axios.get(SITES.cima4u);
        const $ = cheerio.load(res.data);

        $("#MainFiltar .GridItem").each((i, el) => {
            const link = $(el).find("a").attr("href");
            const title = $(el).find("strong").text().trim();

            const style = $(el).find(".BG--GridItem").attr("style") || "";
            const imgMatch = style.match(/url\((.*?)\)/);
            const img = imgMatch ? imgMatch[1] : null;

            handleEpisode(title, link, img, "سيما فور يو");
        });

    } catch (err) {
        console.log("❌ سيما فور يو:", err.message);
    }
}

// ================= الإرسال =================
async function handleEpisode(title, link, img, source) {
    if (!title || !link) return;

    if (title.includes("الحلقة")) {
        if (!seen.has(title)) {
            seen.add(title);
            fs.writeFileSync(DATA_FILE, JSON.stringify([...seen]));

            console.log("🆕", title);

            const seriesName = title.split(" الحلقة ")[0] || "مسلسل جديد";

            const caption = `🎬🔥 حلقة جديدة نزلت الآن! 🔥🎬

📺 اسم المسلسل: ${seriesName}
🎞️ الحلقة: ${title}
📡 المصدر: ${source}

🔗 الرابط:
${link}

━━━━━━━━━━━━━━━
🧑🏻‍💻 بوت مقهى فور جي نت
━━━━━━━━━━━━━━━`;

            try {
                if (img) {
                    const media = await MessageMedia.fromUrl(img);

                    for (let num of NUMBERS) {
                        await client.sendMessage(num, media, { caption });
                    }
                } else {
                    for (let num of NUMBERS) {
                        await client.sendMessage(num, caption);
                    }
                }
            } catch (err) {
                console.log("❌ فشل إرسال:", err.message);
            }
        }
    }
}

client.initialize();
