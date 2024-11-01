import {Request, Response} from "express";
import { ORDERBOOK, STOCK_BALANCES, INR_BALANCES, orders, resetVariables } from "./variables";


export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.userId;
        if(!id) {
            res.status(404).json("Please input id");
            return
        }
        INR_BALANCES[id] = {
            balance: 0,
            locked: 0
        };
        STOCK_BALANCES[id] = {};
 
        res.status(200).json({STOCK_BALANCES, INR_BALANCES});
    } catch (error) {
        res.status(400).json("Catch error")
    }
}

export const inrBalances = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json(INR_BALANCES);
        return
    } catch (error) {
        res.status(400).json("Catch error");
    }
}

export const balanceOfUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        if(!userId) {
            res.status(403).json("Please input userId first");
            return
        }
        let output = userId in INR_BALANCES;
        if(!!output) {
            res.status(200).json(INR_BALANCES[userId]);
            return
       }
       else res.status(400).json("User not exist");
    } catch (error) {
         res.status(400).json("Catch error")
    }
}

export const onrampInr = async (req: Request, res: Response): Promise<void> => {
    try {
        const {userId, amount} = req.body;
        if(!INR_BALANCES[userId]) {
        INR_BALANCES[userId] = INR_BALANCES[userId] || {balance: 0, locked: 0};
        }

        INR_BALANCES[userId].balance += amount/100;
        res.status(200).json(INR_BALANCES[userId]);
        return
    } 

    catch (error) {
        res.status(400).json(error)
    }
}

export const stockBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json(STOCK_BALANCES);
        return
    } catch (error) {
        res.status(400).json("Catch error")
        return
    }
}

export const balanceOfUserStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        if(!userId) {
            res.status(400).json("Please input userId first");
            return
        }
        let output = STOCK_BALANCES.hasOwnProperty(userId);
        if(output) {
            res.status(200).json(STOCK_BALANCES[userId]);
            return
        } else res.status(400).json({msg: "User Id Not valid"});4
        return
    } catch (error) {
        res.status(400).json("Catch error");
    }
}

export const reset = async (req: Request, res: Response): Promise<any> => {
    try {
        resetVariables();
        return res.status(200).json({INR_BALANCES, STOCK_BALANCES, ORDERBOOK});
    }
    catch (error) {
        return res.status(400).json("Catch error");
    }
}

export const orderbook = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json(ORDERBOOK);
        return
    }
    catch (error) {
        res.status(400).json("Catch error")
        return
    }
}

export const viewBook = async (req: Request, res: Response):Promise<void> => {
    try {
        const stockSymbol = req.params.stockSymbol;
        if(!stockSymbol) {
            res.status(500).json("Please input Stock Symbol");
            return
        }
        if(!(stockSymbol in ORDERBOOK)) {
            res.status(501).json("Stock Symbol does not exist yet");
            return
        }
        res.status(200).json(ORDERBOOK[stockSymbol]);
        return

    } catch (error) {
        res.status(400).json("Catch error");
        return
    }
}

export const createSymbol = async (req: Request, res: Response): Promise<void> => {
    try {
        let symbol = req.params.stockSymbol;
        if(!symbol) {
            res.status(400).json("Please input symbol first");
            return
        }
        ORDERBOOK[symbol] = {yes: {}, no: {}};
        res.status(200).json(ORDERBOOK);
        return
    }
    catch (error) {
        res.status(400).json("Catch error")
    }
 }


export const mintTokens = async (req: Request, res: Response): Promise<void> => {
    try {
        const {userId, stockSymbol, quantity} = req.body;        

        if(!userId || !stockSymbol || !quantity) {
            res.status(400).json("Please insert all inputs");
            return;
        }
        if(quantity === 0) {
            res.status(400).json("Please put quantity a number above 0");
            return;
        }


        STOCK_BALANCES[userId] = STOCK_BALANCES[userId] ?? {};
        STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] ?? {};

        let stock = STOCK_BALANCES[userId][stockSymbol];
        stock.yes = stock.yes ?? {"quantity": 0, "locked": 0};
        stock.no = stock.no ?? {"quantity": 0, "locked": 0};

        stock.yes["quantity"] += quantity;
        stock.no["quantity"] += quantity;

        res.status(200).json({STOCK_BALANCES});
        return
    } catch (error) {
        res.status(400).json(error);
        return
    }
}

export const cancel = async (req: Request, res: Response): Promise<void> => {
    try {        
        const {orderId, quantity, stockSymbol, stockType, price, userId} = req.body;
        const oppositePrice: number = 10-price;
        const oppositeType: string = stockType === "yes" ? "no" : "yes";
        const array = ORDERBOOK[stockSymbol][stockType][price].orders;      
        const oppositeArray =  ORDERBOOK[stockSymbol]?.[oppositeType]?.[oppositePrice]?.orders || []; 
      
        if(!array || !oppositeArray){
            res.status(400).json("Orders array not present");
            return
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
            res.status(200).json({msg: "ORDER CANCELLED, STOCK BALANCE UPDATED", ORDERBOOK, STOCK_BALANCES, INR_BALANCES}); // yahi se retrun kr dia kyoki order id pata thi to koi aur ni hoag
            return;
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
            res.status(200).json({msg: "ORDER CANCELLED, INR BALANCE UPDATED", ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
            return                                            
        }
        res.status(400).json("That OrderId does not have this quantity");
        return
    } catch (error) {
        res.status(500).json(error);
        return
    }
}

export const sellYesNo = async (req: Request, res: Response): Promise<void> => {
    try {
        let { userId, stockSymbol, quantity, stockType, price }: {
            userId: string,
            stockSymbol: string,
            quantity: number,
            stockType: string,
            price: number
        } = req.body;
        if (!userId || !stockSymbol || !quantity || !stockType || !price) {
            res.status(400).json("Please provide complete information");
            return
        }


        STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {};
        STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] || {};
        STOCK_BALANCES[userId][stockSymbol][stockType] =  STOCK_BALANCES[userId][stockSymbol][stockType] || {quantity: 0, locked: 0};


        const presentStockQuantity = STOCK_BALANCES[userId][stockSymbol][stockType].quantity;

        if (presentStockQuantity < quantity) {
            res.status(400).json("Stock Balance is insufficient");
            return
        }

        const oppositeStockType: string = stockType === "yes" ? "no" : "yes";
        const oppositePrice: number = 10-Number(price);
        const orderId: number = Math.floor(Math.random() * 100);
        ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || {};
        ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};
        ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
        let proboProfit = 0;

        if (ORDERBOOK[stockSymbol][oppositeStockType]) {
            
            const priceArray:number[] = Object.keys(ORDERBOOK[stockSymbol][oppositeStockType]).map(Number).sort();
            const finalPriceArray:number[] = priceArray.filter(num => num <= oppositePrice);  
            if(finalPriceArray.length === 0) {
                ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || {};
                ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};
                ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][stockType][price] || {total: 0, orders: []};
                ORDERBOOK[stockSymbol][stockType][price].total += quantity;
                ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
           
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
                STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
                res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
                return
            }
                for (const item of finalPriceArray) {
                    let quantityPresentInFirstElement = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].total;
                    INR_BALANCES[userId] = INR_BALANCES[userId] ?? {balance: 0, locked: 0};

                    if (quantityPresentInFirstElement < quantity) {
                        INR_BALANCES[userId].balance += price*quantityPresentInFirstElement;
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantityPresentInFirstElement;
                        const array = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].orders;
                        for (let el of array) {
                            quantity -= el.quantity;
                            proboProfit += (oppositePrice - item) * el.quantity;
                            if (el.type === "normal") {
                                INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
                                INR_BALANCES[el.userId].balance += (el.quantity * Number(el));
                                STOCK_BALANCES[el.userId][stockSymbol][oppositeStockType].locked -= el.quantity;
                            } else {
                                INR_BALANCES[el.userId].locked -= (el.quantity * price) + proboProfit;
                                await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += el.quantity;
                            }
                        }
                        // quantity -= quantityPresentInFirstElement;
                        delete ORDERBOOK[stockSymbol][oppositeStockType][Number(item)];
                    } else {
                        INR_BALANCES[userId].balance += (quantity * price);
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
                        ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].total -= quantity;
                        const array = ORDERBOOK[stockSymbol][oppositeStockType][Number(item)].orders;

                        for (let el of array) {
                            if (quantity >= el.quantity) {
                                quantity -= el.quantity;
                                proboProfit += (oppositePrice - item) * el.quantity;
                                if (el.type === "normal") {
                                    INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
                                    INR_BALANCES[el.userId].balance += (el.quantity * Number(item));
                                    STOCK_BALANCES[el.userId][stockSymbol][oppositeStockType].locked -= el.quantity;
                                } else {
                                    INR_BALANCES[el.userId].locked -= (el.quantity * price) + proboProfit;
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += el.quantity;
                                }
                                array.shift();
                            } else {
                                el.quantity -= quantity;
                                proboProfit += (oppositePrice - item) * quantity;
                                if (el.type === "normal") {
                                    INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
                                    INR_BALANCES[el.userId].balance += (quantity * Number(item));
                                    STOCK_BALANCES[el.userId][stockSymbol][oppositeStockType].locked -= quantity;
                                } else {
                                    INR_BALANCES[el.userId].locked -= (quantity * price) + proboProfit;
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += quantity;
                                }
                                quantity = 0;
                                res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});
                                return                            
                            }
                        }
                    }
                }   

            ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][stockType][price] || {total: 0, orders: []};
            ORDERBOOK[stockSymbol][stockType][price].total += quantity;
            ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
           
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
            res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
            return
            
        } else {

            ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][stockType][price] || {total: 0, orders: []};
            ORDERBOOK[stockSymbol][stockType][price].total += quantity;
            ORDERBOOK[stockSymbol][stockType][price].orders.push({ userId: userId, type: "normal", quantity: quantity, orderId: orderId });
            STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
            STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
            res.status(200).json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES });
            return
        }
    } catch (error) {
        res.status(501).json(error);
        return
    }
};


export const buyYesNo = async (req: Request, res: Response): Promise<void> => {
    try {        
        let {userId, stockSymbol, quantity, stockType, price}:{
            userId: string,
            stockSymbol:string,
            quantity: number,
            stockType: string,
            price: number
        } = req.body;
        if(!userId || !stockSymbol || !quantity || !stockType || !price) {
            res.status(400).json("Please provide whole information");
            return
        }

        if(!INR_BALANCES[userId]) {
            res.status(400).json("Jab user hi nhi h to khareed kon raha h");
            return
        }

        const userBalance = INR_BALANCES[userId].balance;
        if(userBalance < quantity*price) {
            res.status(400).json("INR not available");
            return
        }
        const oppositePrice = 10-price;
        const oppositeStockType = stockType === "yes" ? "no" : "yes";
        const orderId = Math.floor(Math.random() * 100);
        ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || {};
        ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};

        if(ORDERBOOK[stockSymbol][stockType]) {
            const priceArray = Object.keys(ORDERBOOK[stockSymbol][stockType]).map(Number).sort();
            const finalPriceArray:number[] = priceArray.filter(num => num <= price);
            if(finalPriceArray.length === 0) {
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES}); 
                return
            }
            for (const item of finalPriceArray) {  
                let quantityPresentInFirstElement = ORDERBOOK[stockSymbol][stockType][Number(item)].total;
                STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {}
                STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] || {}
                STOCK_BALANCES[userId][stockSymbol][stockType] = STOCK_BALANCES[userId][stockSymbol][stockType] || {quantity: 0, locked: 0};

                if(quantityPresentInFirstElement < quantity) {         
                        INR_BALANCES[userId].balance -= Number(item)*quantityPresentInFirstElement;               
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantityPresentInFirstElement;
                        const array = ORDERBOOK[stockSymbol][stockType][Number(item)].orders;
                        for (let el of array) {
                                quantity -= el.quantity;
                                if(el.type === "normal") {
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= el.quantity;
                                    INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
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
                else {   
                         
                        ORDERBOOK[stockSymbol][stockType][Number(item)].total -= quantity;
                        INR_BALANCES[userId].balance -= quantity*Number(item);
                        STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;
                        
                        const array = ORDERBOOK[stockSymbol][stockType][Number(item)].orders;
                        
                        for (let el of array) {
                            if(quantity >= el.quantity) {
                                quantity -= el.quantity;
                                if(el.type === "normal") {
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= el.quantity;
                                    INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
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
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].locked -= quantity;
                                    INR_BALANCES[el.userId] = INR_BALANCES[el.userId] ?? {balance: 0, locked: 0};
                                    INR_BALANCES[el.userId].balance += quantity * Number(item);                                   
                                }
                                else {
                                    await functionUsedInsideArrayBuy(el, stockSymbol, stockType);
                                    INR_BALANCES[el.userId].locked -= quantity * Number(item);
                                    STOCK_BALANCES[el.userId][stockSymbol][stockType].quantity += quantity;
                                }
                                quantity = 0;
                                res.status(200).json({ORDERBOOK, INR_BALANCES, STOCK_BALANCES});
                                return
                            }
                        }
                    }
                }
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
                return            
        }
        else {
            // pseudo order laga do, bina price ki bakchodi ke to matlab same code
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType] = ORDERBOOK[stockSymbol][oppositeStockType] || {};
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] = ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice] || {total: 0, orders: []};
                // A check
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].total += quantity;
                ORDERBOOK[stockSymbol][oppositeStockType][oppositePrice].orders.push({userId: userId, type: "reverse", quantity: quantity, orderId: orderId});
                INR_BALANCES[userId].balance -= (price*quantity);
                INR_BALANCES[userId].locked += (price*quantity);
                res.status(200).json({ORDERBOOK, STOCK_BALANCES, INR_BALANCES});
                return
        }

    }
    catch (error) {
        res.status(500).json(error);
    }
}


export const functionUsedInsideArrayBuy = async (el: orders, stockSymbol: string, stockType: string) => {
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

