// firebase-config.js
// Это ваша уникальная конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyA1B2C3d4E5F6G7H8I9J0K1L2M3N4O5P6Q",
    authDomain: "computer-site-12345.firebaseapp.com",
    databaseURL: "https://computer-site-12345-default-rtdb.firebaseio.com",
    projectId: "computer-site-12345",
    storageBucket: "computer-site-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Объекты будут инициализированы позже
let auth = null;
let database = null;
let isFirebaseInitialized = false;

// Список админских email
const ADMIN_EMAILS = ['admin@site.com'];

// Функция инициализации Firebase
function initializeFirebase() {
    try {
        // Проверяем, не инициализирован ли Firebase уже
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Инициализируем сервисы
        auth = firebase.auth();
        database = firebase.database();
        isFirebaseInitialized = true;
        
        console.log('✅ Firebase успешно инициализирован');
        return true;
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        return false;
    }
}

// Проверка инициализации
function ensureFirebaseInitialized() {
    if (!isFirebaseInitialized) {
        return initializeFirebase();
    }
    return true;
}

// Функция для регистрации пользователя
async function registerUser(email, password, username) {
    if (!ensureFirebaseInitialized()) {
        return { success: false, error: 'Firebase не инициализирован' };
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
        
        await database.ref('users/' + user.uid).set({
            username: username,
            email: email,
            role: role,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });
        
        return { success: true, user: user, role: role };
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, error: error.message };
    }
}

// Функция для входа пользователя
async function loginUser(email, password) {
    if (!ensureFirebaseInitialized()) {
        return { success: false, error: 'Firebase не инициализирован' };
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await database.ref('users/' + user.uid).update({
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });
        
        const userSnapshot = await database.ref('users/' + user.uid).once('value');
        const userData = userSnapshot.val();
        
        return { success: true, user: { ...user, ...userData } };
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, error: error.message };
    }
}

// Функция для выхода
function logoutUser() {
    if (!ensureFirebaseInitialized()) {
        return Promise.reject('Firebase не инициализирован');
    }
    return auth.signOut();
}

// Получение текущего пользователя
function getCurrentUser() {
    if (!ensureFirebaseInitialized()) {
        return null;
    }
    return auth.currentUser;
}

// Получение данных пользователя
async function getUserData(userId) {
    if (!ensureFirebaseInitialized()) {
        return null;
    }
    
    try {
        const snapshot = await database.ref('users/' + userId).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return null;
    }
}

// Проверка, является ли пользователь администратором
async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    
    const userData = await getUserData(user.uid);
    return userData && userData.role === 'admin';
}

// Автоматическая инициализация при загрузке скрипта
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, загружен ли Firebase
    if (typeof firebase !== 'undefined') {
        initializeFirebase();
    } else {
        console.warn('Firebase SDK еще не загружен, инициализация отложена');
        
        // Пытаемся инициализировать позже
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                initializeFirebase();
            }
        }, 1000);
    }
});