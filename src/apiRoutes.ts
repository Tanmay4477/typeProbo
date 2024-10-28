import express from "express";
const router = express.Router();
import * as all from "./engine";

router.route("/user/create/:userId").post(all.createUser);
router.route("/symbol/create/:stockSymbol").post(all.createSymbol);
router.route("/orderbook").get(all.orderbook);
router.route("/balances/inr").get(all.inrBalances);
router.route("/balances/stock").get(all.stockBalance)
router.route("/reset").post(all.reset);

// Functionalities
router.route("/balance/inr/:userId").get(all.balanceOfUser);
router.route("/onramp/inr").post(all.onrampInr)
router.route("/balance/stock/:userId").get(all.balanceOfUserStock);
router.route("/orderbook/:stockSymbol").get(all.viewBook)
router.route("/trade/mint").post(all.mintTokens)
router.route("/order/cancel").post(all.cancel)


// 2 main functions
router.route("/order/buy").post(all.buyYesNo);
router.route("/order/sell").post(all.sellYesNo);

export default router;