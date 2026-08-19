"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Link from "next/link";
import {
  fetchSupportTicketDetail,
  sendTicketFollowUpEmail,
  resolveSupportTicket,
} from "@/app/api/supportApi";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SupportTicketDetailPage() {
  const { ticketId } = useParams();
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [body, setBody] = useState("");
  const [ended, setEnded] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [followUp, setFollowUp] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [resolving, setResolving] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportTicketDetail(ticketId);
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setEnded(data.ticket.status === "ENDED");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!ticket || ticket.channel !== "CHAT") return;
    const socket = io(BACKEND, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("chat:join", { ticketId }));
    socket.on("chat:message:new", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("chat:status", () => load());
    socket.on("chat:ended", () => setEnded(true));
    socket.on("chat:error", (e) => setChatError(e.message));

    return () => socket.disconnect();
  }, [ticket, ticketId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!body.trim()) return;
    socketRef.current?.emit("chat:message", { ticketId, body: body.trim() });
    setBody("");
  };

  const endChat = () => {
    socketRef.current?.emit("chat:end", { ticketId });
  };

  const sendFollowUp = async () => {
    if (!followUp.trim()) return;
    setSendingFollowUp(true);
    try {
      await sendTicketFollowUpEmail(ticketId, followUp.trim());
      setFollowUp("");
    } catch (e) {
      setChatError(e.message);
    } finally {
      setSendingFollowUp(false);
    }
  };

  const markResolved = async () => {
    setResolving(true);
    try {
      await resolveSupportTicket(ticketId);
      await load();
    } catch (e) {
      setChatError(e.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] text-sm text-[#6B7280]">Loading…</div>;
  }
  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <p className="text-sm text-[#B42318]">{error || "Ticket not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/support" className="text-xs font-semibold text-[#2F5D9F] hover:underline">
          &larr; Back to queue
        </Link>

        <div className="mt-3 mb-5">
          <h1 className="text-xl font-semibold text-[#1B1F27]">
            {ticket.participantCode || ticket.requesterType} — {ticket.subject || ticket.topic}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {ticket.requesterType} · {ticket.channel} · {ticket.status}
          </p>
          {ticket.orderContext?.orderId && (
            <p className="text-xs text-[#6B7280] mt-1">
              Order: {ticket.orderContext.orderId}
              {ticket.orderContext.itemName ? ` — ${ticket.orderContext.itemName}` : ""}
            </p>
          )}
        </div>

        {ticket.channel === "EMAIL" ? (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
            <p className="text-sm text-[#374151] mb-3">
              <strong>Contact email:</strong> {ticket.contactEmail}
            </p>
            <p className="text-sm text-[#374151] whitespace-pre-wrap mb-3">
              {ticket.description}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              This was sent directly to support@khalifrex.com — reply from your email client.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E4E7EC] bg-white flex flex-col" style={{ height: 520 }}>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.messageId || m._id}
                  className={
                    m.senderType === "SYSTEM"
                      ? "text-center text-xs text-[#9CA3AF]"
                      : m.senderType === "ADMIN"
                        ? "flex justify-end"
                        : "flex justify-start"
                  }
                >
                  {m.senderType === "SYSTEM" ? (
                    <span>{m.body}</span>
                  ) : (
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        m.senderType === "ADMIN" ? "bg-[#1B1F27] text-white" : "bg-[#F2F4F7] text-[#1B1F27]"
                      }`}
                    >
                      {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                      {m.attachments?.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs mt-1 underline opacity-80"
                        >
                          {a.filename || "Attachment"}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {chatError && <p className="px-4 text-xs text-[#B42318]">{chatError}</p>}
            <div className="border-t border-[#E4E7EC] p-3 flex items-center gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={ended}
                placeholder={ended ? "This chat has ended" : "Type a reply…"}
                className="flex-1 border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm disabled:bg-[#F5F6F8]"
              />
              <button
                onClick={send}
                disabled={ended}
                className="px-4 py-2 bg-[#1B1F27] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                Send
              </button>
              {!ended && (
                <button
                  onClick={endChat}
                  className="px-3 py-2 text-xs font-semibold text-[#B42318] hover:underline"
                >
                  End chat
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-[#E4E7EC] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1B1F27] mb-2">
            Send a follow-up email
          </h3>
          <p className="text-xs text-[#6B7280] mb-3">
            Emails {ticket.contactEmail} with reply-to set to support@khalifrex.com — use
            this for further clarification even after the chat has ended.
          </p>
          <textarea
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            rows={3}
            placeholder="Write an update or ask for clarification…"
            className="w-full border border-[#D0D5DD] rounded-lg p-2 text-sm resize-none mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={sendFollowUp}
              disabled={sendingFollowUp || !followUp.trim()}
              className="px-4 py-2 bg-[#1B1F27] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {sendingFollowUp ? "Sending…" : "Send email"}
            </button>
            {["EMAIL_SENT", "ENDED"].includes(ticket.status) && (
              <button
                onClick={markResolved}
                disabled={resolving}
                className="px-4 py-2 border border-[#D0D5DD] text-sm font-semibold text-[#374151] rounded-lg hover:border-[#2F5D9F] hover:text-[#2F5D9F] disabled:opacity-50"
              >
                {resolving ? "Marking resolved…" : "Mark resolved"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
