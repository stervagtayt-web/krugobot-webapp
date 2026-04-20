const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Состояние
let mediaRecorder = null;
let recordedChunks = [];
let currentVideoIndex = 0;
let currentVideoId = null;

// Тестовые видео (пока нет реальных)
const VIDEOS = [
    { id: 1, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', isReply: false },
    { id: 2, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', isReply: true },
    { id: 3, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', isReply: false }
];

// Инициализация
const initData = tg.initDataUnsafe || {};
const user = initData.user || { first_name: 'Гость' };
document.getElementById('user-greeting').textContent = `Привет, ${user.first_name}!`;

// Тема
document.body.style.backgroundColor = tg.themeParams.bg_color || '#1a1a2e';
document.body.style.color = tg.themeParams.text_color || '#ffffff';

// === НАВИГАЦИЯ ===
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
}

document.getElementById('watch-btn').addEventListener('click', () => {
    showScreen('watch-screen');
    currentVideoIndex = 0;
    playVideo(VIDEOS[0]);
});

document.getElementById('rules-btn').addEventListener('click', () => {
    showScreen('rules-screen');
});

document.getElementById('support-btn').addEventListener('click', () => {
    tg.openTelegramLink('https://t.me/krugobot_news?direct');
});

document.getElementById('back-from-watch').addEventListener('click', () => {
    showScreen('main-screen');
});

document.getElementById('back-from-rules').addEventListener('click', () => {
    showScreen('main-screen');
});

// === ЗАПИСЬ КРУЖКА ===
document.getElementById('record-btn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 720, height: 720, aspectRatio: 1 }, 
            audio: true 
        });
        
        const preview = document.getElementById('preview');
        preview.srcObject = stream;
        document.getElementById('video-preview').style.display = 'block';
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // Отправляем боту
            const reader = new FileReader();
            reader.onload = () => {
                tg.sendData(JSON.stringify({ 
                    action: 'video_recorded',
                    video: reader.result
                }));
            };
            reader.readAsDataURL(blob);
            
            tg.showPopup({ message: '✅ Кружок записан! Отправка...' });
            preview.srcObject.getTracks().forEach(t => t.stop());
            document.getElementById('video-preview').style.display = 'none';
        };
        
        mediaRecorder.start();
        tg.showPopup({ message: '🎥 Идёт запись...' });
        
        // Автостоп через 10 секунд
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, 10000);
        
    } catch (e) {
        tg.showPopup({ message: '❌ Нет доступа к камере' });
    }
});

document.getElementById('stop-record').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
});

// === ПРОСМОТР ВИДЕО ===
function playVideo(video) {
    currentVideoId = video.id;
    const videoEl = document.getElementById('current-video');
    videoEl.src = video.url;
    videoEl.play();
    document.getElementById('video-badge').textContent = 
        video.isReply ? '📬 Вам ответили!' : '🎲 Случайный кружок';
}

document.getElementById('next-btn').addEventListener('click', () => {
    currentVideoIndex++;
    if (currentVideoIndex < VIDEOS.length) {
        playVideo(VIDEOS[currentVideoIndex]);
    } else {
        tg.showPopup({ message: '📭 Кружки закончились' });
        showScreen('main-screen');
    }
});

document.getElementById('like-btn').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: 'like', video_id: currentVideoId }));
    tg.showPopup({ message: '❤️ Лайк отправлен!' });
});

document.getElementById('reply-btn').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: 'reply', video_id: currentVideoId }));
    tg.showPopup({ message: '🎥 Отправьте кружок в боте' });
});

document.getElementById('report-btn').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: 'report', video_id: currentVideoId }));
    tg.showPopup({ message: '🚨 Жалоба отправлена' });
    currentVideoIndex++;
    if (currentVideoIndex < VIDEOS.length) {
        playVideo(VIDEOS[currentVideoIndex]);
    } else {
        showScreen('main-screen');
    }
});
