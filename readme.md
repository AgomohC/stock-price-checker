# Stock Price Checker

[femto-store-checker](https://femto-stock-price-checker.herokuapp.com) is a REST API that checks the prices of popular stock, keeps track of the number of users that liked the stock and compares the prices and number of likes off two different stock. The project idea was gotten from [freeCodeCamp](https://www.freecodecamp.org/learn/information-security/information-security-projects/stock-price-checker). The API fetches data from the API provided by freeCodeCamp. Check it [out](https://stock-price-checker-proxy.freecodecamp.rocks/)

---

### Resources

There are 2 main resources

- Check price of a single stock, indicating like https://femto-stock-price-checker.herokuapp.com/api/stock-prices?stock1=nflx&like=true
- Compare prices and likes of 2 different stocks https://femto-stock-price-checker.herokuapp.com/api/stock-prices?stock1=nflx&stock2=fb&like=true

### How to

you can fetch data with any kind of methods you know(fetch API, Axios, jquery ajax,...)

### Check price of single stock and like

```js
fetch(
  "https://femto-stock-price-checker.herokuapp.com/api/stock-prices?stock1=nflx&like=true"
)
  .then((res) => res.json())
  .then((json) => console.log(json));
/*
  will return 
      "stockData": {
        "stock": "NFLX",
        "price": 688.06,
        "likes": 1
    }
  */
```

This increases the number of likes by 1 and fetches the symbol, price and number of likes for nflx stock. Each IP address is only allowed one like per stock.

Note: "like" property in the request query can be true or false and it must be present.

### Compare prices and relative likes of 2 stocks

```js
fetch(
  "https://femto-stock-price-checker.herokuapp.com/api/stock-prices?stock1=nflx&stock2=fb&like=true"
)
  .then((res) => res.json())
  .then((json) => console.log(json));

/*
  will return 
   "stockData": 
      { 
        stock: "NFLX",
        price:	690.49,
        rel_likes:	1
      },
      {
        stock: "FB",
        price:	323.65,
        rel_likes: -1
      }
  */
```

This increases the number of likes of both nflx and fb stock by 1 and fetches the symbol, the difference in price and the difference in the number of likes number of likes between the fb and nflx stocks. Each IP address is only allowed one like per stock. If the user has previously liked any of the stocks in the query, the number of likes of that stock would not be incremented.

Note: "like" property in the request query can be true or false and it must be present.

### Feedback!!

I'd love your feedback on the API. You can reach me via [email](mailto:chinaemerema@gmail.com) or give me a shout out on [twitter](https://twitter.com/femto_ace?t=nk6ylNm1Zp2l0yiJkCKFeA&s=09)
