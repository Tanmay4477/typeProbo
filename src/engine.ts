import {Request, Response, NextFunction} from "express";
import { ORDERBOOK, STOCK_BALANCES, INR_BALANCES } from "./variables";

export const sellRoute:any = async(req: Request, res: Response, next: NextFunction) => {
    try {
        let {userId, stockSymbol, quantity, price, stockType} = req.body;
        if(!userId || !stockSymbol || !quantity || !price || !stockType) {
            return res.status(401).json("Something is missing in the body");
        }
        const presentStock = STOCK_BALANCES?.[userId]?.[stockSymbol]?.[stockType]?.quantity ?? 0;

        if(presentStock < quantity) {
            return res.status(401).json("Stock Balance is not sufficient");
        }
        const oppositeStockType: string = stockType === "yes" ? "no" : "yes";
        const oppositePrice: number = 10-price; 
        
        const oppositeQuantityInOrderBook = ORDERBOOK?.[stockSymbol]?.[oppositeStockType]?.[oppositePrice]?.total ?? 0;
                // ORDERBOOK?.[stockSymbol]?.[stockType]?.[price]?.total ?? quantity;

         
        if (!ORDERBOOK[stockSymbol]) {
            ORDERBOOK[stockSymbol] = {}
        }                     
        if (!ORDERBOOK[stockSymbol][stockType]) {
            ORDERBOOK[stockSymbol][stockType] = {}
        }                        
        if (!ORDERBOOK[stockSymbol][stockType][price]) {
            ORDERBOOK[stockSymbol][stockType][price] = {"total": 0, "orders": []}
        }
        
        if (oppositeQuantityInOrderBook === quantity) {
            ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total -= quantity;
            const array = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders;
            array.forEach((item) => {
                if (item.type === "normal") {
                    INR_BALANCES[item.userId].balance += (item.quantity * oppositePrice)
                    STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity
                } else if(item.type === "reverse") {
                    INR_BALANCES[item.userId].locked -= (item.quantity * price)
                    STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += item.quantity
                }
            })
            ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders = []
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
            INR_BALANCES[userId].balance += (price*quantity);
            return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
        }

        else if (oppositeQuantityInOrderBook > quantity) {
            ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
            INR_BALANCES[userId].balance += (price*quantity);
            const array = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders;

            array.forEach((item) => {
                if(quantity >= item.quantity) {
                    quantity -= item.quantity;
                    if(item.type === "normal") {
                        INR_BALANCES[item.userId].balance += (item.quantity * oppositePrice);
                        STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity
                    }
                    else {
                        INR_BALANCES[item.userId].locked -= (item.quantity * price)
                        STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += item.quantity
                    }
                    array.shift();
                }
                else {
                    item.quantity -= quantity;
                    if(item.type === "normal") {
                        INR_BALANCES[item.userId].balance += (quantity * oppositePrice);
                        STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity
                    }
                    else {
                        INR_BALANCES[item.userId].locked -= (quantity * price)
                        STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += quantity
                    }
                }
            }) 


            return res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});
        } 

        else if (oppositeQuantityInOrderBook < quantity) {
            const total = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= total;
            INR_BALANCES[userId].balance += (price*total);
            quantity -= total;
            STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity
            ORDERBOOK[stockSymbol][stockType][price].total += quantity;
            const array = ORDERBOOK[stockSymbol][stockType][price].orders;
            let success = false;
            array.forEach((item) => {
                if(item.userId === userId && item.type === "normal") {
                    item.quantity += quantity
                    success= true
                }                
            })
            if(!success){
                array.push({userId: userId, type: "normal", quantity: quantity});
            }

            ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total = 0;
            const array2 = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders;
            array2.forEach((item) => {
                if (item.type === "normal") {
                    INR_BALANCES[item.userId].balance += (item.quantity * oppositePrice)
                    STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity
                } else if(item.type === "reverse") {
                    INR_BALANCES[item.userId].locked -= (item.quantity * price)
                    STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += item.quantity
                }
            })
            ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders = []
            return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
        }

        // return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
    } 
    catch (error: any) {
        console.log(error.message);
        return res.status(400).json({msg: "Catch error", err: error.message})
    }
}



export const buyRoute:any = async(req: Request, res: Response, next: NextFunction) => {
    try {
        let {userId, stockSymbol, quantity, price, stockType} = req.body;
        if(!userId || !stockSymbol || !quantity || !price || !stockType) {
            return res.status(401).json("Something is missing in the body");
        }
        const inrBalance = INR_BALANCES[userId].balance;
        if(inrBalance < (price*quantity)) {
            return res.status(401).json("No INR Balance! Koi baat ni bhai, satta try kr");
        }
        const oppositeStockType: string = stockType === "yes" ? "no" : "yes";
        const oppositePrice: number = 10-price; 

        const sameQuantityInOrderBook = ORDERBOOK?.[stockSymbol]?.[stockType]?.[price]?.total ?? 0;

        if (!ORDERBOOK[stockSymbol]) {
            ORDERBOOK[stockSymbol] = {}
        }                     
        if (!ORDERBOOK[stockSymbol][stockType]) {
            ORDERBOOK[stockSymbol][stockType] = {}
        }                        
        if (!ORDERBOOK[stockSymbol][stockType][price]) {
            ORDERBOOK[stockSymbol][stockType][price] = {"total": 0, "orders": []}
        }

        if (sameQuantityInOrderBook === quantity) {
            ORDERBOOK[stockSymbol][stockType][price].total -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;
            INR_BALANCES[userId].balance -= (price*quantity);
            const array = ORDERBOOK[stockSymbol][stockType][price].orders;
            array.forEach((item) => {
                if (item.type === "normal") {
                    INR_BALANCES[item.userId].balance += (item.quantity * price)
                    STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity -= item.quantity
                } else if(item.type === "reverse") {
                    INR_BALANCES[item.userId].locked -= (item.quantity * oppositePrice)
                    STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity += item.quantity
                }
            })
            ORDERBOOK[stockSymbol][stockType][price].orders = []
            return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
        }


        else if (sameQuantityInOrderBook > quantity) {
            ORDERBOOK[stockSymbol][stockType][price].total -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;
            INR_BALANCES[userId].balance -= (price*quantity);
            const array = ORDERBOOK[stockSymbol][stockType][price].orders;

            array.forEach((item) => {
                if(quantity >= item.quantity) {
                    quantity -= item.quantity;
                    if(item.type === "normal") {
                        INR_BALANCES[item.userId].balance += (item.quantity * price);
                        STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity -= item.quantity
                    }
                    else {
                        INR_BALANCES[item.userId].locked -= (item.quantity * oppositePrice)
                        STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity += item.quantity
                    }
                    array.shift();
                }
                else {
                    item.quantity -= quantity;
                    if(item.type === "normal") {
                        INR_BALANCES[item.userId].balance += (quantity * price);
                        STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity -= item.quantity
                    }
                    else {
                        INR_BALANCES[item.userId].locked -= (quantity * oppositePrice)
                        STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity += quantity
                    }
                }
            }) 
            return res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});
        } 

        // else if (sameQuantityInOrderBook < quantity) {
        //     const total = ORDERBOOK[stockSymbol][stockType][price].total
        //     STOCK_BALANCES[userId][stockSymbol][stockType].quantity += total;
        //     INR_BALANCES[userId].balance -= (price*total);
        //     quantity -= total;
        //     STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity
        //     ORDERBOOK[stockSymbol][stockType][price].total += quantity;
        //     const array = ORDERBOOK[stockSymbol][stockType][price].orders;
        //     let success = false;
        //     array.forEach((item) => {
        //         if(item.userId === userId && item.type === "normal") {
        //             item.quantity += quantity
        //             success= true
        //         }                
        //     })
        //     if(!success){
        //         array.push({userId: userId, type: "normal", quantity: quantity});
        //     }

        //     ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total = 0;
        //     const array2 = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders;
        //     array2.forEach((item) => {
        //         if (item.type === "normal") {
        //             INR_BALANCES[item.userId].balance += (item.quantity * oppositePrice)
        //             STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity
        //         } else if(item.type === "reverse") {
        //             INR_BALANCES[item.userId].locked -= (item.quantity * price)
        //             STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += item.quantity
        //         }
        //     })
        //     ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders = []
        //     return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
        // }

        
  
    } 
    catch (error: any) {
        console.log(error.message);
        return res.status(400).json({msg: "Catch error", err: error.message})
    }
}