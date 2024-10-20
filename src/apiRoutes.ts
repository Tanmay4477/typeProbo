import express from "express";
const router = express.Router();
import {buyRoute, sellRoute} from "./engine";

// Endpoints
// router.route("/user/create/:userId").post();
// router.route("/symbol/create/:stockSymbol").post();
// router.route("/orderbook").get();
// router.route("/balances/inr").get();
// router.route("/balances/stock").get()
// router.route("/reset").post();

// // Functionalities
// router.route("/balance/inr/:userId").get();
// router.route("/onramp/inr").post()
// router.route("/balance/stock/:userId").get();
// router.route("/orderbook/:stockSymbol").get()


// 3 main functions
router.route("/order/buy").post(buyRoute);
router.route("/order/sell").post(sellRoute);
// Minting already happening inside buy and sell, here we are minting fresh tokens to the same user and deducting their balance
// router.route("/trade/mint").post()

export default router;