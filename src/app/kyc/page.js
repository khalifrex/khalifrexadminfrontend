"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function KycAdminPage() {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, userId: null });
  const [approveModal, setApproveModal] = useState({ open: false, userId: null });
  const [reasonOrMessage, setReasonOrMessage] = useState("");
  const [formattedDates, setFormattedDates] = useState({});

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3092/admin/kyc", {
        credentials: "include",
      });
      const data = await res.json();
      setKycRequests(data.kycRequests || []);

    const formats = {};
    (data.kycRequests || []).forEach((req) => {
      formats[req.user._id] = req.user.submittedAt
        ? new Date(req.user.submittedAt).toLocaleDateString()
        : "N/A";
    });
    setFormattedDates(formats);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load KYC requests.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchKYC();
  }, []);

  const approveKYC = async () => {
    try {
      const res = await fetch(
        `http://localhost:3092/admin/kyc/${approveModal.userId}/approve`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: reasonOrMessage }),
        }
      );
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("KYC approved successfully.");
      setApproveModal({ open: false, userId: null });
      setReasonOrMessage("");
      fetchKYC();
    } catch (err) {
      console.error(err);
      toast.error("Error approving KYC.");
    }
  };

  const rejectKYC = async () => {
    if (!reasonOrMessage.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3092/admin/kyc/${rejectModal.userId}/reject`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reasonOrMessage }),
        }
      );
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("KYC rejected.");
      setRejectModal({ open: false, userId: null });
      setReasonOrMessage("");
      fetchKYC();
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting KYC.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-6">Pending KYC Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : kycRequests.length === 0 ? (
        <p className="text-gray-500">No pending KYC requests.</p>
      ) : (
        <div className="space-y-4">
          {kycRequests.map(({ user }) => (
            <div
              key={user._id}
              className="bg-white p-4 rounded shadow flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-600">
  Submitted on: {formattedDates[user._id] || "N/A"}
</p>

              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setApproveModal({ open: true, userId: user._id })
                  }
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    setRejectModal({ open: true, userId: user._id })
                  }
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {approveModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-medium mb-4">Approve KYC</h2>
            <textarea
              value={reasonOrMessage}
              onChange={(e) => setReasonOrMessage(e.target.value)}
              placeholder="Optional message to the user..."
              className="w-full border p-2 rounded mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setApproveModal({ open: false, userId: null })
                }
                className="px-3 py-1 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={approveKYC}
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-medium mb-4">Reject KYC</h2>
            <textarea
              value={reasonOrMessage}
              onChange={(e) => setReasonOrMessage(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border p-2 rounded mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setRejectModal({ open: false, userId: null })
                }
                className="px-3 py-1 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={rejectKYC}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
