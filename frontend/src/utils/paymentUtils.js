export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const handlePayment = async ({
    policyId, 
    token, 
    API_BASE_URL, 
    onSuccess, 
    onError
}) => {
    try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        // 1. Create Order
        const orderUrl = `${API_BASE_URL}/payments/create-order`;
        const orderRes = await fetch(orderUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ policyId })
        });

        const orderData = await orderRes.json();
        
        if (!orderRes.ok) {
            throw new Error(orderData.message || "Failed to create payment order");
        }

        const { order, keyId, amount, currency, prefill } = orderData.data;

        const options = {
            key: keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Insurance CRM",
            description: "Premium Payment",
            order_id: order.id,
            handler: async function (response) {
                try {
                    // 2. Verify Payment
                    const verifyUrl = `${API_BASE_URL}/payments/verify`;
                    const verifyRes = await fetch(verifyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            policyId: policyId
                        })
                    });

                    const verifyData = await verifyRes.json();
                    
                    if (verifyRes.ok && verifyData.success) {
                        if (onSuccess) onSuccess(verifyData);
                    } else {
                        if (onError) onError(new Error(verifyData.message || "Verification failed"));
                    }
                } catch (err) {
                    if (onError) onError(err);
                }
            },
            prefill: {
                name: prefill.name,
                email: prefill.email,
                contact: prefill.contact
            },
            theme: {
                color: "#2563eb"
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

    } catch (error) {
        if (onError) onError(error);
    }
};
