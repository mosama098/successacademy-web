import "server-only";

// The final columns in Bookings are private storage metadata. The Apps Script
// hides them, while OrderService uses them for immutable snapshots and retries.
export const paymentSheetColumns = {
  Bookings: [
    "Booking_ID", "Created_At", "Full_Name", "Phone", "WhatsApp", "Email", "Age",
    "Package", "Start_Level", "Target_Level", "Hours", "Sessions", "Attendance_Type",
    "Original_Price", "Promo_Code", "Discount_Amount", "Final_Price", "Payment_Method",
    "Payment_Status", "Payment_Verification", "Payment_Proof_URL", "Admin_Notes", "Customer_Notes",
    "Order_Snapshot", "Idempotency_Key_Hash", "Request_Fingerprint",
    "Payment_Provider", "Provider_Transaction_ID", "Payment_Redirect_URL", "Payment_Updated_At",
  ],
  "Promo Codes": [
    "Code", "Discount_Type", "Discount_Value", "Active", "Start_Date", "End_Date", "Usage_Limit", "Description",
  ],
  "Promo Usage": [
    "Usage_ID", "Created_At", "Promo_Code", "Booking_ID", "Customer_Name", "Customer_Phone", "Discount_Amount",
    "Status", "Reserved_Until", "Finalized_At", "Released_At", "Release_Reason",
  ],
} as const;
