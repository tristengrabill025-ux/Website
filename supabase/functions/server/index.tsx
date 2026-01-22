import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0dda4881/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all bookings
app.get("/make-server-0dda4881/bookings", async (c) => {
  try {
    const bookings = await kv.getByPrefix("booking:");
    return c.json({ bookings: bookings || [] });
  } catch (error) {
    console.log("Error fetching bookings:", error);
    return c.json({ error: "Failed to fetch bookings", bookings: [] }, 500);
  }
});

// Get bookings for a specific date
app.get("/make-server-0dda4881/bookings/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const bookings = await kv.getByPrefix(`booking:${date}:`);
    return c.json({ bookings });
  } catch (error) {
    console.log("Error fetching bookings for date:", error);
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
});

// Helper function to send Discord webhook notification
const sendDiscordNotification = async (booking: any) => {
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
  
  if (!webhookUrl) {
    console.log("Discord webhook URL not configured");
    return;
  }

  try {
    const servicePrice = booking.serviceType === "optimization" ? "$30" : "$20";
    const rushPrice = booking.isRush ? " + $20 (Rush)" : "";
    const totalPrice = booking.serviceType === "optimization" 
      ? (booking.isRush ? "$50" : "$30")
      : (booking.isRush ? "$40" : "$20");

    const embed = {
      title: "🎉 New Booking Received!",
      color: 0x00D9FF, // Cyan color
      fields: [
        {
          name: "💼 Service",
          value: booking.serviceType === "optimization" ? "PC Optimization" : "PC Repair",
          inline: true
        },
        {
          name: "💰 Price",
          value: `${servicePrice}${rushPrice}\n**Total: ${totalPrice}**`,
          inline: true
        },
        {
          name: "⚡ Rush Service",
          value: booking.isRush ? "Yes" : "No",
          inline: true
        },
        {
          name: "👤 Customer Discord",
          value: booking.customerDiscord || "Not provided",
          inline: true
        },
        {
          name: "📧 Customer Email",
          value: booking.customerEmail || "Not provided",
          inline: true
        },
        {
          name: "📅 Date",
          value: booking.date,
          inline: true
        },
        {
          name: "🕐 Time",
          value: booking.time,
          inline: true
        },
        {
          name: "📝 Booking ID",
          value: `\`${booking.id}\``,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "TechFix Pro Booking System"
      }
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "TechFix Pro",
        embeds: [embed]
      }),
    });

    if (!response.ok) {
      console.log("Failed to send Discord notification:", await response.text());
    } else {
      console.log("Discord notification sent successfully");
    }
  } catch (error) {
    console.log("Error sending Discord notification:", error);
  }
};

// Create a new booking
app.post("/make-server-0dda4881/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const { serviceType, date, time, isRush, customerDiscord, customerEmail } = body;

    if (!serviceType || !date || !time) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Create a unique booking ID
    const bookingId = `booking:${date}:${time}:${Date.now()}`;
    
    // Check if the time slot is already booked
    const existingBookings = await kv.getByPrefix(`booking:${date}:${time}`);
    if (existingBookings && existingBookings.length > 0) {
      return c.json({ error: "This time slot is already booked" }, 409);
    }

    const booking = {
      id: bookingId,
      serviceType,
      date,
      time,
      isRush,
      customerDiscord,
      customerEmail,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };

    await kv.set(bookingId, booking);

    // Send Discord notification
    await sendDiscordNotification(booking);

    return c.json({ success: true, booking });
  } catch (error) {
    console.log("Error creating booking:", error);
    return c.json({ error: "Failed to create booking" }, 500);
  }
});

// Delete a booking
app.delete("/make-server-0dda4881/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting booking:", error);
    return c.json({ error: "Failed to delete booking" }, 500);
  }
});

// ===== AUTHENTICATION ROUTES =====

// Helper function to create Supabase client
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
};

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
};

// Sign up new admin user
app.post("/make-server-0dda4881/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create user WITHOUT admin role (regular user)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: "user" },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Error creating user:", error);
      return c.json({ error: error.message }, 400);
    }

    // Sign in the user to get access token
    const supabaseClient = getSupabaseClient();
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log("Error signing in after signup:", signInError);
      return c.json({ error: signInError.message }, 400);
    }

    return c.json({
      user: data.user,
      access_token: signInData.session?.access_token,
    });
  } catch (error) {
    console.log("Error in signup:", error);
    return c.json({ error: "Failed to sign up" }, 500);
  }
});

// Sign in existing admin user
app.post("/make-server-0dda4881/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Error signing in user:", error);
      return c.json({ error: error.message }, 401);
    }

    // Allow both admin and regular users to sign in
    return c.json({
      user: data.user,
      access_token: data.session?.access_token,
    });
  } catch (error) {
    console.log("Error in signin:", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Get current session
app.get("/make-server-0dda4881/auth/session", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return c.json({ user: null }, 200);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return c.json({ user: null }, 200);
    }

    // Return user regardless of role
    return c.json({
      user: data.user,
      access_token: token,
    });
  } catch (error) {
    console.log("Error getting session:", error);
    return c.json({ user: null }, 200);
  }
});

// Sign out
app.post("/make-server-0dda4881/auth/signout", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.signOut(token);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log("Error signing out:", error);
    return c.json({ success: true }); // Return success even on error
  }
});

// Middleware to verify admin authentication
const requireAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  // Check if user has admin role
  if (data.user.user_metadata?.role !== "admin") {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  // Store user in context for use in route handlers
  c.set("user", data.user);
  await next();
};

// Protect admin routes
app.get("/make-server-0dda4881/admin/bookings", requireAdmin, async (c) => {
  try {
    const bookings = await kv.getByPrefix("booking:");
    return c.json({ bookings: bookings || [] });
  } catch (error) {
    console.log("Error fetching bookings:", error);
    return c.json({ error: "Failed to fetch bookings", bookings: [] }, 500);
  }
});

app.delete("/make-server-0dda4881/admin/bookings/:id", requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting booking:", error);
    return c.json({ error: "Failed to delete booking" }, 500);
  }
});

// Create new admin user (admin-only endpoint)
app.post("/make-server-0dda4881/admin/users", requireAdmin, async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create user with admin metadata
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: "admin" },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Error creating admin user:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log("Error in admin user creation:", error);
    return c.json({ error: "Failed to create admin user" }, 500);
  }
});

Deno.serve(app.fetch);