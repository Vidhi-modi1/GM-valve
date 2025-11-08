import React, { useState } from "react";
import { uploadOrderFile } from "../services/order-services";
import { Button } from "./ui/button";

export default function UploadOrderFile({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return setMsg("Please choose a file (.xlsx/.xls/.csv).");
    setMsg(null);
    setLoading(true);
    try {
      await uploadOrderFile(file);
      setMsg("Upload successful.");
      onUploaded?.();
    } catch (e: any) {
      setMsg(e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Order File"}
      </Button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
