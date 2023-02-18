const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
// const redis = require("redis");
const cors = require("cors");
const os = require("os");
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");

let RedisStore = require("connect-redis")(session);

const { createClient } = require("redis");
let redisClient = createClient({
  socket: {
    host: REDIS_URL,
    port: REDIS_PORT
  },
  legacyMode: true 
});
redisClient.connect().catch(console.error);

// let redisClient = redis.createClient({ //* old redis create client */
//   host: REDIS_URL,
//   port: REDIS_PORT
// });

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

mongoose.set("strictQuery", false);

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false
    })
    .then(() => console.log("Succesfully connected to DB"))
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}));
app.use(
  session({
    store: new RedisStore({ client: redisClient}),
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 60000,
    },
    secret: SESSION_SECRET,
  })
);

app.use(express.json());

app.get("/api/v1", (req, res) => {
  res.send("<h2>Prueba de docker en azure</h2>");
  console.log("yeah it ran");
  console.log("HOST: " + os.hostname());
});

//localhost:3000/api/v1/post
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port: ${port}`));
