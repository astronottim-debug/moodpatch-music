export default function handler(req, res) {
    // Vercel Serverless Function untuk memvalidasi token
    
    // Pastikan metode yang masuk adalah POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
    }

    try {
        // Ambil data token dari body (bisa berbentuk JSON string atau object tergantung header)
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const token = body.token;

        // Daftar token rahasia yang sah (moodpatch-angka unik 4 digit)
        const validTokens = [
            'moodpatch-1849',
            'moodpatch-9274',
            'moodpatch-3012',
            'moodpatch-8422',
            'moodpatch-5190'
        ];

        // Pencocokan Token
        if (validTokens.includes(token)) {
            // Berhasil
            return res.status(200).json({ valid: true, message: 'Akses Diberikan!' });
        } else {
            // Gagal
            return res.status(401).json({ valid: false, message: 'Token tidak valid atau salah.' });
        }
    } catch (error) {
        return res.status(400).json({ valid: false, message: 'Permintaan ditolak.' });
    }
}
