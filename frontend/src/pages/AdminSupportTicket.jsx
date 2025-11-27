import { useState, useEffect, useContext } from "react";
import AdminNavbar from "../components/AdminNavbar";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const AdminSupportTicket = () => {
  const { user } = useContext(AuthContext); // admin user
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  // Set base URL and credentials
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = "http://localhost:5000";
  }, []);

  // Fetch all tickets once on load
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("/api/support/admin/tickets");
      setTickets(res.data.tickets);
    } catch (err) {
      console.log("Error loading tickets", err);
    }
  };

  // Socket listeners: new ticket + admin preview of status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (data) => {
      setTickets((prev) => [data.ticket, ...prev]);
    };

    const handleStatusPreview = (data) => {
      // Update all admins UI
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === data.ticket_id ? { ...t, status: data.status } : t
        )
      );

      // Update selectedTicket if it matches
      if (selectedTicket && selectedTicket.ticket_id === data.ticket_id) {
        setSelectedTicket((prev) => ({ ...prev, status: data.status }));
      }
    };

    socket.on("new_ticket", handleNewTicket);
    socket.on("admin_status_preview", handleStatusPreview);

    return () => {
      socket.off("new_ticket", handleNewTicket);
      socket.off("admin_status_preview", handleStatusPreview);
    };
  }, [socket, selectedTicket]);

  // Load responses for a selected ticket
  const loadResponses = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await axios.get(`/api/support/tickets/${ticket.ticket_id}/responses`);
      setResponses(res.data.responses);
    } catch (err) {
      console.log("Error loading responses", err);
      setResponses([]);
    }
  };

  // Admin updates status in dropdown (preview only, no DB)
  const updateStatus = (status) => {
    if (!selectedTicket) return;

    // Update UI locally
    setSelectedTicket((prev) => ({ ...prev, status }));
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === selectedTicket.ticket_id ? { ...t, status } : t
      )
    );

    // Emit preview event to other admins
    if (socket) {
      socket.emit("admin_status_preview", {
        ticket_id: selectedTicket.ticket_id,
        status,
      });
    }
  };

  // Send response (this will update DB and notify customer)
  const sendResponse = async () => {
    if (!responseMessage.trim()) return;

    try {
      const res = await axios.post(
        `/api/support/tickets/${selectedTicket.ticket_id}/responses`,
        {
          admin_id: user.user_id,
          message: responseMessage,
          status: selectedTicket.status, // persist current status
        }
      );

      const savedResponse = res.data.response;

      // Update UI
      setResponses((prev) => [...prev, savedResponse]);
      setResponseMessage("");

      // After sending response, DB is updated and customer will see status
    } catch (err) {
      console.log("Error sending response", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border">
          <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Ticket ID</th>
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.ticket_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadResponses(t)}
                  >
                    <td className="px-6 py-4">#{t.ticket_id}</td>
                    <td className="px-6 py-4">#{t.user_id}</td>
                    <td className="px-6 py-4">{t.subject}</td>
                    <td className="px-6 py-4">{t.status.replace("_", " ")}</td>
                    <td className="px-6 py-4">{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Details / Response Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border">
          <h2 className="text-xl font-bold mb-4">Ticket Details</h2>

          {!selectedTicket ? (
            <div className="text-gray-500">Select a ticket</div>
          ) : (
            <div className="space-y-4">
              <p>
                <strong>Subject:</strong> {selectedTicket.subject}
              </p>
              <p>
                <strong>Description:</strong> {selectedTicket.message}
              </p>

              {/* Dropdown for status preview */}
              <select
                value={selectedTicket.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full border px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>

              {/* Responses */}
              <div>
                <p className="font-semibold mb-2">Responses:</p>
                {responses.length ? (
                  responses.map((r) => (
                    <div key={r.response_id} className="border p-2 rounded mb-2">
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

              {/* Admin response input */}
              <textarea
                rows="4"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Type response..."
              />

              <button
                onClick={sendResponse}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg"
              >
                Send Response
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTicket;
