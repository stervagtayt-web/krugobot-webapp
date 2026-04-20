const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Тестовые видео (работают 100%)
const VIDEOS = [
    { id: 1, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', isReply: false },
    { id: 2, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', isReply: true },
    { id: 3, url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', isReply: false }
];

let currentIndex = 0;
let currentVideo = VIDEOS[0];

const state = {
    user: null,
    isAdmin: false
};

// Инициализация
const initData = tg.initDataUnsafe || {};
state.user = initData.user || { id: 'unknown', first_name: 'Гость' };
state.isAdmin = [1207482858, 577985223].includes(state.user.id);

// Применяем тему
document.body.style.backgroundColor = tg.themeParams.bg_color || '#1a1a2e';
document.body.style.color = tg.themeParams.text_color || '#ffffff';

// Показываем главный экран
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    
    if (screenId === 'watch') {
        currentIndex = 0;
        playVideo(VIDEOS[0]);
    }
}

// Воспроизведение видео
function playVideo(video) {
    currentVideo = video;
    const videoEl = document.getElementById('current-video');
    videoEl.src = video.url;
    videoEl.style.display = 'block';
    videoEl.play();
    
    document.getElementById('video-badge').textContent = 
        video.isReply ? '📬 Вам ответили!' : '🎲 Случайный кружок';
}

// Действия с видео
function nextVideo() {
    currentIndex++;
    if (currentIndex < VIDEOS.length) {
        playVideo(VIDEOS[currentIndex]);
    } else {
        tg.showPopup({ message: '📭 Кружки закончились' });
        showScreen('main');
    }
}

function likeVideo() {
    tg.sendData(JSON.stringify({ action: 'like', video_id: currentVideo.id }));
    tg.showPopup({ title: '❤️', message: 'Лайк отправлен!' });
}

function replyVideo() {
    tg.sendData(JSON.stringify({ action: 'reply', video_id: currentVideo.id }));
    tg.showPopup({ message: '🎥 Отправьте кружок в боте' });
}

function reportVideo() {
    tg.sendData(JSON.stringify({ action: 'report', video_id: currentVideo.id }));
    tg.showPopup({ title: '🚨', message: 'Жалоба отправлена' });
    nextVideo();
}

// Обработчики кнопок
document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Навигация
    if (target.dataset.screen) {
        showScreen(target.dataset.screen);
    }
    
    // Главное меню
    if (target.dataset.action === 'watch') showScreen('watch');
    if (target.dataset.action === 'profile') showScreen('profile');
    if (target.dataset.action === 'rules') showScreen('rules');
    if (target.dataset.action === 'admin' && state.isAdmin) showScreen('admin');
    if (target.dataset.action === 'support') tg.openTelegramLink('https://t.me/krugobot_news?direct');
    
    // Видео
    if (target.dataset.videoAction === 'like') likeVideo();
    if (target.dataset.videoAction === 'reply') replyVideo();
    if (target.dataset.videoAction === 'next') nextVideo();
    if (target.dataset.videoAction === 'report') reportVideo();
    
    // Админка
    if (target.dataset.adminAction === 'stats' && state.isAdmin) {
        tg.sendData(JSON.stringify({ action: 'admin_stats' }));
        document.getElementById('admin-result').textContent = '📊 Запрос отправлен';
    }
});

// Приветствие
document.getElementById('user-greeting').textContent = `Привет, ${state.user.first_name}!`;
if (state.isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
}

// Показываем главный экран
showScreen('main');
