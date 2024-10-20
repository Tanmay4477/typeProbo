export let INR_BALANCES: inr = {
    "user1": {
        balance: 1000,
        locked: 0
    },
    "user2": {
        balance: 20,
        locked: 0
    },
    "user3": {
        balance: 25,
        locked: 0
    },
    "user4": {
        balance: 500,
        locked: 0
    }
}

interface user {
    balance: number,
    locked: number
}

interface inr {
    [userId: string]: user
}



export let ORDERBOOK: book = {
    "BTC_USDT_10_OCT_2024": {
        "yes": {
            "9.5": {
                "total": 6,
                "orders": [{userId: "user1", type: "reverse", quantity: 4}, {userId: "user4", type: "normal", quantity: 2}]
            },
            "8.5": {
                "total": 4,
                "orders": [{userId: "user2", type: "normal", quantity: 3}, {userId: "user1", type: "normal", quantity: 5}]
            }
        },
        "no": {
            "1": {
                "total": 3,
                "orders": [{userId: "user3", type: "normal", quantity: 2}, {userId: "user2", type: "normal", quantity: 1}]
            }
        }
    },
    "BTC_USDT_9_OCT_2024": {
        "yes": {
            "6": {
                "total": 9,
                "orders": [{userId: "user1", type: "reverse", quantity: 4}, {userId: "user4", type: "normal", quantity: 5}]
            },
            "5": {
                "total": 30,
                "orders": [{userId: "user3", type: "normal", quantity: 10}, {userId: "user2", type: "reverse", quantity: 20}]
            }
        }
    }
}

interface orders {
    userId: string,
    type: string,
    quantity: number
}
interface price {
    total: number,
    orders: orders[]
}
interface stockType {
    [key: string]: price
}
interface stockSymbol {
    [key: string]: stockType
}
interface book {
    [key: string]: stockSymbol
}


export let STOCK_BALANCES: stockBalance = {
	"user1": {
	   "BTC_USDT_10_OCT_2024": {
		   "yes": {
			   "quantity": 5,
			   "locked": 0
		   },
           "no": {
                "quantity": 0,
                "locked": 0
           }
	   }
	},
	"user2": {
		"BTC_USDT_10_OCT_2024": {
		   "no": {
			   "quantity": 3,
			   "locked": 4
		   }
	   }
	},
    "user4": {
		"BTC_USDT_10_OCT_2024": {
		   "yes": {
			   "quantity": 3,
			   "locked": 0
		   },
           "no": {
            "quantity": 9,
            "locked": 0
           }
	   }
	},
}


interface yesOrNo {
    quantity: number,
    locked: number
}

interface stock {
    [key: string] : yesOrNo
}

interface user2 {
    [key: string]: stock
}

interface stockBalance {
    [key: string]: user2
}
