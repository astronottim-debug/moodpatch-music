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

        // Jika Lifetime (Multi-use / Tidak pernah kadaluarsa dan tidak di-lock)
        if (tokenData.type === 'lifetime') {
            return res.status(200).json({ valid: true, type: 'lifetime', message: 'Akses Istimewa Diberikan!' });
        }

        // Jika Standard (Single-use / Sekali pakai)
        if (tokenData.type === 'standard') {
            const LIMIT_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari
            
            if (tokenData.used) {
                const expiresAt = tokenData.usedAt + LIMIT_MS;
                if (Date.now() > expiresAt) {
                    return res.status(401).json({ valid: false, message: 'Sisa waktumu habis.' });
                } else {
                    return res.status(200).json({ valid: true, type: 'standard', expiresAt: expiresAt, message: 'Selamat datang kembali!' });
                }
            } else {
                const now = Date.now();
                const expiresAt = now + LIMIT_MS;
                // Kunci token agar ditandai sudah mulai berjalan waktunya
                await kv.hset('tokens', {
                    [token]: { type: 'standard', used: true, usedAt: now }
                });
                return res.status(200).json({ valid: true, type: 'standard', expiresAt: expiresAt, message: 'Akses Diberikan!' });
            }
        }

        return res.status(401).json({ valid: false, message: 'Token rusak.' });
    } catch (error) {
        console.error("KV Error:", error);
        return res.status(500).json({ valid: false, message: 'Terjadi kesalahan pada server database.' });
    }
}
