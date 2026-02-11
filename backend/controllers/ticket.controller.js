
import { Ticket } from "../models/ticket.models.js";
import { User } from "../models/user.models.js";
import { getIO } from "../services/socket.service.js";

// Create a new ticket
// Create a new ticket
export const createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;

        if (!subject || !description) {
            return res.status(400).json({ success: false, message: "Subject and description are required" });
        }

        let attachments = [];
        if (req.file) {
            // Store the relative path or full URL. Usually relative path for static serving.
            // Using logic similar to other parts of app: /uploads/documents/filename
            attachments.push(`/uploads/documents/${req.file.filename}`);
        }

        const ticket = await Ticket.create({
            customer: req.user._id,
            subject,
            description,
            category,
            priority,
            messages: [{
                sender: req.user._id,
                message: description,
                attachments: attachments
            }]
        });

        res.status(201).json({ success: true, message: "Ticket created successfully", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all tickets (Admin sees all, Customer sees own)
export const getTickets = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === "customer") {
            query.customer = req.user._id;
        } else if (req.user.role === "agent") {
            // Agents see tickets from their assigned customers
            // First find all customers assigned to this agent
            const customers = await User.find({ assignedAgentId: req.user._id }).select('_id');
            const customerIds = customers.map(c => c._id);
            query.customer = { $in: customerIds };
        }
        // Admins see all by default (empty query)

        // Filters
        if (req.query.status && req.query.status !== "All") query.status = req.query.status;
        if (req.query.priority && req.query.priority !== "All") query.priority = req.query.priority;
        if (req.query.category && req.query.category !== "All") query.category = req.query.category;

        const tickets = await Ticket.find(query)
            .populate("customer", "name email")
            .populate("assignedTo", "name email")
            .sort({ updatedAt: -1 }); // Sort by recently updated first

        // Calculate unread messages count for each ticket
        const ticketsWithUnreadCount = tickets.map(ticket => {
            const ticketObj = ticket.toObject();
            
            // Find last viewed timestamp for this user
            const viewRecord = ticket.lastViewedBy?.find(v => v.user.toString() === req.user._id.toString());
            const lastViewed = viewRecord ? new Date(viewRecord.timestamp) : new Date(0); // If never viewed, everything is new

            // Count messages that are newer than lastViewed AND not sent by the user themselves
            const unreadCount = ticket.messages.filter(msg => {
                const msgTime = new Date(msg.timestamp);
                const isNew = msgTime > lastViewed;
                const isNotMe = msg.sender.toString() !== req.user._id.toString();
                return isNew && isNotMe;
            }).length;

            ticketObj.unreadCount = unreadCount;
            return ticketObj;
        });

        res.status(200).json({ success: true, count: ticketsWithUnreadCount.length, data: ticketsWithUnreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single ticket details
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("customer", "name email")
            .populate("assignedTo", "name email")
            .populate("messages.sender", "name role");

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Access control
        if (req.user.role === "customer" && ticket.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Update Last Viewed Timestamp
        const viewIndex = ticket.lastViewedBy.findIndex(v => v.user.toString() === req.user._id.toString());
        if (viewIndex > -1) {
            ticket.lastViewedBy[viewIndex].timestamp = new Date();
        } else {
            ticket.lastViewedBy.push({ user: req.user._id, timestamp: new Date() });
        }
        await ticket.save();

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add a reply
export const addReply = async (req, res) => {
    try {
        const { message, attachments } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Access control
        if (req.user.role === "customer" && ticket.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const newMessage = {
            sender: req.user._id,
            message,
            attachments: attachments || [],
            timestamp: new Date()
        };

        ticket.messages.push(newMessage);
        
        // Auto-update status if admin replies
        if (req.user.role === "admin" || req.user.role === "agent") {
            if (ticket.status === "Open") ticket.status = "In Progress";
        }
        
        // Auto-update status if customer replies to a resolved ticket (re-open)
        if (req.user.role === "customer" && ticket.status === "Resolved") {
            ticket.status = "In Progress";
        }

        // Automatically mark read for the sender
        const viewIndex = ticket.lastViewedBy.findIndex(v => v.user.toString() === req.user._id.toString());
        if (viewIndex > -1) {
            ticket.lastViewedBy[viewIndex].timestamp = new Date();
        } else {
            ticket.lastViewedBy.push({ user: req.user._id, timestamp: new Date() });
        }

        await ticket.save();

        // Populate the sender for the new message to return immediately
        const populatedTicket = await Ticket.findById(ticket._id).populate("messages.sender", "name role");
        const addedMessage = populatedTicket.messages[populatedTicket.messages.length - 1];

        // Emit Socket Event
        try {
            const io = getIO();
            // 1. Emit to the ticket room for real-time chat in TicketDetails
            io.to(`ticket_${ticket._id}`).emit('new_message', addedMessage);

            // 2. Emit to relevant users for unread count updates in Support list
            const recipients = [];
            
            // If sender is NOT customer, notify customer
            if (req.user._id.toString() !== ticket.customer.toString()) {
                recipients.push(ticket.customer.toString());
            }

            // If sender is NOT assigned agent (and agent is assigned), notify agent
            if (ticket.assignedTo && req.user._id.toString() !== ticket.assignedTo.toString()) {
                recipients.push(ticket.assignedTo.toString());
            }
            
            // Also if sender is customer, we might want to notify admins if no agent assigned? 
            // For now let's just stick to the specific targets.
            
            recipients.forEach(userId => {
                io.to(`user_${userId}`).emit('ticket_updated', {
                    ticketId: ticket.ticketId,
                    _id: ticket._id,
                    lastMessage: addedMessage,
                    unreadIncrement: 1
                });
            });

        } catch (socketError) {
            console.error("Socket emit failed:", socketError);
        }

        res.status(200).json({ success: true, message: "Reply added", data: addedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update status (Admin/Agent only)
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        ticket.status = status;
        
        // If assignedTo is empty and an admin/agent touches it, assign to them? Optional.
        // if (!ticket.assignedTo) ticket.assignedTo = req.user._id;

        await ticket.save();

        res.status(200).json({ success: true, message: "Status updated", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
