"use client";

import { useMemo, useState } from "react";
import { decryptAesGcmHex } from "@/utils/cryptoBrowser";

function classNames(...arr) {
	return arr.filter(Boolean).join(" ");
}

export default function ResultsVerifyPage() {
	const [inputMode, setInputMode] = useState("single"); // single | bulk
	const [singlePayload, setSinglePayload] = useState(`{
  "encrypted": "",
  "iv": "",
  "authTag": "",
  "key": ""
}`);
	const [bulkPayload, setBulkPayload] = useState(`[
  { "encrypted": "", "iv": "", "authTag": "", "key": "" }
]`);
	const [decrypting, setDecrypting] = useState(false);
	const [error, setError] = useState("");
	const [results, setResults] = useState([]);

	const aggregate = useMemo(() => {
		const counts = new Map();
		for (const item of results) {
			if (!item || typeof item !== "object") continue;
			const candidateId = item.candidateId ?? item.candidate_id;
			const positionId = item.positionId ?? item.position_id;
			if (candidateId == null || positionId == null) continue;
			const key = `${positionId}:${candidateId}`;
			counts.set(key, (counts.get(key) || 0) + 1);
		}
		return Array.from(counts.entries()).map(([k, v]) => {
			const [positionId, candidateId] = k.split(":");
			return { positionId, candidateId, count: v };
		}).sort((a, b) => Number(a.positionId) - Number(b.positionId) || Number(a.candidateId) - Number(b.candidateId));
	}, [results]);

	async function handleDecrypt() {
		setError("");
		setDecrypting(true);
		try {
			if (inputMode === "single") {
				const parsed = JSON.parse(singlePayload);
				const plain = await decryptAesGcmHex(parsed);
				setResults([plain]);
			} else {
				const arr = JSON.parse(bulkPayload);
				if (!Array.isArray(arr)) throw new Error("Bulk payload must be an array");
				const out = [];
				for (const item of arr) {
					try {
						const plain = await decryptAesGcmHex(item);
						out.push(plain);
					} catch (e) {
						out.push({ error: e.message });
					}
				}
				setResults(out);
			}
		} catch (e) {
			setError(e.message || String(e));
			setResults([]);
		} finally {
			setDecrypting(false);
		}
	}

	function downloadJSON(name, data) {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="mx-auto max-w-6xl p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Results Verification</h1>
			<p className="text-sm text-gray-600">Decrypt encrypted votes/ballots locally for manual counting. Paste records with fields: <code>encrypted</code>, <code>iv</code>, <code>authTag</code>, <code>key</code> (hex).</p>

			<div className="flex items-center gap-3">
				<button
					className={classNames(
						"px-3 py-1.5 rounded border",
						inputMode === "single" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300"
					)}
					onClick={() => setInputMode("single")}
				>
					Single
				</button>
				<button
					className={classNames(
						"px-3 py-1.5 rounded border",
						inputMode === "bulk" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300"
					)}
					onClick={() => setInputMode("bulk")}
				>
					Bulk
				</button>
			</div>

			{inputMode === "single" ? (
				<div className="space-y-2">
					<label className="text-sm font-medium">Single encrypted record (JSON)</label>
					<textarea
						className="w-full h-44 p-3 border rounded font-mono text-sm"
						value={singlePayload}
						onChange={(e) => setSinglePayload(e.target.value)}
					/>
				</div>
			) : (
				<div className="space-y-2">
					<label className="text-sm font-medium">Bulk encrypted records (JSON array)</label>
					<textarea
						className="w-full h-44 p-3 border rounded font-mono text-sm"
						value={bulkPayload}
						onChange={(e) => setBulkPayload(e.target.value)}
					/>
				</div>
			)}

			<div className="flex items-center gap-3">
				<button
					onClick={handleDecrypt}
					disabled={decrypting}
					className={classNames(
						"px-4 py-2 rounded text-white",
						decrypting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
					)}
				>
					{decrypting ? "Decrypting..." : "Decrypt"}
				</button>
				{results.length > 0 && (
					<>
						<button
							onClick={() => downloadJSON("decrypted-results.json", results)}
							className="px-4 py-2 rounded border border-gray-300"
						>
							Download JSON
						</button>
						<button
							onClick={() => downloadJSON("aggregated-counts.json", aggregate)}
							className="px-4 py-2 rounded border border-gray-300"
						>
							Download Aggregates
						</button>
					</>
				)}
			</div>

			{error && (
				<div className="text-red-600 text-sm">{error}</div>
			)}

			{results.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h2 className="font-medium mb-2">Decrypted Data</h2>
						<pre className="whitespace-pre-wrap break-words bg-gray-50 p-3 rounded border text-sm overflow-auto max-h-[32rem]">{JSON.stringify(results, null, 2)}</pre>
					</div>
					<div>
						<h2 className="font-medium mb-2">Aggregated Counts</h2>
						{aggregate.length === 0 ? (
							<p className="text-sm text-gray-600">No position/candidate fields found to aggregate.</p>
						) : (
							<table className="w-full text-sm border">
								<thead className="bg-gray-100">
									<tr>
										<th className="text-left p-2 border">Position ID</th>
										<th className="text-left p-2 border">Candidate ID</th>
										<th className="text-left p-2 border">Count</th>
									</tr>
								</thead>
								<tbody>
									{aggregate.map((row, idx) => (
										<tr key={idx} className="odd:bg-white even:bg-gray-50">
											<td className="p-2 border">{row.positionId}</td>
											<td className="p-2 border">{row.candidateId}</td>
											<td className="p-2 border">{row.count}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			)}
		</div>
	);
}


