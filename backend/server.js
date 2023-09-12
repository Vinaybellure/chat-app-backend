const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const path = require("path");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
dotenv.config();

connectDB();

app.use(express.json()); // to accept Json Data

app.get("/", (req, res) => {
  res.send("API is runing successfully");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ---------------- Deployment ---------------------

const __dirname1 = path.resolve();

console.log(process.env.NODE_ENV, "process.env.NODE_ENV");

if (process.env.NODE_ENV === "production") {
  console.log("In the Production");
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    console.log("Else ");
    res.send("API is runing successfully");
  });
}
// ---------------- Deployment ---------------------

//Error handling Middle wares
app.use(notFound);
app.use(errorHandler);

// app.get("/api/chat", (req, res) => {
//   res.send(chats);
// });

// app.get("/api/chat/:id", (req, res) => {
//   console.log(req.params.id);
//   const singleChat = chats.find((c) => c._id == req.params.id);
//   res.send(singleChat);
// });

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server Started on PORT ${PORT}`));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("Join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return consol.log("Chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("messgae recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("User Disconnected");
    socket.leave(userData._id);
  });
});
