require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
app.use(
  helmet.contentSecurityPolicy({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
  })
);
app.use(cors());

const port = process.env.PORT || 8080;
const start = () => {
  app.listen(port, () => {
    `app is listening on  port ${port}`;
  });
};
start();
