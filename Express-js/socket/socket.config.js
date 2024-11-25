const { returnResult } = require("../helpers/response_return");
const { Server } = require("socket.io");
const dotenv = require("dotenv");


dotenv.config();
const startSocket = (server) => {
  try {
    // connectRedisClients();
    const io = new Server(server, {
      cors: {
        origin: "*",
        // origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      },
      transports: ["websocket"],
      // adapter: createAdapter(pubClient, subClient),
    });
    return returnResult(
      (success = true),
      (message = "Socket started"),
      (error = null),
      (data = io)
    );
  } catch (error) {
    console.log("Error from function (startSocket) : ", error);
    return returnResult(
      (success = false),
      (message = error.toString()),
      (error = error.toString()),
      (data = null)
    );
  }
};

module.exports = {
  startSocket,
};
