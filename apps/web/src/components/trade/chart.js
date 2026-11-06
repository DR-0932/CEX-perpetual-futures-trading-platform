"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Chart;
const react_1 = require("react");
const lightweight_charts_1 = require("lightweight-charts");
function Chart() {
    const chartContainerRef = (0, react_1.useRef)(null);
    const chartRef = (0, react_1.useRef)(null);
    const seriesRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!chartContainerRef.current)
            return;
        let isDestroyed = false;
        const chart = (0, lightweight_charts_1.createChart)(chartContainerRef.current, {
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
        });
        const series = chart.addSeries(lightweight_charts_1.CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });
        chartRef.current = chart;
        seriesRef.current = series;
        fetch("https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&limit=100")
            .then(res => res.json())
            .then(data => {
            if (isDestroyed)
                return;
            const candles = data.map((d) => ({
                time: (d[0] / 1000),
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
            }));
            series.setData(candles);
        });
        const ws = new WebSocket("wss://fstream.binance.com/ws/btcusdt@kline_1m");
        ws.onmessage = (event) => {
            if (isDestroyed)
                return;
            const msg = JSON.parse(event.data);
            if (!msg.k)
                return;
            const k = msg.k;
            series.update({
                time: (k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            });
            console.log("kline update:", msg.k.t, msg.k.c);
        };
        const resizeObserver = new ResizeObserver(() => {
            if (chartContainerRef.current && !isDestroyed) {
                chart.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            }
        });
        resizeObserver.observe(chartContainerRef.current);
        ws.onopen = () => console.log("Binance WebSocket Connected");
        ws.onerror = (e) => console.error("WS error", e);
        ws.onclose = (e) => console.log("WS closed", e.code, e.reason);
        // 5. Cleanup
        return () => {
            isDestroyed = true;
            ws.close();
            chart.remove();
            resizeObserver.disconnect();
        };
    }, []);
    return <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }}/>;
}
