export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
    }

    try {
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

        // Daftar token istimewa tanpa batas waktu
        const lifetimeTokens = [
            'moodpatch cfo',
            'moodpatch cto',
            'moodpatch cmo',
            'moodpatch ceo',
            'moodpatch coo',
            'gendhing bahana berbudaya',
            'berbudaya'
        ];

        // Pencocokan Token
        if (lifetimeTokens.includes(token)) {
            // Berhasil (Akses Tanpa Batas)
            return res.status(200).json({ valid: true, type: 'lifetime', message: 'Akses Istimewa Diberikan!' });
        } else if (validTokens.includes(token)) {
            // Berhasil (Akses 3 Hari)
            return res.status(200).json({ valid: true, type: 'standard', message: 'Akses Diberikan!' });
        } else {
            // Gagal
            return res.status(401).json({ valid: false, message: 'Token tidak valid atau salah.' });
        }
    } catch (error) {
        return res.status(400).json({ valid: false, message: 'Permintaan ditolak.' });
    }
}