import { User } from "../models/user.models.js";
import { sendPaymentReminderEmail } from "../services/emailService.js";

/**
 * Check for upcoming payments and send reminders.
 * This function should be called by a cron job daily.
 */
export const checkPaymentReminders = async () => {
    try {
        console.log("⏰ Running Payment Reminder Check...");

        // Calculate Target Date: Today + 7 days
        // We need to match the date part, ignoring time.
        // Or finding partial matches.
        
        const today = new Date();
        const targetDateStart = new Date(today);
        targetDateStart.setDate(today.getDate() + 7);
        targetDateStart.setHours(0, 0, 0, 0);

        const targetDateEnd = new Date(targetDateStart);
        targetDateEnd.setHours(23, 59, 59, 999);

        // Find users who have ANY active policy with nextPaymentDate in the range
        // This is efficient than filtering later
        const users = await User.find({
            "purchasedPolicies": {
                $elemMatch: {
                    status: "active",
                    nextPaymentDate: {
                        $gte: targetDateStart,
                        $lte: targetDateEnd
                    }
                }
            }
        }).populate("purchasedPolicies.policy");

        let emailCount = 0;

        for (const user of users) {
            // Find specific policies for this user that due in 7 days
            const duePolicies = user.purchasedPolicies.filter(p => {
                if (p.status !== "active" || !p.nextPaymentDate) return false;
                const d = new Date(p.nextPaymentDate);
                return d >= targetDateStart && d <= targetDateEnd;
            });

            for (const p of duePolicies) {
                if (p.policy) {
                     // Check if an email was already sent? (Optional, maybe store lastReminderDate in policy)
                     // For now, assuming cron runs once a day, so it will only match 7-day exact once.
                     
                     // Send Email
                     await sendPaymentReminderEmail({
                         email: user.email,
                         name: user.name,
                         policyName: p.policy.policyName,
                         amount: p.policy.premiumAmount,
                         dueDate: p.nextPaymentDate,
                         policyId: p.policy._id
                     });
                     emailCount++;
                }
            }
        }

        console.log(`✅ Payment Reminder Check Completed. Sent ${emailCount} reminders.`);

    } catch (error) {
        console.error("❌ Error in Payment Reminder Job:", error);
    }
};
