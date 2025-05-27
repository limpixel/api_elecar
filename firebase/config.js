const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json"); // nanti kita download

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();
module.exports = db;
