// ع الحلة — تنبيهات العروض (Firebase Cloud Messaging)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:"AIzaSyCtSigtOrUVd8j8yXOocaPCobv8LhBUWtA",authDomain:"al7ella.firebaseapp.com",projectId:"al7ella",storageBucket:"al7ella.firebasestorage.app",messagingSenderId:"929204702741",appId:"1:929204702741:web:fc7e69cb7fcf1d651c081c"});
firebase.messaging();
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow((e.notification.data&&e.notification.data.FCM_MSG&&e.notification.data.FCM_MSG.notification&&e.notification.data.FCM_MSG.notification.click_action)||'https://3al7ella.github.io/#c-offers'))});
