"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Mail, MessageSquare, Inbox } from "lucide-react";
import {
  getAllReviews,
  getAllSubscribers,
  getAllContactMessages,
  AdminReview,
  AdminSubscriber,
  AdminContactMessage,
} from "@/lib/feedback";

type Tab = "reviews" | "subscribers" | "messages";

export default function FeedbackPage() {
  const params = useParams();
  const locationId = params.location as string;

  const [tab, setTab] = useState<Tab>("reviews");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [r, s, m] = await Promise.all([
        getAllReviews(),
        getAllSubscribers(),
        getAllContactMessages(),
      ]);
      setReviews(r);
      setSubscribers(s);
      setMessages(m);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-5 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/cazerts/${locationId}/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="text-[var(--color-magenta)] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          CAZERTS
        </p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-8">Customer Feedback</h1>

        <div className="inline-flex flex-wrap bg-white rounded-full p-1 shadow-card gap-1 mb-8">
          <button
            onClick={() => setTab("reviews")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${
              tab === "reviews" ? "bg-[var(--color-magenta)] text-white" : "text-black/50"
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setTab("subscribers")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${
              tab === "subscribers" ? "bg-[var(--color-magenta)] text-white" : "text-black/50"
            }`}
          >
            Newsletter ({subscribers.length})
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${
              tab === "messages" ? "bg-[var(--color-magenta)] text-white" : "text-black/50"
            }`}
          >
            Messages ({messages.length})
          </button>
        </div>

        {loading ? (
          <p className="text-black/40 text-sm">Loading...</p>
        ) : tab === "reviews" ? (
          reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center shadow-card">
              <MessageSquare size={32} className="text-black/20 mx-auto mb-3" />
              <p className="text-black/50">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-3xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-black">{review.name}</span>
                    <span className="text-black/30 text-xs">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={star <= review.rating ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "fill-black/10 text-black/10"}
                      />
                    ))}
                  </div>
                  <p className="text-black/70 text-sm leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          )
        ) : tab === "subscribers" ? (
          subscribers.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center shadow-card">
              <Mail size={32} className="text-black/20 mx-auto mb-3" />
              <p className="text-black/50">No subscribers yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-black/40 text-xs uppercase tracking-wide">
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold text-right">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-black/5 last:border-0">
                      <td className="px-6 py-4">{sub.email}</td>
                      <td className="px-6 py-4 text-right text-black/40 text-xs">
                        {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center shadow-card">
            <Inbox size={32} className="text-black/20 mx-auto mb-3" />
            <p className="text-black/50">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-3xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-black">{msg.name}</span>
                  <span className="text-black/30 text-xs">
                    {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-black/40 text-xs mb-3">{msg.email}</p>
                <p className="text-black/70 text-sm leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}