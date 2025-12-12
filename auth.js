// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyCd0-qRb23ySraQNlm59oI78U6IAgSjcNA",
    authDomain: "minecraft-2d-f77c8.firebaseapp.com",
    projectId: "minecraft-2d-f77c8",
    storageBucket: "minecraft-2d-f77c8.firebasestorage.app",
    messagingSenderId: "188143225906",
    appId: "1:188143225906:web:14fee125bea39c547c802b"
    };

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;

// Показать форму регистрации
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// Показать форму входа
function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// Регистрация
async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Сохраняем данные пользователя в базу данных
        await database.ref('users/' + user.uid).set({
            username: username,
            email: email,
            level: 1,
            health: 100,
            food: 100,
            inventory: {
                'dirt': 10,
                'wood': 5,
                'stone': 3
            },
            position: { x: 0, y: 0 }
        });
        
        showLogin();
        alert('Регистрация успешна! Теперь войдите в аккаунт.');
    } catch (error) {
        alert('Ошибка регистрации: ' + error.message);
    }
}

// Вход
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Загружаем данные пользователя
        const snapshot = await database.ref('users/' + currentUser.uid).once('value');
        const userData = snapshot.val();
        
        // Обновляем UI
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        document.getElementById('player-name').textContent = userData.username;
        
        // Инициализируем игру
        initGame(userData);
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

// Выход
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'block';
    });
}

// Проверка авторизации при загрузке
auth.onAuthStateChanged((user) => {
    if (user) {
        // Пользователь уже авторизован
        currentUser = user;
        database.ref('users/' + user.uid).once('value').then((snapshot) => {
            const userData = snapshot.val();
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            document.getElementById('player-name').textContent = userData.username;
            initGame(userData);
        });
    }
});

// Чат
function chatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message && currentUser) {
        const userSnapshot = await database.ref('users/' + currentUser.uid).once('value');
        const userData = userSnapshot.val();
        
        // Сохраняем сообщение
        await database.ref('chat').push({
            username: userData.username,
            message: message,
            timestamp: Date.now()
        });
        
        input.value = '';
    }
}

// Отображение сообщений чата
database.ref('chat').limitToLast(10).on('child_added', (snapshot) => {
    const message = snapshot.val();
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${message.username}:</strong> ${message.message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});