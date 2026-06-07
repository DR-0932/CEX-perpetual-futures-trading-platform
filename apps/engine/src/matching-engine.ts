// 1. get the orderbook for the market
// 2. if LONG → match against bestAsk, loop while price matches
// 3. if SHORT → match against bestBid, loop while price matches
// 4. after matching, if remaining qty → add to orderbook

//work of matching engine , number 1 swaps calculations, so for that it needs to check orderbook */


import { Order, Orderbook } from "./orderbook.js";

/** 1 function to swap, will need to check if the order is limit or market,if */
async function swap(bestBid:Order,bestAsk:Order) {

}