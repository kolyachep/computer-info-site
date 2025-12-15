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

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Получаем ссылки на сервисы
const auth = firebase.auth();
const database = firebase.database();

// Список админских email (можно расширять)
const ADMIN_EMAILS = ['admin@site.com'];

// Функция для регистрации пользователя
async function registerUser(email, password, username) {
    try {
        // 1. Создаем пользователя в Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 2. Определяем роль (админ или обычный пользователь)
        const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
        
        // 3. Сохраняем дополнительные данные в Realtime Database
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
        
        // Обновляем время последнего входа
        await database.ref('users/' + user.uid).update({
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Получаем данные пользователя из базы
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

// Проверка авторизации
function checkAuth(callback) {
    auth.onAuthStateChanged(callback);
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

// Удаление пользователя (только для админов)
async function deleteUser(userId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: 'Не авторизован' };
        
        const userData = await getUserData(user.uid);
        if (!userData || userData.role !== 'admin') {
            return { success: false, error: 'Нет прав администратора' };
        }
        
        // Не позволяем удалить себя
        if (userId === user.uid) {
            return { success: false, error: 'Нельзя удалить себя' };
        }
        
        await database.ref('users/' + userId).remove();
        return { success: true };
        
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        return { success: false, error: error.message };
    }
}
