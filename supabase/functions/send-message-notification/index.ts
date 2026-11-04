// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface ReqPayload {
  thread_id: string;
}

console.info("send-message-notification started");

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      const { thread_id }: ReqPayload = await req.json();

      if (!thread_id) {
        return Response.json(
          { error: "thread_id is required" },
          { status: 400 }
        );
      }

      const { data: thread, error: threadError } = await ctx.supabase
        .from("message_centre_threads")
        .select(`
          id,
          customer_id,
          customer_name,
          customer_email
        `)
        .eq("id", thread_id)
        .single();

      if (threadError || !thread) {
        console.error("Thread lookup failed:", threadError);

        return Response.json(
          { error: "Message thread could not be found" },
          { status: 404 }
        );
      }

      const customerEmail = String(thread.customer_email || "").trim();

      if (!customerEmail) {
        return Response.json(
          { error: "Customer email is missing" },
          { status: 400 }
        );
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (!resendApiKey) {
        console.error("RESEND_API_KEY is missing");

        return Response.json(
          { error: "Email service is not configured" },
          { status: 500 }
        );
      }

      const customerName =
        String(thread.customer_name || "").trim() || "there";

      // Guest enquiries do not have a My AnyBike inbox. Include the latest
      // actual staff reply in their email; never expose the whole conversation.
      const isGuest = !thread.customer_id;
      let guestReply = "";
      if (isGuest) {
        const { data: latestReply, error: replyError } = await ctx.supabase
          .from("message_centre_messages")
          .select("message,sender_type")
          .eq("thread_id", thread.id)
          .in("sender_type", ["AnyBike", "Admin"])
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (replyError || !String(latestReply?.message || "").trim()) {
          console.error("Guest email has no saved AnyBike reply", replyError);
          return Response.json(
            { error: "No saved AnyBike reply is available to email" },
            { status: 409 }
          );
        }
        guestReply = String(latestReply.message).trim();
      }

      const messageUrl = thread.customer_id
  ? `https://www.anybike.co.uk/customer-messages.html?thread=${encodeURIComponent(thread.id)}`
  : `https://www.anybike.co.uk/customer-register.html?return=${encodeURIComponent(`/customer-messages.html?thread=${thread.id}`)}`;
  
      const instructionsHtml = isGuest
        ? `                        <div style="background:#f7f7f7;border:1px solid #e7e7e7;border-left:4px solid #ed1c24;padding:18px 20px;border-radius:8px;font-size:16px;line-height:1.65;overflow-wrap:anywhere;white-space:normal;">
                          ${escapeHtml(guestReply).replace(/\\r?\\n/g, "<br>")}
                        </div>

                        <p style="margin:22px 0 0;font-size:15px;line-height:1.6;">
                          You can reply directly to this email to contact AnyBike Sales.
                          You do not need to create an account to read our response.
                        </p>`
        : `                        <p style="margin:0 0 26px;font-size:16px;line-height:1.6;">
                          Sign in to <strong>My AnyBike</strong> to view your conversation and reply securely.
                        </p>

                        <p style="margin:0 0 30px;">
                          <a
                            href="${messageUrl}"
                            style="display:inline-block;background:#cc1118;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:7px;"
                          >
                            View Your Message
                          </a>
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                               style="background:#f7f7f7;border-radius:8px;">
                          <tr>
                            <td style="padding:16px 18px;font-size:13px;line-height:1.6;color:#555555;">
                              Your conversation and message history are kept securely inside My AnyBike.
                              For your security, please continue the conversation through your AnyBike account rather than replying to this email.
                            </td>
                          </tr>
                        </table>
`;

      const emailHtml = `
        <!doctype html>
        <html>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111111;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f4;">
              <tr>
                <td align="center" style="padding:30px 15px;">

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                         style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

                    <tr>
                      <td align="center" style="padding:26px 28px 18px;">
                        <img
                          src="https://www.anybike.co.uk/assets/Anybike-email-logo-white.png"
                          alt="AnyBike"
                          width="340"
                          style="display:block;width:100%;max-width:340px;height:auto;border:0;"
                        >
                      </td>
                    </tr>

                    <tr>
                      <td style="height:4px;background:#cc1118;font-size:0;line-height:0;">
                        &nbsp;
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:32px 34px 34px;">

                        <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#cc1118;text-transform:uppercase;margin-bottom:10px;">
                          New Message
                        </div>

                        <h1 style="margin:0 0 22px;font-size:26px;line-height:1.25;color:#111111;">
                          You have a new message from AnyBike
                        </h1>

                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
                          Hi ${escapeHtml(customerName)},
                        </p>

                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
                          ${isGuest ? "Here is the reply from the AnyBike team:" : "The AnyBike team has sent you a new message."}
                        </p>

                        ${instructionsHtml}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:22px 34px;background:#111111;color:#ffffff;">

                        <div style="font-size:15px;font-weight:700;margin-bottom:5px;">
                          AnyBike.co.uk
                        </div>

                        <div style="font-size:12px;line-height:1.6;color:#dddddd;">
                          UK Motorcycle Export Specialists
                        </div>

                        <div style="font-size:12px;line-height:1.6;color:#999999;margin-top:12px;">
                          ${isGuest
                            ? "This message was sent by AnyBike. Reply to this email to contact our Sales team."
                            : "This is an automated notification email. Please do not reply. Sign in to My AnyBike to continue the conversation."}
                        </div>

                      </td>
                    </tr>

                  </table>

                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AnyBike <no-reply@anybike.co.uk>",
          to: [customerEmail],
          subject: isGuest ? "Your AnyBike enquiry — reply from our team" : "You have a new message from AnyBike",
          ...(isGuest ? { reply_to: "sales@anybike.co.uk" } : {}),
          html: emailHtml,
        }),
      });

      const resendResult = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("Resend error:", resendResult);

        return Response.json(
          {
            error: "Notification email could not be sent",
            details: resendResult,
          },
          { status: 502 }
        );
      }

      console.info(
        `Notification sent for thread ${thread.id} to ${customerEmail}`
      );

      return Response.json({
        ok: true,
        thread_id: thread.id,
        email_id: resendResult.id ?? null,
      });
    } catch (error) {
      console.error("Unhandled notification error:", error);

      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unexpected server error",
        },
        { status: 500 }
      );
    }
  }),
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
