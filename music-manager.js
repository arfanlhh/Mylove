// Global Music Manager - Untuk kontinuitas musik antar halaman
class MusicManager {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.3;
        this.currentSongIndex = 0;
        this.songs = [
            {
                url: 'lagu.mp3',
                title: 'Lagu Kesayangan Kita',
                artist: 'Our Love Song'
            },
            {
                url: '@vancouversleepclinic - Someone to Stay (Lyrics) [PpLJonoxbyQ].mp3',
                title: 'Someone to Stay',
                artist: 'Vancouver Sleep Clinic'
            }
        ];
        
        // Load saved state
        this.loadState();
        this.initAudio();
    }

    initAudio() {
        // Hapus audio yang ada jika ada
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        // Buat audio element baru
        this.audio = new Audio(this.getCurrentSong().url);
        this.audio.loop = true;
        this.audio.volume = this.volume;
        
        // Set current time dari localStorage
        this.audio.currentTime = this.currentTime;

        // Event listeners
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.saveState();
        });

        this.audio.addEventListener('loadeddata', () => {
            if (this.isPlaying) {
                this.audio.currentTime = this.currentTime;
                this.audio.play().catch(e => {
                    console.log('Auto-play prevented');
                    this.waitForUserInteraction();
                });
            }
        });

        this.audio.addEventListener('canplaythrough', () => {
            if (this.isPlaying && this.audio.paused) {
                this.audio.currentTime = this.currentTime;
                this.audio.play().catch(e => {
                    console.log('Auto-play prevented');
                    this.waitForUserInteraction();
                });
            }
        });

        // Resume jika sedang playing
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log('Auto-play prevented'));
        }
    }

    play() {
        if (this.audio) {
            this.audio.currentTime = this.currentTime;
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.saveState();
                this.updateAllControls();
            }).catch(e => console.log('Play failed:', e));
        }
    }

    pause() {
        if (this.audio) {
            this.currentTime = this.audio.currentTime;
            this.audio.pause();
            this.isPlaying = false;
            this.saveState();
            this.updateAllControls();
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    mute() {
        if (this.audio) {
            this.audio.muted = !this.audio.muted;
            this.saveState();
        }
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.audio) {
            this.audio.volume = vol;
        }
        this.saveState();
    }

    getCurrentSong() {
        return this.songs[this.currentSongIndex];
    }

    nextSong() {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.changeSong();
    }

    prevSong() {
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.changeSong();
    }

    changeSong() {
        const wasPlaying = this.isPlaying;
        this.currentTime = 0; // Reset time untuk lagu baru
        
        if (this.audio) {
            this.audio.pause();
        }
        
        this.initAudio();
        
        if (wasPlaying) {
            this.play();
        }
        
        this.updateSongInfo();
        this.saveState();
    }

    updateSongInfo() {
        const currentSong = this.getCurrentSong();
        
        // Update song info di beranda
        const songTitle = document.querySelector('.song-title');
        const artistName = document.querySelector('.artist-name');
        
        if (songTitle) songTitle.textContent = currentSong.title;
        if (artistName) artistName.textContent = currentSong.artist;
        
        // Update tooltip untuk music toggle button
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
            musicToggle.title = `${currentSong.title} - ${currentSong.artist}`;
        }
    }

    saveState() {
        const state = {
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            volume: this.volume,
            muted: this.audio ? this.audio.muted : false,
            currentSongIndex: this.currentSongIndex
        };
        localStorage.setItem('musicState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('musicState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.isPlaying = state.isPlaying || false;
            this.currentTime = state.currentTime || 0;
            this.volume = state.volume || 0.3;
            this.currentSongIndex = state.currentSongIndex || 0;
        }
    }

    updateAllControls() {
        // Update semua kontrol di halaman
        const playPauseBtn = document.getElementById('playPauseBtn');
        const musicToggle = document.getElementById('musicToggle');
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');

        if (playPauseBtn) {
            if (this.isPlaying) {
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline';
                playPauseBtn.classList.add('playing');
            } else {
                if (playIcon) playIcon.style.display = 'inline';
                if (pauseIcon) pauseIcon.style.display = 'none';
                playPauseBtn.classList.remove('playing');
            }
        }

        if (musicToggle) {
            if (this.isPlaying) {
                musicToggle.textContent = '🎶';
                musicToggle.classList.add('playing');
            } else {
                musicToggle.textContent = '🎵';
                musicToggle.classList.remove('playing');
            }
        }
    }

    // Method untuk inisialisasi ketika halaman dimuat
    initPage() {
        // Update semua kontrol sesuai state saat ini
        this.updateAllControls();
        this.updateSongInfo();
        
        // Auto-start music if this is the first visit or if it was previously playing
        if (!this.hasUserInteracted()) {
            // First visit - start music automatically
            setTimeout(() => {
                this.play();
            }, 1000); // Delay 1 detik untuk memastikan halaman sudah dimuat
        } else if (this.isPlaying) {
            // Continue playing if it was playing before
            setTimeout(() => {
                if (this.audio && this.audio.paused) {
                    this.audio.currentTime = this.currentTime;
                    this.audio.play().catch(e => {
                        console.log('Auto-play prevented, waiting for user interaction');
                        this.waitForUserInteraction();
                    });
                }
            }, 500);
        }
    }

    hasUserInteracted() {
        return localStorage.getItem('musicState') !== null;
    }

    waitForUserInteraction() {
        const startOnInteraction = () => {
            if (this.isPlaying && this.audio && this.audio.paused) {
                this.audio.currentTime = this.currentTime;
                this.audio.play().catch(e => console.log('Play failed:', e));
            }
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
            document.removeEventListener('touchstart', startOnInteraction);
        };
        
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
        document.addEventListener('touchstart', startOnInteraction);
    }
}

// Navigation Manager - untuk tracking halaman sebelumnya
class NavigationManager {
    constructor() {
        this.trackNavigation();
    }

    trackNavigation() {
        // Simpan halaman sebelumnya
        const previousPage = sessionStorage.getItem('currentPage');
        const currentPage = window.location.pathname;
        
        console.log('Navigation tracking - Previous:', previousPage, 'Current:', currentPage);
        
        if (previousPage && previousPage !== currentPage) {
            sessionStorage.setItem('previousPage', previousPage);
        }
        
        sessionStorage.setItem('currentPage', currentPage);
    }

    goBack() {
        const previousPage = sessionStorage.getItem('previousPage');
        if (previousPage && previousPage !== window.location.pathname) {
            window.location.href = previousPage;
        } else {
            // Fallback ke beranda jika tidak ada halaman sebelumnya
            window.location.href = 'beranda.html';
        }
    }

    updateBackButtons() {
        const backButtons = document.querySelectorAll('.back-btn');
        backButtons.forEach(btn => {
            const previousPage = sessionStorage.getItem('previousPage');
            if (previousPage && previousPage !== window.location.pathname) {
                // Update text untuk menunjukkan halaman sebelumnya
                const previousPageName = this.getPageName(previousPage);
                btn.innerHTML = `← Kembali ke ${previousPageName}`;
                
                // Update href
                btn.href = '#';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.goBack();
                });
            }
        });
    }

    getPageName(path) {
        const pageNames = {
            'beranda.html': 'Beranda',
            'alvira.html': 'Menu Utama',
            'pantai.html': 'Kenangan Bersama',
            'romantis.html': 'Momen Romantis'
        };
        
        const filename = path.split('/').pop();
        return pageNames[filename] || 'Halaman Sebelumnya';
    }
}

// Buat instance global
window.musicManager = new MusicManager();
window.navigationManager = new NavigationManager();

// Inisialisasi ketika DOM dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, current page:', window.location.pathname);
    window.musicManager.initPage();
    window.navigationManager.updateBackButtons();
    
    // Setup event listeners untuk kontrol musik
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const musicToggle = document.getElementById('musicToggle');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            window.musicManager.toggle();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            window.musicManager.mute();
        });
    }

    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            window.musicManager.toggle();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            window.musicManager.nextSong();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            window.musicManager.prevSong();
        });
    }

});

// Simpan state sebelum halaman ditutup
window.addEventListener('beforeunload', function() {
    if (window.musicManager) {
        window.musicManager.saveState();
    }
});


