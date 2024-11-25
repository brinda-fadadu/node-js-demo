const admin = require("firebase-admin");
const serviceAccountKey = require("./serviceAccountKey.json");
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  // databaseURL: "https://your-firebase-project.firebaseio.com",
});

async function sendPushNotification(args) {
  const message = {
    notification: {
      title: args.title,
      body: args.body,
    },
    token: args.token,
    data: args.data,
    android: {
      priority: "high",
    },
    apns: { payload: { aps: { contentAvailable: true } } },
  };
  console.log("args", message);

  try {
    const response = await admin.messaging().send(message);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

module.exports = {
  sendPushNotification,
};
