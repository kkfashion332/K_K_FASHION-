importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBrIfQnPpM4lywZWIiSxaz_v0o1S9PfOqg",
  projectId: "kkfashion-f51ff",
  messagingSenderId: "720286728954",
  appId: "1:720286728954:web:eebcf2a28f5ad696e87f43"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message Received', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'logo.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
