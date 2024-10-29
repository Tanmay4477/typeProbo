import {Request, Response, NextFunction} from "express";
import { ORDERBOOK, STOCK_BALANCES, INR_BALANCES } from "./variables";
// import {book, inr, stockBalanceInterface} from "./variables";

export const createUser:any = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.userId;
        if(!id) {
            return res.status(404).json("Please input id");
        }
        INR_BALANCES[id] = {
            balance: 0,
            locked: 0
        };
        return res.status(200).json(INR_BALANCES);
    } catch (error: any) {
        return res.status(400).json({
            msg: "Catch error found"        
        })
    }
}

export const inrBalances:any = async (req: Request, res: Response) => {
    // try {
        return res.status(200).json(INR_BALANCES);
//     } catch (error: any) {
//         return res.status(400).json({
//             msg: error.message
//         })
//     }
}

export const balanceOfUser:any = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        if(!userId) {
            return res.status(403).json("Please input userId first");
        }
        let output = userId in INR_BALANCES;
        if(!!output) {
            return res.status(200).json(INR_BALANCES[userId]);
       }
       else return res.status(400).json("User not exist");
    } catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const onrampInr:any = async (req: Request, res: Response) => {
    try {
        const {userId, amount} = req.body;
        if(!INR_BALANCES[userId]) {
        INR_BALANCES[userId] = INR_BALANCES[userId] || {};
        }
        if(!INR_BALANCES[userId].balance) {
            INR_BALANCES[userId] = {balance: 0, locked: 0};
        }
        
        INR_BALANCES[userId].balance += amount/100;
        return res.status(200).json(INR_BALANCES[userId]);
    } 

    catch (error) {
        return res.status(400).json(error)
    }
}

export const stockBalance:any = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(STOCK_BALANCES);
    } catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const balanceOfUserStock:any = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        if(!userId) {
            return res.status(400).json("Please input userId first");
        }
        let output = STOCK_BALANCES.hasOwnProperty(userId);
        if(output) {
            return res.status(200).json(STOCK_BALANCES[userId]);
        } else return res.status(400).json({msg: "User Id Not valid"});
    } catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const reset:any = async (req: Request, res: Response) => {
    try {
        for (let key in INR_BALANCES) {
            if(INR_BALANCES.hasOwnProperty(key)) {
                delete INR_BALANCES[key];
            }
        };
        for (let key in STOCK_BALANCES) {
            if(STOCK_BALANCES.hasOwnProperty(key)) {
                delete STOCK_BALANCES[key];
            }
        };
        for (let key in ORDERBOOK) {
            if(ORDERBOOK.hasOwnProperty(key)) {
                delete ORDERBOOK[key];
            }
        }
        // Problem was assignment to constant variable is not defined and fir uske liye ek alag object banana padta and humko same object ko null krna h
        // INR_BALANCES = {}, STOCK_BALANCES = {}, ORDERBOOK = {} 

        return res.status(200).json({INR_BALANCES, STOCK_BALANCES, ORDERBOOK});
    }
    catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const orderbook:any = async (req: Request, res: Response) => {
    try {
        return res.status(200).json(ORDERBOOK);
    }
    catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const viewBook:any = async (req: Request, res: Response) => {
    try {
        const stockSymbol = req.params.stockSymbol;
        if(!stockSymbol) {
            return res.status(500).json("Please input Stock Symbol");
        }
        if(!(stockSymbol in ORDERBOOK)) {
            return res.status(501).json("Stock Symbol does not exist yet");
        }
        return res.status(200).json(ORDERBOOK[stockSymbol]);

    } catch (error: any) {
        return res.status(400).json({
            error: error.message
        })
    }
}

export const createSymbol:any = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let symbol = req.params.stockSymbol;
        if(!symbol) {
            return res.status(400).json("Please input symbol first");
        }
        ORDERBOOK[symbol] = {yes: {}, no: {}};
        return res.status(200).json(ORDERBOOK);
    }
    catch (error: any) {
        return res.status(400).json({
            msg: error.message
        })
    }
}

export const mintTokens:any = async (req: Request, res: Response) => {
    try {
        const {userId, stockSymbol, quantity} = req.body;        

        if(!userId || !stockSymbol || !quantity) {
            return res.status(400).json("Please insert all inputs");
        }
        if(quantity === 0) {
            return res.status(400).json("Please put quantity a number above 0")
        }


        STOCK_BALANCES[userId] = STOCK_BALANCES[userId] ?? {};
        STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] ?? {};

        let stock = STOCK_BALANCES[userId][stockSymbol];
        stock.yes = stock.yes ?? {"quantity": 0, "locked": 0};
        stock.no = stock.no ?? {"quantity": 0, "locked": 0};

        stock.yes["quantity"] += quantity;
        stock.no["quantity"] += quantity;

        res.status(200).json({STOCK_BALANCES});
    } catch (error) {
        return res.status(400).json(error)
    }
}

export const cancel:any = async (req: Request, res: Response) => {
    try {        
        const {orderId, quantity, stockSymbol, stockType, price, userId} = req.body;
        const oppositePrice: number = 10-price;
        const oppositeType: string = stockType === "yes" ? "no" : "yes";
        const array = ORDERBOOK[stockSymbol][stockType][price].orders;      
        const oppositeArray =  ORDERBOOK[stockSymbol]?.[oppositeType]?.[oppositePrice]?.orders || []; 
      
        if(!array || !oppositeArray){
            return res.status(400).json("Orders array not present");
        }; 

        let success: boolean = false;
            
        array.forEach((item) => {
            if(item.orderId === orderId && item.type === "normal" && item.userId === userId && item.quantity >= quantity){
                item.quantity -= quantity;
                success = true;
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;
                STOCK_BALANCES[userId][stockSymbol][stockType].locked -= quantity;
            }    
        })
        if(success) {
            ORDERBOOK[stockSymbol][stockType][price].total -= quantity;
            return res.status(200).json({msg: "ORDER CANCELLED, STOCK BALANCE UPDATED", ORDERBOOK, STOCK_BALANCES, INR_BALANCES}); // yahi se retrun kr dia kyoki order id pata thi to koi aur ni hoag
        }
        success = false;
            
        oppositeArray.forEach((item) => {
            if(item.orderId === orderId && item.type === "reverse" && item.userId === userId && item.quantity >= quantity){
                item.quantity -= quantity;
                success = true;
                INR_BALANCES[userId].locked -= (price*quantity);
                INR_BALANCES[userId].balance += (price*quantity);
            }        
        })
        if(success) {
            ORDERBOOK[stockSymbol][oppositeType][oppositePrice].total -= quantity
            return res.status(200).json({msg: "ORDER CANCELLED, INR BALANCE UPDATED", ORDERBOOK, STOCK_BALANCES, INR_BALANCES});                                            
        }
        return res.status(400).json("That OrderId does not have this quantity");
    } catch (error) {
        return res.status(500).json(error);
    }
}

export const sellYesNo: any = async (req: Request, res: Response) => {
    try {
        let { userId, stockSymbol, quantity, stockType, price }: {
            userId: string,
            stockSymbol: string,
            quantity: number,
            stockType: string,
            price: number
        } = req.body;
        if (!userId || !stockSymbol || !quantity || !stockType || !price) {
            return res.status(400).json("Please provide complete information");
        }

        const presentStockQuantity = STOCK_BALANCES?.[userId]?.[stockSymbol]?.[stockType]?.quantity || 0;

        if (presentStockQuantity < quantity) {
            return res.status(400).json("Stock Balance is insufficient");
        }

        const oppositeStockType: string = stockType === "yes" ? "no" : "yes";
        const oppositePrice: number = 10-Number(price);
        const orderId: number = Math.floor(Math.random() * 100);
console.log("267");
        if (ORDERBOOK?.[stockSymbol]?.[oppositeStockType]) {
            console.log("CODE COMES IN LINE 269");
            
            const priceArray:number[] = Object.keys(ORDERBOOK[stockSymbol][oppositeStockType]).map(Number).sort();
            const finalPriceArray:number[] = priceArray.filter(num => num <= oppositePrice);  
            if(finalPriceArray.length === 0) {
                console.log("CODE COMES IN LINE 274");
                ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][stockType][price] || { total: 0, orders: [] };
                ORDERBOOK[stockSymbol][stockType][price].total += quantity;
                ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
                STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
                return res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
                console.log("LETS SEE IF CODE RETURNS OR NOT PART 1");
            }
            console.log("LETS SEE IF CODE RETURNS OR NOT PART 2");
                for (const item of finalPriceArray) {
                    let quantityPresentInFirstElement = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].total;

                    if (quantityPresentInFirstElement < quantity) {
                        console.log("This is line 288");
                        INR_BALANCES[userId].balance += price*quantityPresentInFirstElement;
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantityPresentInFirstElement;
                        const array = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].orders || [];
                        for (let el of array) {
                            if (el.type === "normal") {
                                INR_BALANCES[el.userId].balance += (el.quantity * Number(el));
                                await functionUsedInsideArrayBuy(el, stockSymbol, oppositeStockType);
                                STOCK_BALANCES[el.userId][stockSymbol][oppositeStockType].quantity -= el.quantity;
                            } else {
                                INR_BALANCES[el.userId].locked -= (el.quantity * price);
                                await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += el.quantity;
                            }
                        }
                        quantity -= quantityPresentInFirstElement;
                        delete ORDERBOOK[stockSymbol][oppositeStockType][Number(item)];
                    } else {
                        console.log("This is line 306");
                        INR_BALANCES[userId].balance += (quantity * price);
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
                        ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].total -= quantity;
                        const array = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].orders || [];

                        for (let item of array) {
                            if (quantity >= item.quantity) {
                                quantity -= item.quantity;
                                if (item.type === "normal") {
                                    INR_BALANCES[item.userId].balance += (item.quantity * Number(item));
                                    await functionUsedInsideArrayBuy(item, stockSymbol, oppositeStockType);
                                    STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity;
                                } else {
                                    INR_BALANCES[item.userId].locked -= (item.quantity * price);
                                    await functionUsedInsideArrayBuy(item, stockSymbol, stockType);
                                    STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += item.quantity;
                                }
                                array.shift();
                            } else {
                                item.quantity -= quantity;
                                if (item.type === "normal") {
                                    INR_BALANCES[item.userId].balance += (quantity * Number(item));
                                    await functionUsedInsideArrayBuy(item, stockSymbol, oppositeStockType);
                                    STOCK_BALANCES[item.userId][stockSymbol][oppositeStockType].quantity -= item.quantity;
                                } else {
                                    INR_BALANCES[item.userId].locked -= (quantity * price);
                                    await functionUsedInsideArrayBuy(item, stockSymbol, stockType);
                                    STOCK_BALANCES[item.userId][stockSymbol][stockType].quantity += quantity;
                                }
                                quantity = 0;
                                return res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});                            }
                        }
                    }
                }                
                ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][stockType][price] || { total: 0, orders: [] };
                ORDERBOOK[stockSymbol][stockType][price].total += quantity;
                ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
                STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
                return res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
            
        } else {
            console.log("line 347")
            ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK?.[stockSymbol]?.[stockType]?.[price] || { total: 0, orders: [] };
            console.log("Line 349");
            ORDERBOOK[stockSymbol][stockType][price].total += quantity;
            ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
            return res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
        }
    } catch (error) {
        console.log(error)
         return res.status(501).json(error);
    }
};


export const buyYesNo: any = async (req: Request, res: Response) => {
    try {        
        let {userId, stockSymbol, quantity, stockType, price}:{
            userId: string,
            stockSymbol:string,
            quantity: number,
            stockType: string,
            price: number
        } = req.body;
        if(!userId || !stockSymbol || !quantity || !stockType || !price) {
            return res.status(400).json("Please provide whole information");
        }
        const userBalance = INR_BALANCES?.[userId]?.balance;
        if(userBalance < quantity*price) {
            res.status(400).json("INR not available");
        }
        const oppositePrice = 10-price;
        const oppositeStockType = stockType === "yes" ? "no" : "yes";
        const orderId = Math.floor(Math.random() * 100);

        if(ORDERBOOK[stockSymbol][stockType]) {
            const priceArray = Object.keys(ORDERBOOK[stockSymbol][stockType]).map(Number).sort();
            const finalPriceArray:number[] = priceArray.filter(num => num <= price);
            if(finalPriceArray.length === 0) {
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES}); 
            }
            for (const item of finalPriceArray) {  
                let quantityPresentInFirstElement = ORDERBOOK[stockSymbol][stockType][Number(item)].total;
                if(quantityPresentInFirstElement < quantity) {
                    console.log("Tyjh log hina padega");
                    
                        
                        INR_BALANCES[userId].locked += Number(item)*quantityPresentInFirstElement;
                        // IN 3 lines ko bi middleware me dalunga kisi din
                        STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {}
                        STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] || {}
                        STOCK_BALANCES[userId][stockSymbol][stockType] = STOCK_BALANCES[userId][stockSymbol][stockType] || {}
                        // 
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantityPresentInFirstElement;
                        const array = ORDERBOOK[stockSymbol][stockType][Number(item)].orders || [];
                        for (let el of array) {
                                quantity -= el.quantity;
                                if(el.type === "normal") {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= el.quantity;
                                    INR_BALANCES[el.userId].balance += el.quantity * Number(item);
                                }
                                else {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    INR_BALANCES[el.userId].locked -= el.quantity * Number(item);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += el.quantity;
                                }
                            }
                        // quantity -= quantityPresentInFirstElement;
                        delete ORDERBOOK[stockSymbol][stockType][Number(item)];
                    }        
                    // return res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES})        
                else {   
                         
                        ORDERBOOK[stockSymbol][stockType][Number(item)].total -= quantity;
                        INR_BALANCES[userId].balance -= quantity*Number(item);
                        // bula le bande
                        STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {};
                        STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] || {};
                        STOCK_BALANCES[userId][stockSymbol][stockType] = STOCK_BALANCES[userId][stockSymbol][stockType] || {};
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity = STOCK_BALANCES[userId][stockSymbol][stockType].quantity || 0;
                        STOCK_BALANCES[userId][stockSymbol][stockType].locked = STOCK_BALANCES[userId][stockSymbol][stockType].locked || 0;

                        // bhej de bande
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;
                        
                        const array = ORDERBOOK[stockSymbol][stockType][Number(item)].orders || [];
                        
                        for (let el of array) {
                            if(quantity >= el.quantity) {
                                quantity -= el.quantity;
                                if(el.type === "normal") {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= el.quantity;
                                    INR_BALANCES[el.userId].balance += el.quantity * Number(item);
                                }
                                else {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    INR_BALANCES[el.userId].locked -= el.quantity * Number(item);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += el.quantity;
                                }
                                array.shift();
                            }
                            else {                                
                                el.quantity -= quantity;
                                if(el.type === "normal") {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= quantity;
                                    INR_BALANCES[el.userId].balance += quantity * Number(item);                                   
                                }
                                else {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    INR_BALANCES[el.userId].locked -= quantity * Number(item);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += quantity;
                                }
                                quantity = 0;
                                return res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});
                            }
                        }
                    }
                }
            
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});            
        }
        else {
            // sudo order laga do, bina price ki bakchodi ke to matlab same code
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                return res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
        }

    }
    catch (error) {
        return res.status(500).json(error);
    }
}


export const functionUsedInsideArrayBuy: any = async (el: any, stockSymbol: string, stockType: string) => {
    try {
        STOCK_BALANCES[el.userId] = STOCK_BALANCES[el.userId] || {}
        STOCK_BALANCES[el.userId][stockSymbol] = STOCK_BALANCES[el.userId][stockSymbol] || {}
        STOCK_BALANCES[el.userId][stockSymbol][stockType] = STOCK_BALANCES[el.userId][stockSymbol][stockType] || {}
        STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity = STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity || 0;
        STOCK_BALANCES[el.userId][stockSymbol][stockType].locked = STOCK_BALANCES[el.userId][stockSymbol][stockType].locked || 0;
    } catch (error) {
        return error;
    }
}

