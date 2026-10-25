export type PaymentStatus = "paid" | "processing" | "failed";

export type PaymentRequest = {
    orderId: string;
    paymentToken: string;
    amount: number;
    currency: string;
    provider?: string;
};

export type PaymentResult = {
    success: boolean;
    status: PaymentStatus;
    transactionId: string;
    provider?: string;
    rawStatus?: string;
};