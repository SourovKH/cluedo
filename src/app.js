const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { serveHomePage } = require("./handlers/resource-handler");
const createGameRouter = require("./routers/game-router");
const createLobbyRouter = require("./routers/lobby-router");

const createApp = () => {
  const app = express();

  app.use(morgan(":method :url :response-time ms"));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cookieParser());
  app.use(express.static("public"));

  app.get("/", serveHomePage);
  app.use("/lobby", createLobbyRouter());
  app.use("/game", createGameRouter());

  return app;
};

module.exports = { createApp };
