import {Request, Response} from "express";
import {createClient} from "redis";
const client = createClient();
const subscriber = createClient();
import { v4 as uuidv4 } from 'uuid';

export async function setupClient() {
    console.log("worker started")
    try {
        client.on("error", err => console.log("Redis Client Error", err))
        await client.connect();
        await subscriber.connect();
        console.log('connection success')
    } catch (error) {
        console.log(error);
        return error;
    }
}


export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.userId;
        if(!id) {
            res.status(404).json("Please input id");
            return
        }
        const channelname = Math.random().toString();
        const data = JSON.stringify({func: "createUSer", data:{id,channelname}})
        
        
        const callback = (message:string) => {
            res.status(200).json({message});
            subscriber.unsubscribe("channel2",callback)
        }


        subscriber.subscribe(channelname,callback )
        await client.lPush("probo", data);
        
    } catch (error) {
        // res.status(400).json("Catch error")
        console.log(error)
    }
}


export const inrBalances = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = JSON.stringify({func: "inrBalances"});

        const callback = (message: string) => {
            const finalMessage = JSON.parse(message);
            res.status(200).json(finalMessage);
            subscriber.unsubscribe("channel1");
        }
        subscriber.subscribe("channel1", callback);
        await client.lPush("probo", data);
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
        const data = JSON.stringify({func: "balOfUser", id: userId});
        const callback = (message: string) => {
            const finalMessage = JSON.parse(message);
            res.status(200).json(finalMessage);
            subscriber.unsubscribe("channel3");
        }; 
        subscriber.subscribe("channel3", callback);
        await client.lPush("probo", data);
    } catch (error) {
         res.status(400).json("Catch error")
    }
}

export const onrampInr = async (req: Request, res: Response): Promise<void> => {
    try {
        const {userId, amount} = req.body;

        if(!userId || !amount) {
            res.status(400).json("Please enter all inputs");
        };

        const callback = (message: string) => {
            const finalMessage = JSON.parse(message);
            res.status(200).json(finalMessage);
            subscriber.unsubscribe("onrampChannel");
        }
        subscriber.subscribe("onrampChannel", callback);
        client.lPush("probo", JSON.stringify({func: "onRamp", userId: userId, amount: amount}));
    } 

    catch (error) {
        res.status(400).json(error)
    }
}

export const stockBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        subscriber.subscribe("stockBalanceChannel", (message) => {
            subscriber.unsubscribe("stockBalanceChannel")
           return res.status(200).json(JSON.parse(message));
        });
        client.lPush("probo", JSON.stringify({func: "stockBalance"}));
    } catch (error) {
        res.status(400).json("Catch error")
    }
}

export const balanceOfUserStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        if(!userId) {
            res.status(400).json("Please input userId first");
            return
        }
        subscriber.subscribe("balOfUserChannel", (message) => {
            res.status(200).json(JSON.parse(message));            
        });
        client.lPush("probo", JSON.stringify({func: "balOfUser", id: userId}));        
    } catch (error) {
        res.status(400).json("Catch error");
    }
}

export const reset = async (req: Request, res: Response): Promise<any> => {
    try {
        subscriber.subscribe("resetChannel", (message) => {
            res.status(200).json(message);
            subscriber.unsubscribe("resetChannel");
        })
        client.lPush("probo", JSON.stringify({func: "reset"}));
    }
    catch (error) {
        return res.status(400).json("Catch error");
    }
}

export const orderbook = async (req: Request, res: Response): Promise<void> => {
    try {
        client.lPush("probo", JSON.stringify({func: "orderbook"}));
        const response: {key: string, element: string} | null = await client.brPop("orderbook", 0);
        if(response) {
            const finalResponse = JSON.parse(response.element);
            res.status(200).json(finalResponse);
        }
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
        subscriber.subscribe("viewSymbol", (message) => {
            res.status(200).json(JSON.parse(message));
            subscriber.unsubscribe("viewSymbol");
        })
        client.lPush("probo", JSON.stringify({func: "viewSymbol", symbol: stockSymbol}));
        return;

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
        subscriber.subscribe("createSymbol", (message) => {
            res.status(200).json(message);
        })
        client.lPush("probo", JSON.stringify({func: "createSymbol", symbol: symbol}));
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

        subscriber.subscribe("mint", (message) => {
            subscriber.unsubscribe("mint");
            res.status(200).json(message);
        })

        client.lPush("probo", JSON.stringify({func: "mint", id: userId, symbol: stockSymbol, quantity: quantity}));
    } catch (error) {
        res.status(400).json(error);
        return
    }
}

export const cancel = async (req: Request, res: Response): Promise<void> => {
    try {        
        const {orderId, quantity, stockSymbol, stockType, price, userId} = req.body;
        if(!orderId || !quantity || !stockSymbol || !stockType || !price || !userId) {
            res.status(400).json("Please enter all the fields");
        }
        subscriber.subscribe("cancel", (message: string) => {
            subscriber.unsubscribe("cancel");
            res.status(200).json(message);
        })
        client.lPush("probo", JSON.stringify({func: "cancel", orderId: orderId, quantity: quantity, stockSymbol: stockSymbol, stockType: stockType, price: price, userId: userId}));
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

        subscriber.subscribe("sell", (message: string) => {
            const msg = JSON.parse(message);
            res.status(JSON.parse(msg.code)).json(JSON.parse(msg.value));
        })
        client.lPush("probo", JSON.stringify({func: "sell", userId: userId, stockSymbol: stockSymbol, quantity: quantity, stockType: stockType, price: price}))
        
    } catch (error) {
        res.status(500).json(error);
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
        const uuid = uuidv4();
        subscriber.subscribe(`buy${uuid}`, (message) => {
            try {
                const msg = JSON.parse(message);
                res.status(msg.code).json(msg.value);
            } catch (error) {
                console.log(error);
                res.status(500).json(error);
            } finally{
                subscriber.unsubscribe(`buy${uuid}`);
            }
        })
        client.lPush("probo", JSON.stringify({func: "buy", uuid, userId, stockSymbol, quantity, stockType, price}));  
        }    
    catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}




