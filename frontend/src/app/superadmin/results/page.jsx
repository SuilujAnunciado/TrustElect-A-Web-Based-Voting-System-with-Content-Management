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
            <div className="rounded-lg border p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold text-black">Results Verification</h1>
                    <div className="text-xs text-black">Client-side decrypt and export</div>
                </div>
                <p className="text-sm text-black mb-4">Paste encrypted records. Toggle Single/Bulk, decrypt locally, preview results, and download outputs. All operations run in your browser.</p>

                <div className="flex items-center gap-3 mb-4">
                    <button
                        className={classNames(
                            "px-3 py-1.5 rounded border text-black",
                            inputMode === "single" ? "bg-[#FFDF00] border-[#FFDF00]" : "bg-white border-gray-300"
                        )}
                        onClick={() => setInputMode("single")}
                    >
                        Single
                    </button>
                    <button
                        className={classNames(
                            "px-3 py-1.5 rounded border text-black",
                            inputMode === "bulk" ? "bg-[#FFDF00] border-[#FFDF00]" : "bg-white border-gray-300"
                        )}
                        onClick={() => setInputMode("bulk")}
                    >
                        Bulk
                    </button>
                </div>

                {inputMode === "single" ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Single encrypted record (JSON)</label>
                        <textarea
                            className="w-full h-56 p-4 border rounded-lg font-mono text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={singlePayload}
                            onChange={(e) => setSinglePayload(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Bulk encrypted records (JSON array)</label>
                        <textarea
                            className="w-full h-56 p-4 border rounded-lg font-mono text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={bulkPayload}
                            onChange={(e) => setBulkPayload(e.target.value)}
                        />
                    </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-black">Preview</h2>
                            <span className="text-xs text-black">Characters: {(inputMode === 'single' ? singlePayload : bulkPayload).length}</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-words bg-white p-3 rounded border text-sm text-black overflow-auto max-h-[28rem]">{inputMode === 'single' ? singlePayload : bulkPayload}</pre>
                    </div>
                    <div className="rounded-lg border p-4 bg-white">
                        <h2 className="font-semibold mb-3 text-black">Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={handleDecrypt}
                                className="w-full px-4 py-2 rounded-lg border text-black bg-[#FFDF00] hover:bg-[#f0cf00]"
                                disabled={decrypting}
                            >
                                {decrypting ? "Decrypting..." : "Decrypt"}
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => downloadJSON("decrypted-results.json", results)}
                                    className="px-4 py-2 rounded-lg border text-black bg-white hover:bg-gray-50"
                                >
                                    Download JSON
                                </button>
                                <button
                                    onClick={() => downloadJSON("aggregated-counts.json", aggregate)}
                                    className="px-4 py-2 rounded-lg border text-black bg-white hover:bg-gray-50"
                                >
                                    Download Aggregates
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded border p-3 text-sm text-black bg-white">{error}</div>
                )}

                {results.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-lg border p-4 bg-white">
                            <h2 className="font-semibold text-black mb-2">Decrypted Data</h2>
                            <pre className="whitespace-pre-wrap break-words bg-white p-3 rounded border text-sm text-black overflow-auto max-h-[32rem]">{JSON.stringify(results, null, 2)}</pre>
                        </div>
                        <div className="rounded-lg border p-4 bg-white">
                            <h2 className="font-semibold text-black mb-2">Aggregated Counts</h2>
                            {aggregate.length === 0 ? (
                                <p className="text-sm text-black">No position/candidate fields found to aggregate.</p>
                            ) : (
                                <table className="w-full text-sm border text-black">
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
        </div>
    );
}


