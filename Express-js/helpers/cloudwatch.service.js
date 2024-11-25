const {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const client = new CloudWatchLogsClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

const logGroupName = process.env.AWS_LOGGROUP_NAME;
const logStreamName = process.env.AWS_LOGSTREAM_NAME;

let sequenceToken = null;

const logToCloudWatch = async (message, callback) => {
  try {
    const logMessage =
      typeof message === "string" ? message : JSON.stringify(message);

    const params = {
      logEvents: [
        {
          message: logMessage,
          timestamp: Date.now(),
        },
      ],
      logGroupName,
      logStreamName,
      sequenceToken,
    };

    const command = new PutLogEventsCommand(params);
    const data = await client.send(command);
    sequenceToken = data.nextSequenceToken;

    if (callback) {
      callback(null, data);
    }
  } catch (err) {
    console.log("Error from function ( logToCloudWatch ) :", err);
  }
};

module.exports = {
  logToCloudWatch,
};
