// firebase-config.js - для Firebase 8

// 1. Конфигурация Firebase (ЗАМЕНИТЕ НА СВОЮ!)
const firebaseConfig = {
    apiKey: "AIzaSyA1B2C3d4E5F6G7H8I9J0K1L2M3N4O5P6Q",
    authDomain: "computer-site-12345.firebaseapp.com",
    databaseURL: "https://computer-site-12345-default-rtdb.firebaseio.com",
    projectId: "computer-site-12345",
    storageBucket: "computer-site-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// 2. Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// 3. Получаем ссылки на сервисы
const auth = firebase.auth();
const database = firebase.database();

// 4. Список админских email
const ADMIN_EMAILS = ['admin@site.com'];

// 5. Функция для регистрации пользователя
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

// 6. Функция для входа пользователя
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

// 7. Функция для выхода
function logoutUser() {
    return auth.signOut();
}

// 8. Получение текущего пользователя
function getCurrentUser() {
    return auth.currentUser;
}

// 9. Получение данных пользователя
async function getUserData(userId) {
    try {
        const snapshot = await database.ref('users/' + userId).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return null;
    }
}

// 10. Проверка, является ли пользователь администратором
async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    
    const userData = await getUserData(user.uid);
    return userData && userData.role === 'admin';
}

// 11. Выводим сообщение об успешной инициализации
console.log('✅ Firebase v8 инициализирован успешно!');