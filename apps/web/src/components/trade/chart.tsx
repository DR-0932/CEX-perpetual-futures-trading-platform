"use client"

import { useEffect, useRef } from "react"
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, UTCTimestamp } from "lightweight-charts"

export default function Chart() {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        let isDestroyed = false

        // 1. Initialize Chart
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 400,
            layout: {
                background: { color: "#0f0f0f" },
                textColor: "#d1d5db",
            },
            grid: {
                vertLines: { color: "#1f2937" },
                horzLines: { color: "#1f2937" },
            },
        })

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        })

        chartRef.current = chart
        seriesRef.current = series

        // 2. Fetch Historical 1-Minute Candles
        fetch("https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&limit=100")
        .then(res => res.json())
        .then(data => {
            if (isDestroyed) return
            const candles = data.map((d: any) => ({
                time: (d[0] / 1000) as UTCTimestamp,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
            }))
            series.setData(candles)
        })

        // 3. Connect to 1-Minute WebSocket Stream (Updates live every second)
        const ws = new WebSocket("wss://fstream.binance.com/ws/btcusdt@kline_1m")

        ws.onmessage = (event) => {
            if (isDestroyed) return
            const msg = JSON.parse(event.data)
            if (!msg.k) return 
            
            const k = msg.k
            // Updates or appends the 1-minute candle seamlessly
            series.update({
                time: (k.t / 1000) as UTCTimestamp,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            })
            console.log("kline update:", msg.k.t, msg.k.c)
        }

        // 4. Responsive Resize Handling
        const resizeObserver = new ResizeObserver(() => {
            if (chartContainerRef.current && !isDestroyed) {
                chart.resize(
                    chartContainerRef.current.clientWidth,
                    chartContainerRef.current.clientHeight
                )
            }
        })
        resizeObserver.observe(chartContainerRef.current)
        
        ws.onopen = () => console.log("Binance WebSocket Connected")
        ws.onerror = (e) => console.error("WS error", e)
        ws.onclose = (e) => console.log("WS closed", e.code, e.reason)
        
        // 5. Cleanup
        return () => {
            isDestroyed = true
            ws.close()
            chart.remove()
            resizeObserver.disconnect()
        }
        
    }, [])

    return <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }} />
}