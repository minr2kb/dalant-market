"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { Order, PointLog } from "@/types";

interface PointLogItemProps {
  log: PointLog;
  order?: Order;
  pointLabel?: string;
}

export function PointLogItem({
  log,
  order,
  pointLabel = "달란트",
}: PointLogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = log.amount > 0;
  const isPurchase = log.reasonType === "purchase";

  const label =
    log.reasonType === "mission"
      ? (log.missionTitle ?? "미션")
      : isPurchase
        ? (log.itemName ?? "마켓 구매")
        : log.reasonType === "transfer"
          ? (log.memo ?? `${pointLabel} 전송`)
          : (log.memo ?? "수동 지급");

  const sub =
    log.reasonType === "mission" && log.verifiedByName
      ? `${log.verifiedByName} 인증`
      : isPurchase
        ? "마켓 구매"
        : log.reasonType === "transfer"
          ? log.amount > 0
            ? `${pointLabel} 받음`
            : `${pointLabel} 전송`
          : "관리자 지급";

  const iconBg = isPositive
    ? log.reasonType === "manual"
      ? "bg-purple-50 dark:bg-purple-900/30"
      : log.reasonType === "transfer"
        ? "bg-blue-50 dark:bg-blue-900/30"
        : "bg-emerald-50 dark:bg-emerald-900/30"
    : log.reasonType === "transfer"
      ? "bg-blue-50 dark:bg-blue-900/30"
      : "bg-rose-50 dark:bg-rose-900/30";

  const amountColor = isPositive
    ? log.reasonType === "manual"
      ? "text-purple-500"
      : log.reasonType === "transfer"
        ? "text-blue-500"
        : "text-emerald-500"
    : log.reasonType === "transfer"
      ? "text-blue-500"
      : "text-rose-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={() => isPurchase && order && setExpanded((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-4 text-left ${
          isPurchase && order ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
          >
            {log.reasonType === "transfer" ? (
              isPositive ? (
                <ArrowDownLeft className="h-4 w-4 text-blue-500" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              )
            ) : isPositive ? (
              log.reasonType === "manual" ? (
                <Award className="h-4 w-4 text-purple-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              )
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">
              {new Date(log.createdAt).toLocaleString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tabular-nums ${amountColor}`}>
            {isPositive ? "+" : ""}
            {log.amount}
          </span>
          {isPurchase &&
            order &&
            (expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-300" />
            ))}
        </div>
      </button>

      {expanded && order && (
        <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-2">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <ShoppingBag className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span>
                  {item.name} × {item.qty}
                </span>
              </div>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                {item.price * item.qty}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{order.verifiedByName} 처리</span>
            <span className="font-medium tabular-nums text-rose-400">
              -{order.total} 합계
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
