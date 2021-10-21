require("dotenv").config();

// initialize dependencies
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet.contentSecurityPolicy({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
  })
);
app.use(cors());
app.use(express.static("./public"));

//model
const stockSchema = new mongoose.Schema({
  stock: String,
  liked_by: Array,
  num_likes: { type: Number, default: 0 },
});
const Stock = mongoose.model("Stock", stockSchema);
//routes
app.get("/api/stock-prices", async (req, res) => {
  //check the ip address of the client making the request
  const ip = req.ip;

  // check if there are 2 query parameters in the string
  if (Object.keys(req.query).length === 2) {
    // get the values of the stock and like from the req query
    const { stock, like } = req.query;

    //stock api end point
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    try {
      //get request with axios library
      const response = await axios.get(url);
      const stockJSON = response.data;

      // get the price and symbol of the stock
      const { iexRealtimePrice: price, symbol } = stockJSON;

      //code block to execute if he stock is not likes
      if (like === "false") {
        //check if stock exists in the database
        const isStock = await Stock.findOne({ stock: symbol });

        //code block to execute if stock does not exist
        if (!isStock) {
          //create new stock
          const newStock = await Stock.create({
            stock: symbol,
          });
          //json return
          return res.status(200).json({ stock: symbol, price, likes: 0 });
        }

        // return if stock exists in the database
        return res
          .status(200)
          .json({ stock: symbol, price, likes: isStock.num_likes });
      } // code block to evaluate the client likes the stock
      else if (like === "true") {
        // find stock in database
        const isStock = await Stock.findOne({ stock: symbol });

        //code block to execute if stock does not exist in the database
        if (!isStock) {
          //create new stock and include the client's ip address in the liked_by array
          const newStock = await Stock.create({
            stock: symbol,
            liked_by: [ip],
            num_likes: 1,
          });

          // json return
          return res.status(200).json({ stock: symbol, price, likes: 1 });
        }

        //code block to evaluate if the stock exists in the database

        //check if the user has liked the stock
        const hasLiked = isStock.liked_by.includes(ip);

        //code block to execute if user has not liked the stock before
        if (!hasLiked) {
          let newLiked_by = [...isStock.liked_by, ip];

          let newNoLikes = isStock.num_likes + 1;

          //update the stock to include the user's ip address and increment the number of likes the stock has
          const stockUpdate = await Stock.findOneAndUpdate(
            { stock: symbol },
            { liked_by: newLiked_by, num_likes: newNoLikes },
            { new: true }
          );

          //json return
          return res
            .status(200)
            .json({ stock: symbol, price, likes: newNoLikes });
        }
        //code block to evaluate if the user has liked the stock before
        return res
          .status(200)
          .json({ stock: symbol, price, likes: isStock.num_likes });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).type(text).send(`something went wrong`);
    }
  } else {
    const { stock1, stock2, like } = req.query;
  }
});

//not found handler
app.use((req, res) => {
  res.status(404).type("text").send("route not found");
});

const port = process.env.PORT || 8080;

//connect function
const connectDB = (url) => {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`app is listening on  port ${port}`);
    });
  } catch (error) {
    console.log(error.message);
  }
};
start();
