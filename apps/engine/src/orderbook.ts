export type Order = {
    id:string,
    userId:string,

    price:bigint,
    quantity:bigint,
    filled_qty:bigint

    margin:bigint,
    leverage:bigint,

    side:"LONG"|"SHORT",
    createdAt:Date
}

//need to add interface snapshot and logic for that as well.
type price_level = Map<string,Order>

export type Orderbook = {
    //need to use BTree but throwing error for somereason
    bids: Map<bigint,price_level>
    asks: Map<bigint,price_level>
    seq: number
    orderIndex: Map<string, {side: "LONG" | "SHORT", price:bigint}>
}

export type DepthLevel={
    price:string,
    size:string,
    total:string
}

export type BookSnapShot={
    bids:DepthLevel[]
    asks:DepthLevel[]
    seq:number
}

function remaining_qty(order:Order):bigint{
    return order.quantity-order.filled_qty
}

export function createOrderbook(): Orderbook{
    return {
        bids: new Map(),
        asks: new Map(),
        seq: 0,
        orderIndex: new Map()
    }
}

export function get_snapshot(book:Orderbook,depth=20):BookSnapShot{
    const bid_prices = [...book.bids.keys()].sort((a,b)=>( a > b? - 1:1 )).slice(0,depth)
    const ask_prices = [...book.bids.keys()].sort((a,b)=>( a < b? - 1:1 )).slice(0,depth)

    let cummulative = 0n;
    const bids:DepthLevel[] = bid_prices.map(price=>{
        const level = book.bids.get(price)!
        const size = [...level?.values()].reduce((s,o)=>s+remaining_qty(o),0n)
        cummulative += size
        return { price: price.toString(),size:size.toString(),total:cummulative.toString()}
    })

    cummulative = 0n
    const asks: DepthLevel[] = ask_prices.map(price => {
        const level = book.asks.get(price)!
        const size = [...level.values()].reduce((s, o) => s + remaining_qty(o), 0n)
        cummulative += size
        return { price: price.toString(), size: size.toString(), total: cummulative.toString() }
    })

    return { bids, asks, seq: book.seq }
}

function round_to_tick(price:bigint,tick:bigint,roundup:boolean):bigint{
    const rem = price% tick
    if(rem==0n) return price
    return roundup ? price + (tick - rem):price-rem
}


export function create_order(book:Orderbook,order:Order){
    const map =  order.side === "LONG" 
    ? book.bids     
    : book.asks
        console.log("create_order side:", order.side, "price:", order.price)

    const level = map.get(order.price) ?? new Map<string,Order>()
    
    level.set(order.id,order)
    map.set(order.price,level)
    book.orderIndex.set(order.id,{side:order.side,price:order.price})
    book.seq++
}
        
export function removeOrder(book:Orderbook,orderId:string){
    const entry =book.orderIndex.get(orderId)
    if(!entry) return
    
    const map = entry.side ==="LONG"
    ? book.bids 
    : book.asks
 
    const level = map.get(entry.price)
    if(!level) return
    level.delete(orderId)
    if(level.size === 0 ) map.delete(entry.price)
        book.orderIndex.delete(orderId)
    book.seq++
}

export function bestBid(book: Orderbook): Order | undefined {
    if(book.bids.size ===0) return undefined
    const best_price = [...book.bids.keys()].sort((a,b)=>a>b?-1:1)[0]
    return book.bids.get(best_price)?.values().next().value
}

export function bestAsk(book: Orderbook): Order | undefined {
    if (book.asks.size === 0) return undefined
    const bestPrice = [...book.asks.keys()].sort((a, b) => a < b ? -1 : 1)[0]
    return book.asks.get(bestPrice)?.values().next().value
}

export function updateOrderQty(book: Orderbook, orderId: string, newQty: bigint) {
    const entry = book.orderIndex.get(orderId)
    if (!entry) return
    
    const map = entry.side === "LONG" ? book.bids : book.asks
    
    const level = map.get(entry.price)
    if (!level) return
    
    const order = level.get(orderId)
    if (!order) return
    
    order.quantity = newQty
    book.seq++
}

export const orderbooks = new Map<string, Orderbook>()
orderbooks.set("BTCUSDT", createOrderbook())
orderbooks.set("ETHUSDT", createOrderbook())
orderbooks.set("SOLUSDT", createOrderbook())