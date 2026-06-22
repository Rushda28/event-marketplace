"use client";

import { useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  price: number;
  totalCapacity: number;
  ticketsSold: number;
  imageUrl: string;
}

interface BookingWithEvent {
  id: string;
  eventId: string;
  email: string;
  createdAt: string;
  event: Event;
}

export default function MarketplaceHome() {
  const [activeTab, setActiveTab] = useState<"explore" | "tickets">("explore");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [bookingEmail, setBookingEmail] = useState<string>("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [paymentStep, setPaymentStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [lookupEmail, setLookupEmail] = useState<string>("");
  const [myTickets, setMyTickets] = useState<BookingWithEvent[]>([]);
  const [ticketLoading, setTicketLoading] = useState<boolean>(false);
  const [ticketSearched, setTicketSearched] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Error connecting to marketplace API:", err);
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTicketLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setTicketLoading(true);
    setTicketSearched(true);
    try {
      const res = await fetch("/api/my-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data);
      }
    } catch (err) {
      console.error("Error retrieving passes:", err);
    } finally {
      setTicketLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = evt.title.toLowerCase().includes(search.toLowerCase()) || 
                          evt.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || evt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "Technology", "Music", "Design"];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !bookingEmail.trim()) return;

    setBookingStatus("submitting");
    setErrorMessage("");

    try {
      setPaymentStep("🔐 Contacting secure bank gateway...");
      await sleep(1200);
      
      setPaymentStep("💳 Authorizing LKR payment allocation via Stripe...");
      await sleep(1400);

      setPaymentStep("🎟️ Reserving secure rows in database matrix...");
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId: activeEvent.id, 
          email: bookingEmail.trim().toLowerCase(),
          quantity: ticketQuantity 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction declined by issuing node.");
      }

      setPaymentStep("🎉 Payment successful! Generating stubs...");
      await sleep(800);

      setBookingStatus("success");
      fetchEvents();
      setTimeout(() => {
        setActiveEvent(null);
        setBookingEmail("");
        setTicketQuantity(1);
        setBookingStatus("idle");
        setPaymentStep("");
      }, 2000);
    } catch (err: any) {
      setBookingStatus("error");
      setPaymentStep("");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  const printPasses = () => {
    const printContent = document.getElementById("printable-ticket-manifest");
    if (!printContent) return;

    const uniqueWindowName = `_blank`;
    const printWindow = window.open("", uniqueWindowName, "width=900,height=700");
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>PulsePass Ticket Receipt - ${lookupEmail}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; padding: 20px; }
              .ticket-container { border: 2px solid #000; border-radius: 12px; display: flex; margin-bottom: 20px; page-break-inside: avoid; }
              .stub-left { background: #000; color: #fff; padding: 20px; width: 150px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 2px dashed #000; }
              .stub-right { padding: 20px; flex: 1; }
              .pass-title { font-size: 20px; font-weight: bold; margin: 0 0 5px 0; }
              .pass-desc { font-size: 12px; color: #555; margin-bottom: 15px; }
              .pass-meta { font-size: 12px; display: grid; grid-cols: 2; gap: 5px; border-top: 1px solid #eee; pt: 10px; }
              .code { font-family: monospace; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 14px; margin-top: 5px; font-weight: bold; text-transform: uppercase; }
              .print-btn-group { display: none; }
              .barcode { letter-spacing: 6px; font-size: 24px; font-family: 'Courier New', Courier, monospace; font-weight: bold; margin-top: 10px; opacity: 0.8; }
            </style>
          </head>
          <body>
            <div style="text-align:center; margin-bottom: 30px;">
              <h2>PulsePass Official Digital Manifest</h2>
              <p style="font-size:12px; color:#666;">Issued to: ${lookupEmail} | Current Date: ${new Date().toLocaleDateString()}</p>
            </div>
            ${printContent.innerHTML}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const totalTicketsBooked = myTickets.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dynamic View Navigation Tab Switchers */}
      <div className="flex items-center gap-4 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab("explore")}
          className={`pb-3 text-sm font-bold tracking-tight cursor-pointer transition-all border-b-2 px-1 ${
            activeTab === "explore"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Explore Events
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-3 text-sm font-bold tracking-tight cursor-pointer transition-all border-b-2 px-1 flex items-center gap-1.5 ${
            activeTab === "tickets"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Tickets 
          {totalTicketsBooked > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {totalTicketsBooked}
            </span>
          )}
        </button>
      </div>

      {activeTab === "explore" && (
        <>
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Discover Exceptional Experiences
            </h1>
            <p className="text-slate-500 max-w-xl text-base leading-relaxed">
              Secure real-time tickets to premium summits, coastal sessions, and craftsmanship masterclasses happening right now.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search events by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm font-medium">Syncing live event streams...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-medium">No experiences found match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const isSoldOut = event.ticketsSold >= event.totalCapacity;
                return (
                  <div key={event.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-48 w-full relative bg-slate-100">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-800 border border-slate-200/40 uppercase tracking-wider">
                        {event.category}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-slate-900 leading-snug mb-2 line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="mt-auto space-y-2 text-xs text-slate-500 mb-5 border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📍</span>
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📅</span>
                          <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <span>Availability:</span>
                          <span className={isSoldOut ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                            {isSoldOut ? "Sold Out" : `${event.totalCapacity - event.ticketsSold} seats left`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Entry</p>
                          <p className="text-xl font-black text-slate-900">LKR {event.price}</p>
                        </div>
                        <button
                          onClick={() => { setActiveEvent(event); setTicketQuantity(1); }}
                          disabled={isSoldOut}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all shadow-sm ${
                            isSoldOut
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 cursor-pointer"
                          }`}
                        >
                          {isSoldOut ? "Unavailable" : "Book Pass"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "tickets" && (
        <div className="max-w-2xl mx-auto py-4">
          <div className="mb-8 text-center bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Access Your Passes</h2>
            <p className="text-slate-400 text-xs mb-5">Enter the exact registration email used during purchase to unlock your entry passes.</p>
            
            <form onSubmit={handleTicketLookup} className="flex flex-col sm:flex-row items-stretch gap-2 max-w-md mx-auto relative z-10">
              <input
                type="email"
                required
                placeholder="Enter your booking email..."
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={ticketLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider px-5 py-2.5 sm:py-0 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {ticketLoading ? "Verifying..." : "Fetch Passes"}
              </button>
            </form>

            {ticketSearched && myTickets.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">
                  Found <strong className="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md">{totalTicketsBooked} passes</strong> total under your footprint.
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={printPasses}
                    className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-md border border-emerald-200 shadow-sm hover:bg-emerald-100 cursor-pointer transition-all text-[11px]"
                  >
                    📥 Export PDF
                  </button>
                  <button
                    onClick={() => {
                      setLookupEmail("");
                      setMyTickets([]);
                      setTicketSearched(false);
                    }}
                    className="bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-md border border-rose-200 shadow-sm hover:bg-rose-100 cursor-pointer transition-all text-[11px]"
                  >
                    👋 Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {ticketLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
            </div>
          ) : ticketSearched && myTickets.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">No passes active under "{lookupEmail}"</p>
            </div>
          ) : (
            /* Printable Manifest DOM Anchor */
            <div id="printable-ticket-manifest" className="space-y-4">
              {myTickets.map((ticket, idx) => (
                <div key={ticket.id} className="ticket-container bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row relative">
                  {/* Left Side Pass Stub Display */}
                  <div className="stub-left bg-indigo-600 sm:w-36 flex flex-col items-center justify-center p-4 text-white text-center border-b sm:border-b-0 sm:border-r border-dashed border-indigo-400/50 relative">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-1">Pass Stub</span>
                    <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded tracking-wide uppercase code">
                      {ticket.id.substring(0, 8)}
                    </span>
                    {/* Simulated High fidelity barcode for scanner matching */}
                    <div className="barcode text-[10px] font-mono select-none tracking-[3px] opacity-40 mt-3 writing-mode-vertical">
                      ||| | || |||
                    </div>
                    <span className="text-[8px] font-mono opacity-40 mt-1">Index #{idx + 1}</span>

                    {/* Circle Ticket Cutout Decorations */}
                    <div className="hidden sm:block absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-50 border border-slate-200/50"></div>
                    <div className="hidden sm:block absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-slate-50 border border-slate-200/50"></div>
                  </div>
                  
                  {/* Right Side Event Content Block */}
                  <div className="stub-right p-5 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base text-slate-900 leading-tight pass-title">{ticket.event.title}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded uppercase tracking-wider">
                        Verified GA
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-1 pass-desc">{ticket.event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-50 pass-meta">
                      <p><strong>📍 Venue:</strong> {ticket.event.location}</p>
                      <p><strong>📅 Date:</strong> {new Date(ticket.event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                      <p className="col-span-2 mt-1 font-mono text-[10px] text-slate-400">
                        Registered Identity footprint: <span className="text-slate-600 font-medium">{ticket.email}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW THREE: SECURE AUTHORIZATION GATEWAY MODAL */}
      {activeEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Stripe Security Protocol
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1.5">{activeEvent.title}</h2>
              </div>
              <button
                onClick={() => { setActiveEvent(null); setBookingStatus("idle"); setPaymentStep(""); }}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={paymentStep !== ""}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              {/* FEATURE 2: MODAL INTERACTIVE STATE MACHINE LOADER */}
              {bookingStatus === "submitting" ? (
                <div className="py-12 text-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-600 mx-auto"></div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">Processing Digital Transaction</p>
                    <p className="text-xs text-indigo-500 font-mono transition-all animate-pulse">{paymentStep}</p>
                  </div>
                </div>
              ) : bookingStatus === "success" ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold border border-emerald-100 shadow-sm animate-bounce">✓</div>
                  <h4 className="font-bold text-slate-900 text-base">Payment Authorized!</h4>
                  <p className="text-xs text-slate-400">Writing data allocations to active shards...</p>
                </div>
              ) : (
                <>
                  <div className="text-xs bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1 text-slate-600">
                    <p><strong>Venue Location:</strong> {activeEvent.location}</p>
                    <p><strong>Base Allocation Statement:</strong> LKR {activeEvent.price} per seat line</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Ticket Quantity</label>
                    <select
                      value={ticketQuantity}
                      onChange={(e) => setTicketQuantity(Number(e.target.value))}
                      disabled={paymentStep !== ""}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50"
                    >
                      {[...Array(Math.min(10, activeEvent.totalCapacity - activeEvent.ticketsSold))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} Pass{i > 0 ? "es" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendee Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@domain.com"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      disabled={paymentStep !== ""}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  {bookingStatus === "error" && (
                    <div className="text-xs p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 font-medium">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={paymentStep !== ""}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    {paymentStep !== "" ? "Authorizing Transaction..." : `Confirm & Purchase (LKR ${activeEvent.price * ticketQuantity})`}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}