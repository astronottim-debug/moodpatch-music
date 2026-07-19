import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const token = body.token;

        if (!token) return res.status(400).json({ valid: false, message: 'Token kosong.' });

        // Cek token di Vercel KV
        // Format key di KV: "tokens" (sebuah Hash)
        // HGET tokens "moodpatch-1234" -> { type: 'standard', used: false }
        const tokenData = await kv.hget('tokens', token);

        if (!tokenData) {
            return res.status(401).json({ valid: false, message: 'Token tidak ditemukan atau salah.' });
        }

        if (tokenData.used) {
            return res.status(401).json({ valid: false, message: 'Maaf, token ini sudah pernah dipakai.' });
        }

        // Jika Lifetime (Multi-use / Tidak pernah kadaluarsa dan tidak di-lock)
        if (tokenData.type === 'lifetime') {
            return res.status(200).json({ valid: true, type: 'lifetime', message: 'Akses Istimewa Diberikan!' });
        }

        // Jika Standard (Single-use / Sekali pakai)
        if (tokenData.type === 'standard') {
            // Kunci token agar tidak bisa dipakai orang lain lagi
            await kv.hset('tokens', {
                [token]: { type: 'standard', used: true, usedAt: Date.now() }
            });
            return res.status(200).json({ valid: true, type: 'standard', message: 'Akses Diberikan!' });
        }

        return res.status(401).json({ valid: false, message: 'Token rusak.' });
    } catch (error) {
        console.error("KV Error:", error);
        return res.status(500).json({ valid: false, message: 'Terjadi kesalahan pada server database.' });
    }
}
