// firebase-config.js - для Firebase 8

// 1. Конфигурация Firebase (ЗАМЕНИТЕ НА СВОЮ!)
const firebaseConfig = {
    apiKey: "AIzaSyBnfw0Ibphp5E0AB8xT4Fe5NMfVOyuOuEM",
    authDomain: "computer-info-site.firebaseapp.com",
    projectId: "computer-info-site",
    storageBucket: "computer-info-site.firebasestorage.app",
    messagingSenderId: "762797842096",
    appId: "1:762797842096:web:0a8327c726787a799b2575",
    measurementId: "G-Q4HPBS1YPW"
  };

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Получаем сервисы
const auth = firebase.auth();
const database = firebase.database();

// Список админских email (можно добавить несколько)
const ADMIN_EMAILS = ['admin@site.com'];

// Функция для регистрации пользователя
async function registerUser(email, password, username) {
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
    return auth.signOut();
}

// Получение текущего пользователя
function getCurrentUser() {
    return auth.currentUser;
}

// Получение данных пользователя
async function getUserData(userId) {
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

// Получение всех пользователей (только для админов)
async function getAllUsers() {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: 'Не авторизован' };
        
        const userData = await getUserData(user.uid);
        if (!userData || userData.role !== 'admin') {
            return { success: false, error: 'Нет прав администратора' };
        }
        
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val();
        
        return { success: true, users: users };
        
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        return { success: false, error: error.message };
    }
}

console.log('✅ Firebase конфигурация загружена');