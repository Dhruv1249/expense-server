const Razorpay = require('razorpay');
const crypto = require('crypto');
const { CREDIT_TO_PAISA_MAPPING, SUBSCRIPTION_PLANS } = require('../constants/paymentConstants');
const User = require('../model/users');

const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentsController = {
    createOrder: async (request, response) => {
        try {
            const { credits } = request.body;

            if (!CREDIT_TO_PAISA_MAPPING[credits]) {
                return response.status(400).json({ message: 'Invalid credit value' });
            }

            const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

            const order = await razorpayClient.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            return response.json({ order });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    verifyOrder: async (request, response) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = request.body;

            console.log("Verifying payment:", { razorpay_order_id, razorpay_payment_id, credits });

            const body = razorpay_order_id + "|" + razorpay_payment_id;

            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                console.error("Invalid signature:", { expected: expectedSignature, received: razorpay_signature });
                return response.status(400).json({ message: 'Invalid transaction signature' });
            }

            // Update User Credits
            const user = await User.findById(request.user._id);
            if (!user) {
                return response.status(404).json({ message: "User not found" });
            }

            // Simple idempotency check can be added here if we store transaction IDs in the future
            // For now, we trust the signature verification

            const previousCredits = user.credits || 0;
            user.credits = previousCredits + Number(credits);
            await user.save();

            console.log(`Credits updated for user ${user.email}: ${previousCredits} -> ${user.credits}`);

            return response.json({ message: "Payment successful", user });
        } catch (error) {
            console.error("Error in verifyOrder:", error);
            return response.status(500).json({ message: 'Internal server error during payment verification' });
        }
    },
  createSubscription: async (request, response) => {
        try {
            const { planType } = request.body; // 'MONTHLY' or 'YEARLY'
            const planId = SUBSCRIPTION_PLANS[planType];

            if (!planId) {
                return response.status(400).json({ message: "Invalid plan selected" });
            }

            const isYearly = planType === 'YEARLY';
            const totalCount = isYearly ? 2 : 26;

            const subscription = await razorpayClient.subscriptions.create({
                plan_id: planId,
                total_count: totalCount, 
                quantity: 1,
                customer_notify: 1,
            });

            return response.json({ subscription });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Error creating subscription' });
        }
    },

    verifySubscription: async (request, response) => {
        try {
            const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = request.body;

            const body = razorpay_payment_id + "|" + razorpay_subscription_id;

            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return response.status(400).json({ message: 'Invalid subscription signature' });
            }

            // Update User Subscription Status
            const user = await User.findById(request.user._id);
            
            // Fetch subscription details to get dates if needed
            const subDetails = await razorpayClient.subscriptions.fetch(razorpay_subscription_id);
            console.log("Razorpay Subscription Details:", JSON.stringify(subDetails, null, 2));

            let startDate = subDetails.current_start ? new Date(subDetails.current_start * 1000) : new Date();
            let endDate = subDetails.current_end ? new Date(subDetails.current_end * 1000) : null;

            if (!endDate) {
                const isMonthly = subDetails.plan_id === SUBSCRIPTION_PLANS.MONTHLY;
                endDate = new Date();
                if (isMonthly) {
                    endDate.setDate(endDate.getDate() + 30);
                } else {
                    endDate.setDate(endDate.getDate() + 365);
                }
            }

            user.subscription = {
                id: razorpay_subscription_id,
                status: 'active',
                planId: subDetails.plan_id,
                startDate: startDate,
                endDate: endDate
            };
            
            await user.save();

            return response.json({ message: "Subscription active", user });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    // This endpoint is called by Razorpay, NOT your client
    cancelSubscription: async (request, response) => {
        try {
            const user = await User.findById(request.user._id);

            if (!user.subscription || !user.subscription.id) {
                 return response.status(400).json({ message: "No active subscription found" });
            }

            const subscriptionId = user.subscription.id;

            // Cancel at the end of the current billing cycle
            // Pass false as the second argument to cancel immediately
            const result = await razorpayClient.subscriptions.cancel(subscriptionId, false);

            user.subscription.status = 'cancelled';
            await user.save();

            return response.json({ message: "Subscription cancelled successfully", subscription: result });

        } catch (error) {
            console.error("Error cancelling subscription:", error);
            return response.status(500).json({ message: 'Error cancelling subscription' });
        }
    },

    // This endpoint is called by Razorpay, NOT your client
    webhook: async (request, response) => {
        try {
            const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
            const signature = request.headers["x-razorpay-signature"];
            
            console.log("Webhook Received:", JSON.stringify(request.body, null, 2));

            // 1. Verify Signature
            const shasum = crypto.createHmac("sha256", secret);
            shasum.update(JSON.stringify(request.body));
            const digest = shasum.digest("hex");

            if (digest !== signature) {
                console.error("Invalid Webhook Signature");
                return response.status(400).json({ message: "Invalid signature" });
            }

            const event = request.body.event;
            const payload = request.body.payload;

            console.log(`Processing Webhook Event: ${event}`);

            // 2. Handle Events
            if (event === "subscription.charged") {
                const subscriptionId = payload.subscription.entity.id;
                const newEndDate = payload.subscription.entity.current_end;

                const user = await User.findOne({ "subscription.id": subscriptionId });
                if (user) {
                    console.log(`Renewing subscription for user: ${user.email}`);
                    user.subscription.status = 'active';
                    user.subscription.endDate = new Date(newEndDate * 1000);
                    await user.save();
                } else {
                    console.warn(`No user found for subscription ID: ${subscriptionId}`);
                }
            } else if (event === "subscription.cancelled" || event === "subscription.halted") {
                 const subscriptionId = payload.subscription.entity.id;
                 const user = await User.findOne({ "subscription.id": subscriptionId });
                 if (user) {
                     console.log(`Cancelling subscription for user: ${user.email}`);
                     user.subscription.status = 'cancelled';
                     await user.save();
                 }
            }

            return response.json({ status: "ok" });
        } catch (error) {
            console.log("Webhook Error:", error);
            return response.status(200).json({ message: "Webhook processed" });
        }
    }
};

module.exports = paymentsController;
