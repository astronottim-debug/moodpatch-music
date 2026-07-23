document.addEventListener('DOMContentLoaded', () => {
    // === UI Elements ===
    const tokenGate = document.getElementById('token-gate');
    const tokenInput = document.getElementById('token-input');
    const tokenSubmit = document.getElementById('token-submit');
    const tokenError = document.getElementById('token-error');
    
    // === Timer UI ===
    const countdownEl = document.getElementById('countdown');
    const overlayEl = document.getElementById('expiration-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const reloginBtn = document.getElementById('relogin-btn');

    // === Player Elements ===
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play');
    const playIcon = document.getElementById('play-icon');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const progressSlider = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const albumArt = document.getElementById('album-art');
    const volumeSlider = document.getElementById('volume');
    const shuffleBtn = document.getElementById('shuffle');
    const repeatBtn = document.getElementById('repeat');
    
    // === Keys ===
    const TOKEN_KEY = 'moodpatch_valid_token';
    const EXPIRATION_KEY = 'moodpatch_token_expiration'; // New key
    const TYPE_KEY = 'moodpatch_token_type'; // New key
    const LIMIT_MS = 3 * 24 * 60 * 60 * 1000;
    
    let expirationTime = null;
    let timerInterval = null;


    // Fungsi Tekan Enter untuk Masuk
    tokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            tokenSubmit.click();
        }
    });

    // Fungsi Validasi Token ke Server
    tokenSubmit.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        if (!token) return;

        tokenSubmit.innerText = "Memeriksa...";
        tokenSubmit.disabled = true;

        try {
            // Memanggil Vercel Serverless Function
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await res.json();

            if (data.valid) {
                // Sukses
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(TYPE_KEY, data.type || 'standard');
                if (data.expiresAt) {
                    localStorage.setItem(EXPIRATION_KEY, data.expiresAt);
                }
                tokenGate.classList.add('hidden');
                tokenError.classList.add('hidden');
                startSession(data.type || 'standard');
            } else {
                // Gagal
                tokenError.classList.remove('hidden');
                tokenError.innerText = data.message || "Token tidak valid.";
            }
        } catch (error) {
            tokenError.classList.remove('hidden');
            tokenError.innerText = "Gagal terhubung ke server.";
        }

        tokenSubmit.innerText = "Masuk";
        tokenSubmit.disabled = false;
    });

    function startSession(type = 'standard') {
        if (type === 'lifetime') {
            countdownEl.innerText = "Akses Unlimited";
            countdownEl.style.color = "var(--primary)";
            return; // Berhenti di sini, tidak ada hitung mundur
        }

        // Ambil waktu kedaluwarsa dari localStorage (berasal dari Server Vercel KV)
        expirationTime = parseInt(localStorage.getItem(EXPIRATION_KEY), 10);

        if (!expirationTime || isNaN(expirationTime)) {
            // Fallback aman jika gagal
            expirationTime = Date.now() + LIMIT_MS;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // === Logout Logic ===
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Hapus semua data dari localStorage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRATION_KEY);
            localStorage.removeItem(TYPE_KEY);
            
            // Hentikan timer dan musik
            clearInterval(timerInterval);
            if (!audio.paused) togglePlay();
            audio.currentTime = 0;
            
            // Tampilkan kembali gerbang token
            tokenGate.classList.remove('hidden');
            document.documentElement.classList.remove('logged-in');
            overlayEl.classList.add('hidden');
        });
    }

    // === Relogin Logic (dari layar waktu habis) ===
    if (reloginBtn) {
        reloginBtn.addEventListener('click', () => {
            // Hapus semua data dari localStorage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRATION_KEY);
            localStorage.removeItem(TYPE_KEY);

            // Sembunyikan overlay kedaluwarsa
            overlayEl.classList.add('hidden');

            // Tampilkan kembali gerbang token
            tokenGate.classList.remove('hidden');
            document.documentElement.classList.remove('logged-in');

            // Reset input field
            tokenInput.value = '';
            tokenError.classList.add('hidden');
        });
    }

    // === Cek apakah sudah login sebelumnya (HARUS setelah semua listener terpasang) ===
    if (localStorage.getItem(TOKEN_KEY) && (localStorage.getItem(EXPIRATION_KEY) || localStorage.getItem(TYPE_KEY) === 'lifetime')) {
        tokenGate.classList.add('hidden');
        startSession(localStorage.getItem(TYPE_KEY) || 'standard');
    }

    function updateTimer() {
        const now = Date.now();
        const diff = expirationTime - now;

        if (diff <= 0) {
            // Expired
            countdownEl.innerText = "Berakhir";
            overlayEl.classList.remove('hidden');
            try {
                if (audio && !audio.paused) {
                    togglePlay();
                }
            } catch(e) { /* safety */ }
            clearInterval(timerInterval);
            return;
        }

        // Calculate time left
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.innerText = `${days}h ${hours}j ${minutes}m ${seconds}d`;
    }




    // === Player Logic ===

    const songs = [
        {
            title: 'Gamelan',
            artist: 'Karyaku',
            src: 'https://res.cloudinary.com/uvrpnw8s/video/upload/v1783675090/gamelan-indah_kyh9cw.mp3'
        },
        {
            title: 'Gamelan Modern',
            artist: 'Karyaku',
            src: 'https://res.cloudinary.com/uvrpnw8s/video/upload/v1783677929/videoplayback_m1mdce.mp4'
        },
        {
            title: 'Gamelan Ketenangan',
            artist: 'MoodPatch Originals',
            src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2e2cc2eb10.mp3?filename=gamelan-loop-1-124083.mp3'
        },
        {
            title: 'Alus & Sabar',
            artist: 'MoodPatch Originals',
            src: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_34b46c6530.mp3?filename=gamelan-loop-2-121650.mp3'
        },
        {
            title: 'Harmoni Malam',
            artist: 'MoodPatch Originals',
            src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=gamelan-14986.mp3'
        }
    ];

    let songIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;

    let currentObjectUrl = null;

    async function loadSong(song) {
        document.querySelector('.song-title').innerText = song.title;
        document.querySelector('.artist-name').innerText = song.artist;
        
        progressSlider.value = 0;
        currentTimeEl.innerText = "0:00";
        durationEl.innerText = "Memuat...";

        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }

        try {
            // Use Blob URL for local files to fix seeking/Range request issues
            if (!song.src.startsWith('http')) {
                const response = await fetch(song.src);
                const blob = await response.blob();
                currentObjectUrl = URL.createObjectURL(blob);
                audio.src = currentObjectUrl;
            } else {
                audio.src = song.src;
            }
        } catch (error) {
            console.error("Error loading audio:", error);
            audio.src = song.src;
        }
    }

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            playIcon.innerText = 'play_arrow';
            albumArt.classList.remove('playing');
        } else {
            audio.play().catch(e => console.log('Autoplay prevented', e));
            playIcon.innerText = 'pause';
            albumArt.classList.add('playing');
        }
        isPlaying = !isPlaying;
    }

    function prevSong() {
        songIndex--;
        if (songIndex < 0) {
            songIndex = songs.length - 1;
        }
        loadSong(songs[songIndex]);
        if (isPlaying) {
            audio.play();
        }
    }

    function nextSong() {
        if (isShuffle) {
            let newIndex = songIndex;
            while(newIndex === songIndex) {
                newIndex = Math.floor(Math.random() * songs.length);
            }
            songIndex = newIndex;
        } else {
            songIndex++;
            if (songIndex > songs.length - 1) {
                songIndex = 0;
            }
        }
        loadSong(songs[songIndex]);
        if (isPlaying) {
            audio.play();
        }
    }

    let isDraggingProgress = false;
    let wasPlayingBeforeDrag = false;

    function updateProgress() {
        const duration = audio.duration;
        const currentTime = audio.currentTime;
        if (isNaN(duration)) return;
        
        if (!isDraggingProgress) {
            const progressPercent = (currentTime / duration) * 100;
            progressSlider.value = progressPercent;
            progressSlider.style.background = `linear-gradient(to right, var(--primary) ${progressPercent}%, rgba(123, 86, 56, 0.15) ${progressPercent}%)`;
        }

        currentTimeEl.innerText = formatTime(currentTime);
        durationEl.innerText = formatTime(duration);
    }

    // Smooth animation loop using requestAnimationFrame (60fps) instead of timeupdate
    function progressLoop() {
        if (!audio.paused || isDraggingProgress) {
            updateProgress();
        }
        requestAnimationFrame(progressLoop);
    }
    requestAnimationFrame(progressLoop);

    function setProgress(e) {
        const duration = audio.duration;
        if (duration && isFinite(duration)) {
            const val = parseFloat(e.target.value);
            audio.currentTime = (val / 100) * duration;
        }
    }

    function formatTime(time) {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        let sec = Math.floor(time % 60);
        if (sec < 10) {
            sec = `0${sec}`;
        }
        return `${min}:${sec}`;
    }

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    
    // audio.addEventListener('timeupdate', updateProgress); replaced by requestAnimationFrame
    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextSong();
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        durationEl.innerText = formatTime(audio.duration);
    });

    progressSlider.addEventListener('input', (e) => {
        if (!isDraggingProgress) {
            isDraggingProgress = true;
            wasPlayingBeforeDrag = !audio.paused;
            if (wasPlayingBeforeDrag) {
                audio.pause();
            }
        }
        setProgress(e);
        progressSlider.style.background = `linear-gradient(to right, var(--primary) ${e.target.value}%, rgba(123, 86, 56, 0.15) ${e.target.value}%)`;
    });
    progressSlider.addEventListener('change', (e) => {
        if (isDraggingProgress) {
            setProgress(e);
            progressSlider.style.background = `linear-gradient(to right, var(--primary) ${e.target.value}%, rgba(123, 86, 56, 0.15) ${e.target.value}%)`;
            if (wasPlayingBeforeDrag) {
                audio.play().catch(e => console.log(e));
            }
            isDraggingProgress = false;
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        volumeSlider.style.background = `linear-gradient(to right, var(--primary) ${e.target.value * 100}%, rgba(123, 86, 56, 0.15) ${e.target.value * 100}%)`;
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.style.color = isShuffle ? 'var(--primary)' : '';
    });

    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.style.color = isRepeat ? 'var(--primary)' : '';
        // If repeat is active, we loop the audio
        audio.loop = isRepeat;
    });
    
    // Load first song on startup
    loadSong(songs[songIndex]);
});
