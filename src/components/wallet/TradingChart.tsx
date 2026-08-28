import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
} from "lightweight-charts";
import type { ChartPoint } from "@/services/marketApi";

type Candle = {
  time: any;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type RsiPoint = { time: any; value: number };

function calculateRsi(values: number[], period = 14): Array<number | null> {
  const result: Array<number | null> = new Array(values.length).fill(null);
  if (values.length <= period) return result;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }

  let averageGain = gain / period;
  let averageLoss = loss / period;
  result[period] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[i] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  }

  return result;
}

export function TradingChart({ points }: { points: ChartPoint[] }) {
  const priceContainer = useRef<HTMLDivElement>(null);
  const rsiContainer = useRef<HTMLDivElement>(null);

  const candles = useMemo<Candle[]>(() => {
    return points
      .map((point, index) => {
        const previous = points[index - 1]?.price ?? point.price;
        const high = Math.max(previous, point.price) * 1.0015;
        const low = Math.min(previous, point.price) * 0.9985;
        return {
          time: Math.floor(point.t / 1000),
          open: previous,
          high,
          low,
          close: point.price,
          volume: Math.max(Math.abs(point.price - previous), point.price * 0.0001),
        };
      })
      .filter((candle) => candle.close > 0);
  }, [points]);

  const rsiData = useMemo<RsiPoint[]>(() => {
    const values = calculateRsi(candles.map((candle) => candle.close));
    return values.flatMap((value, index) =>
      value == null ? [] : [{ time: candles[index].time, value }],
    );
  }, [candles]);

  useEffect(() => {
    const container = priceContainer.current;
    if (!container || candles.length < 2) return;

    container.innerHTML = "";
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 330,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8f96a3",
      },
      grid: {
        vertLines: { color: "rgba(128,128,128,0.08)" },
        horzLines: { color: "rgba(128,128,128,0.08)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
    });

    const priceSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });
    priceSeries.setData(candles);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: "rgba(120,120,120,0.25)",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(
      candles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(22,163,74,0.35)"
            : "rgba(239,68,68,0.35)",
      })),
    );

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles]);

  useEffect(() => {
    const container = rsiContainer.current;
    if (!container || rsiData.length === 0) return;

    container.innerHTML = "";
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 125,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8f96a3",
      },
      grid: {
        vertLines: { color: "rgba(128,128,128,0.06)" },
        horzLines: { color: "rgba(128,128,128,0.06)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, visible: false },
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: "#8b5cf6",
      lineWidth: 2,
      priceScaleId: "rsi",
    });
    rsiSeries.setData(rsiData);
    rsiSeries.createPriceLine({ price: 70, color: "rgba(239,68,68,0.5)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "70" });
    rsiSeries.createPriceLine({ price: 30, color: "rgba(22,163,74,0.5)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "30" });
    rsiSeries.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.05 } });
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [rsiData]);

  if (candles.length < 2) {
    return (
      <div className="grid h-[330px] place-items-center text-sm text-muted-foreground">
        Chart data is temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-secondary/40 to-transparent shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <div ref={priceContainer} className="h-[330px] w-full" />
      </div>
      <div className="rounded-2xl border border-border/70 bg-secondary/10 px-2 pt-1">
        <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
          <span>RSI (14)</span>
          <span>70 · 30</span>
        </div>
        <div ref={rsiContainer} className="h-[125px] w-full" />
      </div>
    </div>
  );
}
