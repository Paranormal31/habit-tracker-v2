const { onRequest } = require("firebase-functions/v2/https");
const app = require("./server");

// Export our Express app as a Cloud Function named "api"
exports.api = onRequest({ cors: true }, app);
