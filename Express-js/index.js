const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/db.config");
const authRouter = require("./routes/auth.router");
const userRouter = require("./routes/user.router");
const adminRouter = require("./routes/admin.router");
const questionRouter = require("./routes/question.router");
const http = require("http");
const nodeCron = require("node-cron");
const { startSocket } = require("./socket/socket.config");
const CronService = require("./services/cron.service");
const { rateLimit } = require("express-rate-limit");
const app = express();
const server = http.createServer(app);
const UserService = require("./services/user.service");
const { ObjectId } = require("mongodb");

const corsOptions = {
  origin: [
    `${process.env.FRONTEND_URL}`,
    `${process.env.ADMINPANEL_URL}`,
    `${process.env.BIGCOMMERCE_URL}`,
    "http://localhost:3000",
  ],
  methods: ["PUT, POST, GET, DELETE, PATCH, OPTIONS"],
};
const publicDir = path.join(__dirname, "./static");
const dotenv = require("dotenv");
const { cronDataModel } = require("./models/cronData.model");

dotenv.config();

app.use(
  cors({
    origin: "*",
  })
);
// app.use(cors(corsOptions));
app.use(express.static(publicDir));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// app.set("trust proxy", true);
app.set("trust proxy", 1);
// app.set("trust proxy", "13.59.104.20");

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_TIME,
  limit: process.env.RATE_LIMIT_NO_OF_REQUESTS,
  message:
    "Too many requests, Please try again after " +
    parseInt(process.env.RATE_LIMIT_TIME) / 60000 +
    " minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", limiter);
app.use("/api/auth/forgot-password", limiter);
app.use("/api/auth/check-forgot-password-token", limiter);
app.use("/api/auth/reset-password", limiter);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/question", questionRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the H2O API");
});

app.use((err, req, res, next) => {
  // console.error(err.stack);
  console.log(
    "Error=-=-=-=-=-=-=-",
    err.toString(),
    err.toString() == "invalid_file_type"
  );
  if (err.toString() == "Error: invalid_file_type") {
    return res.status(400).send({
      success: false,
      error: "Please upload image of type jpeg, jpg or png",
      message: "Please upload image of type jpeg, jpg or png",
      data: null,
    });
  } else if (err.toString() == "MulterError: File too large") {
    return res.status(400).send({
      success: false,
      error: "File size is too large. Max limit is 5MB",
      message: "File size is too large. Max limit is 5MB",
      data: null,
    });
  }

  next();
  // res.status(500).send("Something went wrong!");
});

const io = startSocket(server);
// const socketTestFunction = async(percentage)=>{
//     try{
//         if(io.success){
//             console.log("Called")
//             io.data.emit("ask_question", percentage);
//         }
//     }catch(error){
//         console.log("Error from function (socketTestFunction) : ", error)
//     }
// }

if (io.success) {
  app.io = io.data;
  io.data.on("connection", (socket) => {
    try {
      console.log("Socket Connected", socket.id);
      socket.on("disconnect", async () => {});
      socket.on("login", async function (data, callback) {
        try {
          console.log("login event called");
          console.log("Data:", data);
          if (data._id) {
            const user = await UserService.getUserById(data._id);
            if (!user) {
              return callback({
                success: false,
                error: "Invalid UserId",
              });
            }
            const updated = await UserService.updateUserById(data._id, {
              is_online: true,
            });
            socket.join(`room_${data._id}`);
            console.log(
              "Message : ",
              `User: ${data._id} has joined the room : room_${data._id}`
            );
            callback({
              success: true,
              message: `User : ${data._id} has joined the room : room_${data._id}`,
            });
          } else {
            callback({
              success: false,
              error: "Please provide _id, email",
            });
          }
        } catch (error) {
          console.log("error in socket login", error.message);
          callback({
            success: false,
            error: error.message,
          });
        }
      });
      socket.on("logout", async function (data, callback) {
        try {
          console.log("logout event called");
          if (data._id) {
            const updated = await UserService.updateUserById(data._id, {
              is_online: false,
            });
            socket.leave(`room_${data._id}`);
            callback({
              success: true,
              message: "Logout successful",
            });
          } else {
            callback({
              success: false,
              error: "Please provide _id",
            });
          }
        } catch (error) {
          console.log("error in socket logout", error.message);
          callback({
            success: false,
            error: error.message,
          });
        }
      });
    } catch (error) {
      console.log("Error from function (io.on) : ", error);
    }
  });

  io.data.on("disconnect", () => {
    console.log("Socket Disconnected");
  });
} else {
  console.log("Error : ", io.error);
}

// Cron JOB ( Data Sync Up Job ) : running at time : 02:00:00 PM IST -> UTC : 08:30:00 AM
nodeCron.schedule("30 8 * * *", async () => {
  try {
    let crondataobj = await cronDataModel.create({
      start_date_time: new Date(),
      status: "running",
      stage: "stage-0",
      cron_error: "",
      job_name: "Data Sync Up Job",
    });
    console.log("Cron Job Started ( Data Sync Up Job )");
    // delete old history
    await CronService.deleteOldHistory();
    crondataobj.stage = "stage-1";
    await crondataobj.save();
    console.log("deleteOldHistory completed");
    // update plan status
    await CronService.checkAndUpdatePlanStatus();
    crondataobj.stage = "stage-2";
    await crondataobj.save();
    console.log("checkAndUpdatePlanStatus completed");
    // submit scheduled plan change requests
    await CronService.submitScheduledPlanChangeRequests();
    crondataobj.stage = "stage-3";
    await crondataobj.save();
    // change the updated tag from qna entries
    await CronService.checkAndUpdateProductScoreUpdatedTags();
    crondataobj.stage = "stage-4";
    crondataobj.status = "completed";
    crondataobj.end_date_time = new Date();
    await crondataobj.save();
    console.log("checkAndUpdateProductScoreUpdatedTags completed");
    console.log("Cron Job Completed ( Data Sync Up Job ) ");
  } catch (error) {
    console.log(
      "Error from function (nodeCron.schedule)( Data Sync Up Job ) : ",
      error
    );
    await CronService.informAdmin({
      subject: "Error in Cron Job( Data Sync Up Job )",
      text: error.toString(),
    });
    if (crondataobj) {
      crondataobj.status = "failed";
      crondataobj.cron_error = error.toString();
      crondataobj.end_date_time = new Date();
      await crondataobj.save();
    }
  }
});

// Cron JOB ( Notification Job ) : running at time : 09:30:00 PM IST -> UTC : 04:00:00 PM
nodeCron.schedule("0 16 * * *", async () => {
  try {
    let crondataobj = await cronDataModel.create({
      start_date_time: new Date(),
      status: "running",
      stage: "stage-0",
      cron_error: "",
      job_name: "Notification Job",
    });
    console.log("Cron Job Started ( Notification Job )");
    // singup notification
    await CronService.sendSignupNotification();
    crondataobj.stage = "stage-1";
    await crondataobj.save();
    console.log("sendSignupNotification completed");
    // plan expire notification
    await CronService.sendPlanExpireNotification();
    crondataobj.stage = "stage-2";
    await crondataobj.save();
    console.log("sendPlanExpireNotification completed");
    // send product scoring success notification
    await CronService.sendScoringSuccessNotifications(app.io);
    crondataobj.stage = "stage-3";
    await crondataobj.save();

    // send first scan reminder notification : App Notification - Get Started with Your First Scan
    await CronService.sendFirstScanNotifications(app.io);
    crondataobj.stage = "stage-4";
    await crondataobj.save();

    // send set dietary preference reminder notification : App Notification - Set Your Dietary Preferences
    await CronService.sendSetDietaryPreferenceNotifications(app.io);
    crondataobj.stage = "stage-5";
    await crondataobj.save();

    // send use product choice ai asistant reminder notification : App Notification - Meet Your Smart Product Choice AI Assistant
    await CronService.sendUseProductChoiceAiAssistantNotifications(app.io);
    crondataobj.stage = "stage-6";
    await crondataobj.save();

    // send user inactivity reminder notification : App Notification : Reminders for Inactive Users - 14-Day Inactivity Reminder
    await CronService.sendInactivityNotifications(app.io);
    crondataobj.stage = "stage-7";

    crondataobj.status = "completed";
    crondataobj.end_date_time = new Date();
    await crondataobj.save();
    console.log("sendScoringSuccessNotifications completed");
    console.log("Cron Job Completed ( Notification Job ) ");
  } catch (error) {
    console.log(
      "Error from function (nodeCron.schedule)( Notification Job ) : ",
      error
    );
    await CronService.informAdmin({
      subject: "Error in Cron Job( Notification Job )",
      text: error.toString(),
    });
    if (crondataobj) {
      crondataobj.status = "failed";
      crondataobj.cron_error = error.toString();
      crondataobj.end_date_time = new Date();
      await crondataobj.save();
    }
  }
});

server.listen(process.env.BACKEND_PORT, () => {
  try {
    connectDB(process.env.DB_URL);
    console.log("Server is listening on port : ", process.env.BACKEND_PORT);
  } catch (error) {
    console.log("Error from function (app.listen) : ", error);
  }
});

// module.exports = {
//     socketTestFunction
// }
