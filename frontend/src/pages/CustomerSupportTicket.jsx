import { useState, useEffect, useContext } from "react";
import CustomerNavbar from "../components/CustomerNavbar";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const CustomerSupportTicket = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [responses, setResponses] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = "http://localhost:5000";
  }, []);

  // ------------------- FETCH TICKETS -------------------
  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("/api/support/tickets");
      setTickets(res.data.tickets);

      const responseMap = {};
      for (const t of res.data.tickets) {
        const r = await axios.get(`/api/support/tickets/${t.ticket_id}/responses`);
        responseMap[t.ticket_id] = r.data.responses;
      }
      setResponses(responseMap);
    } catch (err) {
      console.log("Error fetching tickets", err);
    }
  };

  // ------------------- SOCKET LISTENER -------------------
  useEffect(() => {
    if (!socket) return;

    console.log("Socket ready for customer support");

    const handleTicketResponse = (data) => {
      console.log("📨 Ticket response received:", data);

      // Add the new response
      setResponses((prev) => ({
        ...prev,
        [data.ticket_id]: [...(prev[data.ticket_id] || []), data.response],
      }));

      // Update status ONLY when a response comes
      if (data.status) {
        setTickets((prev) =>
          prev.map((t) =>
            Number(t.ticket_id) === Number(data.ticket_id)
              ? { ...t, status: data.status }
              : t
          )
        );
      }
    };

    // listen only for ticket responses (NOT admin status changes)
    socket.on("ticket_response", handleTicketResponse);

    return () => {
      socket.off("ticket_response", handleTicketResponse);
    };
  }, [socket]);

  // ------------------- FORM HANDLERS -------------------
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("/api/support/tickets", formData);
      setSuccess("Ticket created successfully!");
      setFormData({ subject: "", message: "" });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s) =>
    s === "open"
      ? "bg-yellow-100 text-yellow-800"
      : s === "in_progress"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";

  return (
    <div className="min-h-screen bg-gray-100">
      <CustomerNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              {showForm ? "Cancel" : "+ New Ticket"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-lg font-bold">Create Ticket</h2>

              {error && <div className="text-red-500">{error}</div>}
              {success && <div className="text-green-600">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-4 mt-3">
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border"
                  placeholder="Subject"
                  required
                />

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-xl border"
                  placeholder="Describe your issue"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg"
                >
                  {loading ? "Creating..." : "Create Ticket"}
                </button>
              </form>
            </div>
          )}

          {/* TICKET LIST */}
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="p-4 bg-gray-50 rounded-lg border mb-3"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600">{ticket.message}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                {/* RESPONSES */}
                <div className="mt-3 text-sm text-gray-800">
                  <p className="font-semibold">Responses:</p>

                  {responses[ticket.ticket_id]?.length ? (
                    responses[ticket.ticket_id].map((r) => (
                      <div
                        key={r.response_id}
                        className="mt-2 bg-white border rounded-lg p-2"
                      >
                        <p>{r.message}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(r.responded_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No responses yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportTicket;
