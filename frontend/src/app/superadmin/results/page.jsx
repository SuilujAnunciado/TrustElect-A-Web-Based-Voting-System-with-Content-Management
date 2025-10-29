"use client";

import { useState } from "react";

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

    return (
        <div className="mx-auto max-w-6xl p-6 space-y-6">
            <div className="rounded-lg border p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold text-black">Results Verification (UI Only)</h1>
                    <div className="text-xs text-black">This tool is client-side only (no decryption performed)</div>
                </div>
                <p className="text-sm text-black mb-4">Paste your encrypted records in the editors below. You can toggle between Single and Bulk modes and preview your input. Buttons are non-functional by design for UI-only verification.</p>

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
                                disabled
                                title="UI-only demo"
                                className="w-full px-4 py-2 rounded-lg border text-black bg-gray-100 cursor-not-allowed"
                            >
                                Decrypt (disabled)
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    disabled
                                    title="UI-only demo"
                                    className="px-4 py-2 rounded-lg border text-black bg-gray-100 cursor-not-allowed"
                                >
                                    Download JSON
                                </button>
                                <button
                                    disabled
                                    title="UI-only demo"
                                    className="px-4 py-2 rounded-lg border text-black bg-gray-100 cursor-not-allowed"
                                >
                                    Download Aggregates
                                </button>
                            </div>
                            <div className="rounded-md border p-3 text-xs text-black bg-white">
                                Tip: Use this page to visually verify payload formats. Actual decryption should be performed in a secured environment.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


