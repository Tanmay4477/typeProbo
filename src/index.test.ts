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