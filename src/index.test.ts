import { stockSymbol, stockType } from './variables';
import {app} from "./index";
import request from "supertest";

describe("E-to-E-1", () => {
  beforeAll(async () => {
    await request(app).post("/reset"); // resets the data values
  });

  it("this test just checks the response messages and status", async () => {
    // Step 1: Create a new user (User5)
    let response = await request(app).post("/user/create/user5");
    expect(response.status).toBe(200);

    // Step 2: Add balance to user5
    response = await request(app).post("/onramp/inr").send({
      userId: "user5",
      amount: 50000,
    });
    expect(response.status).toBe(200);

    // Step 3: Create a new symbol
    response = await request(app).post(
      "/symbol/create/AAPL_USD_25_Oct_2024_14_00",
    );
    expect(response.status).toBe(200);

    // Step 4: Mint tokens for User5
    response = await request(app).post("/trade/mint").send({
      userId: "user5",
      stockSymbol: "AAPL_USD_25_Oct_2024_14_00",
      quantity: 25,
    });
    expect(response.status).toBe(200);

    // Step 5: User5 sells 10 'no' tokens
    response = await request(app).post("/order/sell").send({
      userId: "user5",
      stockSymbol: "AAPL_USD_25_Oct_2024_14_00",
      quantity: 10,
      price: 8,
      stockType: "no",
    });
    expect(response.status).toBe(200);

    // Step 6: Create User6 and buy the 'no' tokens from the order book
    response = await request(app).post("/user/create/user6");
    expect(response.status).toBe(200);

    // Add balance to user6
    response = await request(app).post("/onramp/inr").send({
      userId: "user6",
      amount: 20000,
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user6",
      stockSymbol: "AAPL_USD_25_Oct_2024_14_00",
      quantity: 10,
      price: 8,
      stockType: "no",
    });
    expect(response.status).toBe(200);

    // Fetch balances after the trade
    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user6"]).toEqual({
      balance: 120, // 20000 - (10 * 1000)
      locked: 0,
    });
    expect(response.body["user5"]).toEqual({
      balance: 580,
      locked: 0,
    });
  });
});


describe("E-to-E-2", () => {
  beforeAll(async () => {
    await request(app).post("/reset"); // resets the data values
  });

  it("this test checks the response values , status as well as state of the variables at regular intervals", async () => {
    // Step 1: Create a new user (User3)
    let response = await request(app).post("/user/create/user3");
    expect(response.status).toBe(200);

    
    // Step 2: Add balance to user3
    response = await request(app).post("/onramp/inr").send({
      userId: "user3",
      amount: 50000,
    });
    expect(response.status).toBe(200);

    
    // Fetch INR_BALANCES after adding balance
    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user3"]).toEqual({
      balance: 500,
      locked: 0,
    });

    // Step 3: Create a new symbol
    response = await request(app).post(
      "/symbol/create/ETH_USD_20_Oct_2024_10_00",
    );
    expect(response.status).toBe(200);
    

    // Step 4: Mint tokens for User3
    response = await request(app).post("/trade/mint").send({
      userId: "user3",
      stockSymbol: "ETH_USD_20_Oct_2024_10_00",
      quantity: 50,
    });
    expect(response.status).toBe(200);

    // Fetch STOCK_BALANCES after minting
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user3"]["ETH_USD_20_Oct_2024_10_00"]).toEqual({
      yes: { quantity: 50, locked: 0 },
      no: { quantity: 50, locked: 0 },
    });

    // Step 5: User3 sells 20 'yes' tokens
    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH_USD_20_Oct_2024_10_00",
      quantity: 20,
      price: 7,
      stockType: "yes",
    });
    expect(response.status).toBe(200);


    // Fetch STOCK_BALANCES after selling
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user3"]["ETH_USD_20_Oct_2024_10_00"]["yes"]).toEqual({
      quantity: 30,
      locked: 20,
    });

    // Step 6: Create User4 and buy the 'yes' tokens from the order book
    response = await request(app).post("/user/create/user4");
    expect(response.status).toBe(200);

    // Add balance to user4
    response = await request(app).post("/onramp/inr").send({
      userId: "user4",
      amount: 60000,
    });
    expect(response.status).toBe(200);

    
    // User4 buys 20 'yes' tokens
    response = await request(app).post("/order/buy").send({
      userId: "user4",
      stockSymbol: "ETH_USD_20_Oct_2024_10_00",
      quantity: 20,
      price: 7,
      stockType: "yes",
    });
    expect(response.status).toBe(200);

    
    // Fetch balances after the trade
    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user4"]).toEqual({
      balance: 460,
      locked: 0,
    });
    expect(response.body["user3"]).toEqual({
      balance: 640,
      locked: 0,
    });

    // Fetch STOCK_BALANCES after the trade
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user4"]["ETH_USD_20_Oct_2024_10_00"]["yes"]).toEqual({
      quantity: 20,
      locked: 0,
    });
    expect(response.body["user3"]["ETH_USD_20_Oct_2024_10_00"]["yes"]).toEqual({
      quantity: 30,
      locked: 0,
    });
  });
});



describe("E-to-E-3", () => {
  beforeAll(async () => {
    await request(app).post("/reset"); // Reset the data values
  });

  it("should handle multiple matching orders and price priorities correctly", async () => {
    // Step 1: Create users (User1 and User2)
    let response = await request(app).post("/user/create/user1");
    expect(response.status).toBe(200);

    response = await request(app).post("/user/create/user2");
    expect(response.status).toBe(200);

    response = await request(app).post("/user/create/user3");
    expect(response.status).toBe(200);

    // Step 2: Create a symbol
    response = await request(app).post(
      "/symbol/create/ETH_USD_15_Oct_2024_12_00",
    );
    expect(response.status).toBe(200);

    response = await request(app).post(
      "/symbol/create/ETH_SOL_16_Oct_2024_12_00"
    );
    expect(response.status).toBe(200);

    // Step 3: Add balance to users
    await request(app)
      .post("/onramp/inr")
      .send({ userId: "user1", amount: 50000 });
    await request(app)
      .post("/onramp/inr")
      .send({ userId: "user2", amount: 300000 });

    // Check INR balances after adding funds
    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user1"]).toEqual({ balance: 500, locked: 0 });
    expect(response.body["user2"]).toEqual({ balance: 3000, locked: 0 });

    // Step 4: Mint tokens for User1
    response = await request(app).post("/trade/mint").send({
      userId: "user1",
      stockSymbol: "ETH_USD_15_Oct_2024_12_00",
      quantity: 200,
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/trade/mint").send({
      userId: "user3",
      stockSymbol: "ETH_SOL_16_Oct_2024_12_00",
      quantity: 500,
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user2",
      stockSymbol: "ETH_USD_15_Oct_2024_12_00",
      quantity: 500,
      price: 4,
      stockType: "yes",
    });
    expect(response.status).toBe(200);

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user2"]).toStrictEqual({
      "balance": 1000,
      "locked": 2000
    });

    // Step 5: User1 places multiple sell orders at different prices
    response = await request(app).post("/order/sell").send({
      userId: "user1",
      stockSymbol: "ETH_USD_15_Oct_2024_12_00",
      quantity: 100,
      price: 3,
      stockType: "yes",
    });
    expect(response.status).toBe(200)

    response = await request(app).get("/balance/stock/user1");
    expect(response.status).toBe(200);
    expect(response.body["ETH_USD_15_Oct_2024_12_00"]["yes"]).toStrictEqual({
      quantity: 100,
      locked: 0
    })

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user1"]).toStrictEqual({
      balance: 800,
      locked: 0
    });

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user2"]).toStrictEqual({
      balance: 1000,
      locked: 1600,
    });

    
    response = await request(app).get("/balance/stock/user2");
    expect(response.status).toBe(200);
    expect(response.body["ETH_USD_15_Oct_2024_12_00"]["yes"]).toStrictEqual({
      "quantity": 100,
      "locked": 0
    });

    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH_SOL_16_Oct_2024_12_00",
      quantity: 500,
      price: 3.5,
      stockType: "yes",
    });
    expect(response.status).toBe(200)


    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH_SOL_16_Oct_2024_12_00",
      quantity: 300,
      price: 6,
      stockType: "no"
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user1",
      stockSymbol: "ETH_SOL_16_Oct_2024_12_00",
      quantity: 100,
      price: 1,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user1",
      stockSymbol: "ETH_SOL_16_Oct_2024_12_00",
      quantity: 100,
      price: 7,
      stockType: "no"
    });
    expect(response.status).toBe(200);

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user1"]).toStrictEqual({
      balance: 0,
      locked: 800,
    });

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user3"]).toStrictEqual({
      balance: 2850,
      locked: 0
    })

    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user3"]["ETH_SOL_16_Oct_2024_12_00"]["no"]).toStrictEqual({
      quantity: 200,
      locked: 0,
    });
    ///////

    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user3"]["ETH_SOL_16_Oct_2024_12_00"]["yes"]).toStrictEqual({
      quantity: 0,
      locked: 200,
    });
});
});

describe("E-to-E-4", () => {
  beforeAll(async () => {
    await request(app).post("/reset");
  });
  
  it("should handle my ultimate gandh", async () => {

    // 4 users banaye h
    let response = await request(app).post("/user/create/user1");
    expect(response.status).toBe(200);

    response = await request(app).post("/user/create/user2");
    expect(response.status).toBe(200);

    response = await request(app).post("/user/create/user3");
    expect(response.status).toBe(200);

    response = await request(app).post("/user/create/user4");
    expect(response.status).toBe(200);

    // Symbol 2 hi rkhte h

    response = await request(app).post("/symbol/create/ETH");
    expect(response.status).toBe(200);

    response = await request(app).post("/symbol/create/SOL");
    expect(response.status).toBe(200);

    // 2 bhikario ko paise denge aur 2 ko symbol

    response = await request(app).post("/onramp/inr").send({ userId: "user1", amount: 200000});
    expect(response.status).toBe(200);

    response = await request(app).post("/onramp/inr").send({userId: "user2", amount: 250000});
    expect(response.status).toBe(200);

    response = await request(app).post("/trade/mint").send({
      userId: "user3",
      stockSymbol: "ETH",
      quantity: 500
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/trade/mint").send({
      userId: "user4",
      stockSymbol: "SOL",
      quantity: 500
    });
    expect(response.status).toBe(200);

    // Buy Sell shuru kia jaye
    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH",
      quantity: 100,
      price: 4,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user1",
      stockSymbol: "SOL",
      quantity: 100,
      price: 7,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH",
      quantity: 100,
      price: 5,
      stockType: "yes"
    })
    expect(response.status).toBe(200);

    response = await request(app).post("/order/sell").send({
      userId: "user3",
      stockSymbol: "ETH",
      quantity: 100,
      price: 6,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    response = await request(app).post("/order/buy").send({
      userId: "user1",
      stockSymbol: "SOL",
      quantity: 100,
      price: 8,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user2"]).toStrictEqual({
      balance: 2500,
      locked: 0
    })

    response = await request(app).post("/order/buy").send({
      userId: "user2",
      stockSymbol: "ETH",
      quantity: 500,
      price: 5,
      stockType: "yes"
    });
    expect(response.status).toBe(200);


    response = await request(app).post("/order/sell").send({
      userId: "user4",
      stockSymbol: "SOL",
      quantity: 150,
      price: 7.5,
      stockType: "yes"
    });
    expect(response.status).toBe(200);

    // lets check the result

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user1"]).toStrictEqual({
      balance: 500,
      locked: 700
    });

    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user1"]["SOL"]["yes"]).toStrictEqual({
      quantity: 100,
      locked: 0,
    });


    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user2"]).toStrictEqual({
      balance: 100,
      locked: 1500
    })
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user2"]["ETH"]["yes"]).toStrictEqual({
      quantity: 200,
      locked: 0,
    });

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user3"]).toStrictEqual({
      balance: 900,
      locked: 0
    })
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user3"]["ETH"]["yes"]).toStrictEqual({
      quantity: 200,
      locked: 100,
    });

    response = await request(app).get("/balances/inr");
    expect(response.status).toBe(200);
    expect(response.body["user4"]).toStrictEqual({
      balance: 750,
      locked: 0
    })
    response = await request(app).get("/balances/stock");
    expect(response.status).toBe(200);
    expect(response.body["user4"]["SOL"]["yes"]).toStrictEqual({
      quantity: 350,
      locked: 50,
    });
  })
})