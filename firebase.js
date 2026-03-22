const firebaseConfig = {
  apiKey: "AIzaSyB281xI3xiXdvN8OKY5Qvg0IOT88eDVPzo",
  authDomain: "smr-repair-site.firebaseapp.com",
  projectId: "smr-repair-site",
  storageBucket: "smr-repair-site.firebasestorage.app",
  messagingSenderId: "416335849668",
  appId: "1:416335849668:web:c06f208b538f903247c191",
  measurementId: "G-6FTPNRJQ8J"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();