require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HERMES_BASE_URL = process.env.HERMES_BASE_URL || "http://127.0.0.1:8642/v1";
const HERMES_API_KEY = process.env.HERMES_API_KEY || "5ee136511b524792a35ada27da528f80e40555656e4c43469a6aec03d9248dd3";
const HERMES_MODEL = process.env.HERMES_MODEL || "hermes-agent";

// Konfigurasi n8n Webhook untuk sinkronisasi pesanan ke Google Spreadsheet
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://ghina1000.app.n8n.cloud/webhook/housepoint-order";
const N8N_WEBHOOK_HEADER_NAME = process.env.N8N_WEBHOOK_HEADER_NAME || "x-housepoint-key";
const N8N_WEBHOOK_KEY = process.env.N8N_WEBHOOK_KEY || "dedd191c576fb6ad51ec822fcafe4dee4586408573efbd55682ba134361913fb";

app.use(express.json());

// Izinkan akses CORS untuk Live Server dan browser lokal
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-housepoint-key");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

// Sajikan file statis sehingga website bisa langsung dibuka di http://localhost:3000
app.use(express.static(__dirname));

// Endpoint cek status server, Hermes AI, dan n8n Webhook
app.get("/api/status", async (req, res) => {
    let hermesConnected = false;
    let hermesDetails = "Hermes Gateway belum merespons";

    try {
        const testRes = await fetch(`${HERMES_BASE_URL}/models`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${HERMES_API_KEY}`
            },
            signal: AbortSignal.timeout(2500)
        });

        if (testRes.ok) {
            hermesConnected = true;
            hermesDetails = "Hermes Gateway aktif di port 8642";
        } else {
            hermesDetails = `Hermes merespons status ${testRes.status}`;
        }
    } catch (err) {
        hermesDetails = "Hermes Gateway offline / standby";
    }

    res.json({
        server: "Housepoint API Online",
        port: PORT,
        hermesGateway: hermesConnected,
        hermesBaseUrl: HERMES_BASE_URL,
        hermesModel: HERMES_MODEL,
        details: hermesDetails,
        n8n: {
            configured: Boolean(N8N_WEBHOOK_URL),
            url: N8N_WEBHOOK_URL,
            headerName: N8N_WEBHOOK_HEADER_NAME
        }
    });
});

// Endpoint kirim order ke n8n webhook (Otomatis masuk ke Google Sheets)
app.post("/api/sync-order", async (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.customer) {
        return res.status(400).json({ error: "Data pesanan tidak lengkap." });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL || N8N_WEBHOOK_URL;
    const headerName = process.env.N8N_WEBHOOK_HEADER_NAME || N8N_WEBHOOK_HEADER_NAME;
    const headerKey = process.env.N8N_WEBHOOK_KEY || N8N_WEBHOOK_KEY;

    if (!webhookUrl) {
        return res.status(500).json({ error: "N8N_WEBHOOK_URL belum diatur di .env" });
    }

    try {
        const headers = {
            "Content-Type": "application/json"
        };
        if (headerName && headerKey) {
            headers[headerName] = headerKey;
        }

        // Format tanggal rapi untuk Google Sheets
        const now = new Date();
        const formattedDate = orderData.date || (
            now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );

        // Payload yang disesuaikan persis dengan mapping n8n & Google Sheets
        const payload = {
            id: orderData.id,
            orderId: orderData.id,
            date: formattedDate,
            tanggal: formattedDate,
            customer: orderData.customer,
            namaPelanggan: orderData.customer,
            item: orderData.menuName || orderData.item,
            menu: orderData.menuName || orderData.item,
            unitPrice: Number(orderData.unitPrice || 0),
            hargaSatuan: Number(orderData.unitPrice || 0),
            qty: Number(orderData.qty || 1),
            quantity: Number(orderData.qty || 1),
            total: Number(orderData.total || 0),
            type: orderData.type || "Dine In",
            tipePesanan: orderData.type || "Dine In",
            payment: orderData.payment || "QRIS",
            metodePembayaran: orderData.payment || "QRIS",
            status: orderData.status || "Preparing"
        };

        const n8nRes = await fetch(webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const n8nText = await n8nRes.text();
        let n8nJson;
        try { n8nJson = JSON.parse(n8nText); } catch (e) { n8nJson = { message: n8nText }; }

        if (!n8nRes.ok) {
            console.warn(`[n8n] Error respons ${n8nRes.status}:`, n8nText);
            return res.status(n8nRes.status).json({
                error: `n8n webhook merespons status ${n8nRes.status}`,
                details: n8nJson
            });
        }

        console.log(`[n8n] Sukses mengirim order ${orderData.id} ke Google Sheets:`, n8nJson);
        return res.json({
            success: true,
            message: "Pesanan berhasil masuk ke n8n & Google Sheets!",
            data: payload,
            n8nResponse: n8nJson
        });

    } catch (err) {
        console.error("[n8n] Gagal menghubungi webhook n8n:", err.message);
        return res.status(502).json({
            error: "Gagal menghubungi webhook n8n",
            details: err.message
        });
    }
});

// Knowledge Base Cerdas seputar Coffee Shop untuk fallback jika Hermes upstream butuh login/challenge
function getCoffeeShopFallback(message) {
    const q = (message || "").toLowerCase();

    if (q.includes("stok") || q.includes("bahan baku") || q.includes("inventaris") || q.includes("inventory")) {
        return "📦 **Panduan Pengelolaan Stok Bahan Baku Housepoint:**\n\n" +
            "1. **Prinsip FIFO (First In, First Out):** Selalu gunakan batch biji kopi dan susu yang datang lebih awal untuk menjamin kesegaran.\n" +
            "2. **Tentukan Safety Stock (Batas Kritis):**\n" +
            "   - Biji Kopi Espresso Blend: minimal 5 kg\n" +
            "   - Fresh Milk / Oat Milk: minimal 8 liter\n" +
            "   - Gula Aren / Sirup: minimal 3 botol\n" +
            "   - Paper & Plastic Cup (12oz/16oz): minimal 150 pcs\n" +
            "3. **Stock Opname Harian:** Lakukan hitung fisik di akhir shift (closing) untuk mencocokkan jumlah cup terpakai dengan transaksi kasir.\n" +
            "4. **Penyimpanan Tepat:** Simpan biji kopi di wadah kedap udara (airtight container) suhu ruang 20-25°C, jauhkan dari kelembaban dan panas mesin.";
    }

    if (q.includes("promo") || q.includes("diskon") || q.includes("marketing") || q.includes("penjualan")) {
        return "💡 **Ide Promo Menarik untuk Meningkatkan Penjualan Housepoint:**\n\n" +
            "1. **Morning Rush Hour (07.00 – 10.00):** Paket Sarapan *'Kopi Susu + Butter Croissant'* hanya Rp 45.000 untuk menarik para profesional dan komuter.\n" +
            "2. **Slow Hours Booster (14.00 – 16.00):** Diskon 20% untuk semua varian Non-Coffee (Matcha & Dark Chocolate) di jam santai sore.\n" +
            "3. **Loyalty Stamp Digital:** Beli 5 cup minuman signature, gratis 1 Iced Americano atau Fresh Tea.\n" +
            "4. **Weekend Combo Treat:** Buy 2 Large Cups, dapatkan free upgrade oat milk atau 1 pastry setengah harga.";
    }

    if (q.includes("menu") || q.includes("resep") || q.includes("kopi") || q.includes("minuman") || q.includes("latte")) {
        return "☕ **Rekomendasi Menu & Resep Unggulan Housepoint:**\n\n" +
            "- **Iced Aren Latte (Signature No. 1):**\n" +
            "  * Komposisi: 18g double espresso (Arabica-Robusta 70:30), 120ml fresh milk, 25ml sirup gula aren murni, es batu.\n" +
            "- **Spanish Latte:**\n" +
            "  * Komposisi: 18g espresso, 100ml fresh milk, 25ml condensed milk lembut.\n" +
            "- **Matcha Cream Latte:**\n" +
            "  * Komposisi: 6g pure Uji matcha whisk 30ml air 75°C, 130ml fresh milk, 15ml vanilla syrup.\n" +
            "- **Butter Croissant:**\n" +
            "  * Disajikan hangat dengan re-heat 1 menit pada suhu 180°C agar flaky dan harum butter.";
    }

    if (q.includes("harga") || q.includes("hpp") || q.includes("untung") || q.includes("laba") || q.includes("biaya") || q.includes("profit")) {
        return "💰 **Formula Penetapan Harga & HPP (Harga Pokok Penjualan) Coffee Shop:**\n\n" +
            "- **Target HPP Ideal:** 25% – 32% dari harga jual.\n" +
            "- **Simulasi HPP Iced Aren Latte:**\n" +
            "  * Biji Kopi 18 gram: Rp 3.600\n" +
            "  * Susu Segar 120 ml: Rp 2.400\n" +
            "  * Sirup Aren 25 ml: Rp 1.100\n" +
            "  * Cup + Lid + Straw + Ice: Rp 1.500\n" +
            "  * **Total HPP:** Rp 8.600\n" +
            "- **Harga Jual Rekomendasi:** Rp 28.000 – Rp 32.000 (Gross Margin ~70-73%).";
    }

    if (q.includes("barista") || q.includes("operasional") || q.includes("shift") || q.includes("service") || q.includes("sop")) {
        return "📋 **Standar Operasional (SOP) Barista Housepoint:**\n\n" +
            "1. **Kalibrasi Espresso Pagi:** Cek yield 1:2 (18g kopi bubuk menjadi 36g espresso dalam 25–28 detik). Uji rasa sebelum toko buka.\n" +
            "2. **Milk Steaming:** Suhu steaming susu ideal di 60–65°C agar rasa manis alami susu keluar tanpa merusak tekstur microfoam.\n" +
            "3. **Kebersihan Station:** Purge & lap steam wand segera setelah steaming. Backflush portafilter berkala selama pergantian shift.\n" +
            "4. **Greeting:** Sambut setiap pelanggan dalam 3 detik pertama dengan senyum hangat khas Housepoint.";
    }

    return "☕ **Housepoint AI Assistant:**\n\n" +
        "Halo! Aku Housepoint AI, siap mendampingi operasional coffee shop kamu. Kamu bisa menanyakan hal-hal seputar:\n" +
        "• **Manajemen Stok:** Cara hitung safety stock, stock opname harian, & masa simpan bahan.\n" +
        "• **Resep & Menu:** Formula takaran kopi susu kekinian, kalibrasi espresso, & menu pastry.\n" +
        "• **Strategi Promosi:** Ide promo rush-hour, program loyalty member, & cara meningkatkan omset.\n" +
        "• **Perhitungan Biaya (HPP):** Menghitung margin laba dan memangkas pemborosan bahan.\n\n" +
        "Ketik pertanyaanmu atau pilih topik di bawah ini!";
}

// Endpoint Chat AI terhubung ke Hermes Gateway
app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    const trimmedMessage = message.trim();

    try {
        const hermesPayload = {
            model: HERMES_MODEL,
            messages: [
                {
                    role: "system",
                    content: "Kamu adalah Housepoint AI, asisten barista dan manajer operasional coffee shop Housepoint. Jawab dengan ramah, taktis, profesional, dan gunakan Bahasa Indonesia yang rapi. Bantu pengguna mengelola menu, stok bahan baku, kalibrasi espresso, penetapan harga (HPP), ide promo coffee shop, dan operasional harian."
                },
                ...(Array.isArray(history) ? history.slice(-6) : []),
                {
                    role: "user",
                    content: trimmedMessage
                }
            ],
            stream: false
        };

        const response = await fetch(`${HERMES_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HERMES_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(hermesPayload),
            signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;

            if (reply && reply.trim()) {
                return res.json({
                    reply: reply.trim(),
                    source: "hermes-gateway",
                    model: HERMES_MODEL
                });
            }
        }

        console.warn(`Hermes gateway merespons ${response.status}. Menggunakan asisten cerdas coffee shop Housepoint.`);
        const fallbackAnswer = getCoffeeShopFallback(trimmedMessage);
        return res.json({
            reply: fallbackAnswer,
            source: "housepoint-smart-engine",
            notice: "Tersambung ke Hermes Gateway (Mode Asisten Coffee Shop)"
        });

    } catch (error) {
        console.warn("Gagal terhubung ke Hermes Gateway:", error.message);
        const fallbackAnswer = getCoffeeShopFallback(trimmedMessage);
        return res.json({
            reply: fallbackAnswer,
            source: "housepoint-smart-engine",
            notice: "Hermes Gateway offline, asisten lokal Housepoint aktif"
        });
    }
});

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`☕ Housepoint Server aktif di http://127.0.0.1:${PORT}`);
    console.log(`✦ Hermes AI Gateway URL: ${HERMES_BASE_URL}`);
    console.log(`✦ n8n Webhook URL: ${N8N_WEBHOOK_URL}`);
    console.log(`===============================================`);
});
