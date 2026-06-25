"use client";

import { useState } from "react";
import { MissionCard } from "@/components/MissionCard";
import { getMissionStatus, type Mission } from "@/types";

type VisibleStatus = "active" | "past";

const LABEL: Record<VisibleStatus, string> = { active: "진행중", past: "지남" };
const EMPTY: Record<VisibleStatus, string> = {
	active: "진행중인 미션이 없어요",
	past: "지난 미션이 없어요",
};

export function MissionList({
	missions,
	marketId,
}: {
	missions: Mission[];
	marketId: string;
}) {
	const [status, setStatus] = useState<VisibleStatus>("active");

	const counts: Record<VisibleStatus, number> = {
		active: missions.filter(m => getMissionStatus(m) === "active").length,
		past: missions.filter(m => getMissionStatus(m) === "past").length,
	};
	const filtered = missions.filter(m => getMissionStatus(m) === status);

	return (
		<div className="space-y-5">
			<div className="flex gap-2">
				{(["active", "past"] as VisibleStatus[]).map(s => (
					<button
						key={s}
						type="button"
						onClick={() => setStatus(s)}
						className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
							status === s
								? "bg-emerald-500 text-white"
								: "bg-gray-100 text-gray-500 hover:bg-gray-200"
						}`}
					>
						{LABEL[s]}
						<span
							className={`text-[11px] tabular-nums ${status === s ? "opacity-80" : "text-gray-400"}`}
						>
							{counts[s]}
						</span>
					</button>
				))}
			</div>

			<div className="flex flex-col gap-2">
				{filtered.length === 0 ? (
					<div className="py-12 text-center text-sm text-gray-400">
						{EMPTY[status]}
					</div>
				) : (
					filtered.map(mission => (
						<MissionCard
							key={mission.id}
							mission={mission}
							marketId={marketId}
						/>
					))
				)}
			</div>
		</div>
	);
}
