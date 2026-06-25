"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MOCK_MISSIONS } from "@/lib/mock-data";
import type { Mission, MissionType } from "@/types";

const TYPE_LABEL: Record<MissionType, string> = {
	upload: "사진+QR",
	qr: "QR 즉시",
	admin_grant: "관리자 지급",
};

const EMPTY_FORM = {
	title: "",
	reward: "",
	limitCount: "",
	type: "qr" as MissionType,
};

export default function AdminMissionsPage() {
	const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);

	function toggleActive(id: string) {
		setMissions(prev =>
			prev.map(m => (m.id === id ? { ...m, isActive: !m.isActive } : m)),
		);
	}

	function startEdit(mission: Mission) {
		setEditingId(mission.id);
		setForm({
			title: mission.title,
			reward: String(mission.reward),
			limitCount: String(mission.limitCount),
			type: mission.type,
		});
		setShowForm(true);
		setExpandedId(null);
	}

	function deleteMission(id: string) {
		setMissions(prev => prev.filter(m => m.id !== id));
		if (expandedId === id) setExpandedId(null);
	}

	function submitForm() {
		if (!form.title.trim()) return;
		if (editingId) {
			setMissions(prev =>
				prev.map(m =>
					m.id === editingId
						? {
								...m,
								title: form.title,
								reward: Number(form.reward),
								limitCount: Number(form.limitCount),
								type: form.type,
							}
						: m,
				),
			);
		} else {
			const newMission: Mission = {
				id: `m_${Date.now()}`,
				marketId: "market1",
				title: form.title,
				type: form.type,
				isGroup: false,
				reward: Number(form.reward) || 0,
				limitCount: Number(form.limitCount) || 1,
				activeFrom: null,
				activeUntil: null,
				isActive: true,
			};
			setMissions(prev => [newMission, ...prev]);
		}
		setForm(EMPTY_FORM);
		setEditingId(null);
		setShowForm(false);
	}

	return (
		<div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold text-gray-900">미션 관리</h1>
				<Button
					onClick={() => {
						setEditingId(null);
						setForm(EMPTY_FORM);
						setShowForm(!showForm);
					}}
					className="h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
				>
					<Plus className="mr-1 h-4 w-4" />
					미션 추가
				</Button>
			</div>

			{showForm && (
				<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
					<h3 className="text-sm font-semibold text-emerald-700">
						{editingId ? "미션 수정" : "새 미션"}
					</h3>
					<Input
						placeholder="미션 이름"
						value={form.title}
						onChange={e =>
							setForm(f => ({ ...f, title: e.target.value }))
						}
						className="rounded-xl bg-white"
					/>
					<div className="grid grid-cols-2 gap-2">
						<Input
							placeholder="달란트 수량"
							type="number"
							value={form.reward}
							onChange={e =>
								setForm(f => ({ ...f, reward: e.target.value }))
							}
							className="rounded-xl bg-white"
						/>
						<Input
							placeholder="최대 횟수"
							type="number"
							value={form.limitCount}
							onChange={e =>
								setForm(f => ({
									...f,
									limitCount: e.target.value,
								}))
							}
							className="rounded-xl bg-white"
						/>
					</div>
					<div className="flex gap-2">
						{(["qr", "upload", "admin_grant"] as MissionType[]).map(
							t => (
								<button
									key={t}
									type="button"
									onClick={() =>
										setForm(f => ({ ...f, type: t }))
									}
									className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
										form.type === t
											? "bg-emerald-500 text-white"
											: "bg-white text-gray-500 border border-gray-200"
									}`}
								>
									{TYPE_LABEL[t]}
								</button>
							),
						)}
					</div>
					<div className="flex gap-2">
						<Button
							onClick={submitForm}
							className="h-10 flex-1 rounded-full bg-emerald-500 text-sm text-white hover:bg-emerald-600"
						>
							{editingId ? "저장" : "추가"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setShowForm(false);
								setEditingId(null);
								setForm(EMPTY_FORM);
							}}
							className="h-10 rounded-full text-sm"
						>
							취소
						</Button>
					</div>
				</div>
			)}

			<div className="space-y-3">
				{missions.map(mission => (
					<div
						key={mission.id}
						className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
					>
						<div className="flex items-center gap-3 px-4 py-4">
							<button
								type="button"
								onClick={() =>
									setExpandedId(
										expandedId === mission.id
											? null
											: mission.id,
									)
								}
								className="flex min-w-0 flex-1 items-center gap-2 text-left"
							>
								<div className="min-w-0 flex-1">
									<p
										className={`truncate text-sm font-semibold ${mission.isActive ? "text-gray-900" : "text-gray-400"}`}
									>
										{mission.title}
									</p>
									<p className="text-xs text-gray-400">
										{TYPE_LABEL[mission.type]} · +
										{mission.reward} · {mission.limitCount}
										회
									</p>
								</div>
								{expandedId === mission.id ? (
									<ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
								) : (
									<ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
								)}
							</button>

							<Switch
								checked={mission.isActive}
								onCheckedChange={() => toggleActive(mission.id)}
								className="data-[state=checked]:bg-emerald-500 shrink-0"
							/>
						</div>

						{expandedId === mission.id && (
							<div className="border-t border-gray-50 bg-gray-50 px-4 py-3 space-y-3">
								<div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
									<div>
										<p className="text-gray-400">타입</p>
										<p className="font-medium">
											{TYPE_LABEL[mission.type]}
										</p>
									</div>
									<div>
										<p className="text-gray-400">달란트</p>
										<p className="font-medium">
											+{mission.reward}
										</p>
									</div>
									<div>
										<p className="text-gray-400">
											최대 횟수
										</p>
										<p className="font-medium">
											{mission.limitCount}회
										</p>
									</div>
									<div>
										<p className="text-gray-400">
											단체 미션
										</p>
										<p className="font-medium">
											{mission.isGroup ? "예" : "아니오"}
										</p>
									</div>
								</div>
								<div className="flex gap-2 pt-1">
									<button
										type="button"
										onClick={() => startEdit(mission)}
										className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
									>
										<Pencil className="h-3 w-3" /> 수정
									</button>
									<button
										type="button"
										onClick={() =>
											deleteMission(mission.id)
										}
										className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-100"
									>
										<Trash2 className="h-3 w-3" /> 삭제
									</button>
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
