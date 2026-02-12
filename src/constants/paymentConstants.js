const CREDIT_TO_PAISA_MAPPING = {
    10: 100, // 10 credits = 1.00 INR
    50: 400, // 50 credits = 4.00 INR
    100: 700 // 100 credits = 7.00 INR
};

const PAISA_TO_CREDIT_MAPPING = {
    100: 10,
    400: 50,
    700: 100
};

const SUBSCRIPTION_PLANS = {
    MONTHLY: "plan_SF6wBXeRHbwsvD", 
    YEARLY: "plan_SF6vpd1AcWHO87" 
};

module.exports = {
    CREDIT_TO_PAISA_MAPPING,
    PAISA_TO_CREDIT_MAPPING,
    SUBSCRIPTION_PLANS
};
