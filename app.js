require("dotenv").config();

// initialize dependencies
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

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
// configure rate limiter for reverse proxies
app.set("trust proxy", 1);

//configure rate limiter to allow only 100 requests from a client every 15 minutes
app.use(
  rateLimit({
    windowMS: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(cors());
app.get("/", (req, res) => {
  res.send(
    '<header><h1>Nasdaq Stock Price Checker</h1></header><h4><a href="#" target="_blank"> See Documentation <a> </h4>'
  );
});

//model
const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
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
    const { stock1, like } = req.query;
    if (!stock1 || !like) {
      return res.status(400).send(`required inputs missing`);
    }

    //stock api end point
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock1}/quote`;
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
          await Stock.create({
            stock: symbol,
          });
          //json return
          return res
            .status(200)
            .json({ stockData: { stock: symbol, price, likes: 0 } });
        }

        // return if stock exists in the database
        return res.status(200).json({
          stockData: { stock: symbol, price, likes: isStock.num_likes },
        });
      } // code block to evaluate the client likes the stock
      else if (like === "true") {
        // find stock in database
        const isStock = await Stock.findOne({ stock: symbol });

        //code block to execute if stock does not exist in the database
        if (!isStock) {
          //create new stock and include the client's ip address in the liked_by array
          await Stock.create({
            stock: symbol,
            liked_by: [ip],
            num_likes: 1,
          });

          // json return
          return res
            .status(200)
            .json({ stockData: { stock: symbol, price, likes: 1 } });
        }

        //code block to evaluate if the stock exists in the database

        //check if the user has liked the stock
        const hasLiked = isStock.liked_by.includes(ip);

        //code block to execute if user has not liked the stock before
        if (!hasLiked) {
          let newLiked_by = [...isStock.liked_by, ip];

          let newNoLikes = isStock.num_likes + 1;

          //update the stock to include the user's ip address and increment the number of likes the stock has
          await Stock.findOneAndUpdate(
            { stock: symbol },
            { liked_by: newLiked_by, num_likes: newNoLikes },
            { new: true }
          );

          //json return
          return res
            .status(200)
            .json({ stockData: { stock: symbol, price, likes: newNoLikes } });
        }
        //code block to evaluate if the user has liked the stock before
        return res.status(200).json({
          stockData: { stock: symbol, price, likes: isStock.num_likes },
        });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).type(text).send(`something went wrong`);
    }
  } else {
    const { stock1, stock2, like } = req.query;

    if (!stock1 || !stock2 || !like) {
      return res.status(400).send(`required inputs missing`);
    }
    try {
      //end points for fetching the data about the 2 stocks passed in
      const url1 = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock1}/quote`;
      const url2 = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock2}/quote`;

      // fetch the stock data with axios library
      const response1 = await axios.get(url1);
      const response2 = await axios.get(url2);
      const stockJSON1 = response1.data;
      const stockJSON2 = response2.data;

      // get the price and symbols of the two stock
      const { iexRealtimePrice: price1, symbol: symbol1 } = stockJSON1;
      const { iexRealtimePrice: price2, symbol: symbol2 } = stockJSON2;

      //check if both stock exist in the database if they dont create a new entry with ths symbol passed in
      const isStock1 =
        (await Stock.findOne({ stock: symbol1 })) ||
        (await Stock.create({ stock: symbol1 }));
      const isStock2 =
        (await Stock.findOne({ stock: symbol2 })) ||
        (await Stock.create({ stock: symbol1 }));
      // block of code to evaluate if the value of like is false

      if (like === "false") {
        // get the relative likes of the two stocks by subtracting the num likes of one from the other
        let rel_likes1 = isStock1.num_likes - isStock2.num_likes;
        let rel_likes2 = isStock2.num_likes - isStock1.num_likes;

        //returned value
        let returnedValue = {
          stockData: [
            { stock: symbol1, price: price1, rel_likes: rel_likes1 },
            { stock: symbol2, price: price2, rel_likes: rel_likes2 },
          ],
        };

        //json return
        return res.status(200).json(returnedValue);
      }
      // block of code to evaluate if the value of like is true
      else if (like === "true") {
        //check if the user has liked the stock
        const hasLiked1 = isStock1.liked_by.includes(ip);
        const hasLiked2 = isStock2.liked_by.includes(ip);

        //code block to execute if user has liked both stock before
        if (hasLiked1 && hasLiked2) {
          // get the relative likes of the two stocks by subtracting the num likes of one from the other

          let rel_likes1 = isStock1.num_likes - isStock2.num_likes;
          let rel_likes2 = isStock2.num_likes - isStock1.num_likes;
          //returned value
          let returnedValue = {
            stockData: [
              { stock: symbol1, price: price1, rel_likes: rel_likes1 },
              { stock: symbol2, price: price2, rel_likes: rel_likes2 },
            ],
          };
          return res.status(200).json(returnedValue);
        }
        //code block to execute if user has not liked either stock before
        if (!hasLiked1 && !hasLiked2) {
          // get the relative likes of the two stocks by subtracting the num likes of one from the other
          let newLiked_by1 = [...isStock1.liked_by, ip];
          let newNoLikes1 = isStock1.num_likes + 1;

          await Stock.findOneAndUpdate(
            { stock: symbol1 },
            { liked_by: newLiked_by1, num_likes: newNoLikes1 },
            { new: true }
          );
          let newLiked_by2 = [...isStock2.liked_by, ip];
          let newNoLikes2 = isStock2.num_likes + 1;

          //update the stock to include the user's ip address and increment the number of likes the stock has
          await Stock.findOneAndUpdate(
            { stock: symbol2 },
            { liked_by: newLiked_by2, num_likes: newNoLikes2 },
            { new: true }
          );
          let rel_likes1 = newNoLikes1 - newNoLikes2;
          let rel_likes2 = newNoLikes2 - newNoLikes1;
          //returned value
          let returnedValue = {
            stockData: [
              { stock: symbol1, price: price1, rel_likes: rel_likes1 },
              { stock: symbol2, price: price2, rel_likes: rel_likes2 },
            ],
          };
          return res.status(200).json(returnedValue);
        }
        // block of code to execute if the user has not liked the first stock only
        if (!hasLiked1) {
          let newLiked_by1 = [...isStock1.liked_by, ip];
          let newNoLikes1 = isStock1.num_likes + 1;

          //update the stock to include the user's ip address and increment the number of likes the stock has
          await Stock.findOneAndUpdate(
            { stock: symbol1 },
            { liked_by: newLiked_by1, num_likes: newNoLikes1 },
            { new: true }
          );
          let rel_likes1 = newNoLikes1 - isStock2.num_likes;
          let rel_likes2 = isStock2.num_likes - newNoLikes1;
          let returnedValue = {
            stockData: [
              { stock: symbol1, price: price1, rel_likes: rel_likes1 },
              { stock: symbol2, price: price2, rel_likes: rel_likes2 },
            ],
          };
          return res.status(200).json(returnedValue);
        }
        if (!hasLiked2) {
          let newLiked_by2 = [...isStock2.liked_by, ip];
          let newNoLikes2 = isStock2.num_likes + 1;

          //update the stock to include the user's ip address and increment the number of likes the stock has
          await Stock.findOneAndUpdate(
            { stock: symbol2 },
            { liked_by: newLiked_by2, num_likes: newNoLikes2 },
            { new: true }
          );
          let rel_likes2 = newNoLikes2 - isStock1.num_likes;
          let rel_likes1 = isStock1.num_likes - newNoLikes2;
          let returnedValue = {
            stockData: [
              { stock: symbol1, price: price1, rel_likes: rel_likes1 },
              { stock: symbol2, price: price2, rel_likes: rel_likes2 },
            ],
          };
          return res.status(200).json(returnedValue);
        }
        //json return
        return res
          .status(200)
          .json({ stockData: { stock: symbol, price, likes: newNoLikes } });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).type(text).send(`something went wrong`);
    }
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
