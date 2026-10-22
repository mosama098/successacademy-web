import type { Locale } from "@/lib/i18n";
import type { PublicOrder } from "./types";

export function bookingDisplayReference(orderId: string) {
  return `SA-${orderId.split("-")[0].toUpperCase()}`;
}

export const successPageCopy = {
  ar: {
    received: "تم استلام طلبك", paid: "تم تأكيد الدفع", rejected: "تعذر تأكيد عملية الدفع",
    review: "قيد مراجعة الدفع", branch: "بانتظار الدفع في الفرع", pending: "الطلب قيد الانتظار", cardPending: "جاري التحقق من دفع البطاقة", installmentPending: "بانتظار إتمام التقسيط",
    proofBody: "تم استلام طلبك وإثبات التحويل، وسيتم تأكيد الدفع بعد المراجعة.",
    branchBody: "تم استلام طلب حجزك ولم يتم الدفع بعد. نحتفظ بالحجز لمدة 72 ساعة لاستكمال الدفع في فرع الدقي.",
    preferenceBody: "استلمنا طلبك وحفظنا طريقة الدفع المفضلة. لم يتم خصم أو تأكيد أي مبلغ في هذه الخطوة.",
    paidBody: "تمت مراجعة الدفع وتأكيده. احتفظ برقم حجزك للمتابعة مع فريق الأكاديمية.",
    rejectedBody: "لم نتمكن من التحقق من التحويل. برجاء مراجعة بيانات العملية أو التواصل معنا للمساعدة.",
    cardPendingBody: "تم استلام طلبك. ننتظر تأكيد PayTabs الآمن لتحديث حالة الدفع تلقائيًا.",
    cardPaidBody: "تم تأكيد الدفع بالبطاقة بنجاح. احتفظ برقم حجزك للمتابعة مع فريق الأكاديمية.",
    cardRejectedBody: "لم تكتمل عملية الدفع بالبطاقة. يمكنك إعادة المحاولة بنفس بيانات الحجز أو التواصل معنا للمساعدة.",
    installmentPendingBody: "تم استلام طلبك. ننتظر تأكيد EasyKash الموثّق لتحديث حالة دفع التقسيط تلقائيًا.",
    installmentPaidBody: "تم تأكيد دفع التقسيط. احتفظ برقم حجزك للمتابعة مع فريق الأكاديمية.",
    installmentRejectedBody: "لم تكتمل عملية دفع التقسيط. يمكنك إعادة المحاولة بنفس بيانات الحجز أو التواصل معنا للمساعدة.",
    next: "الخطوة التالية",
    proofNext: "سنراجع إثبات التحويل، وبعد التأكيد سيتم التواصل معك لاستكمال إجراءات الحجز.",
    branchNext: "تفضل بزيارة فرع الدقي خلال 72 ساعة لإتمام الدفع واستكمال إجراءات الحجز.",
    preferenceNext: "تواصل مع فريق الأكاديمية لاستكمال الحجز ومعرفة خيارات الدفع المتاحة.",
    paidNext: "سيتم التواصل معك لاستكمال إجراءات الحجز وتفاصيل بداية الدراسة.",
    rejectedNext: "احتفظ بإثبات الدفع ورقم الحجز، وتواصل مع الفريق قبل إجراء أي تحويل جديد.",
    cardPendingNext: "يتم تحديث الحالة تلقائيًا عند وصول تأكيد PayTabs. يمكنك استخدام زر تحديث الحالة.",
    cardRejectedNext: "أعد محاولة الدفع من صفحة الحجز بنفس البيانات، أو تواصل مع الفريق إذا تم خصم أي مبلغ.",
    installmentPendingNext: "يتم تحديث الحالة تلقائيًا عند وصول تأكيد EasyKash. يمكنك استخدام زر تحديث الحالة.",
    installmentRejectedNext: "أعد محاولة التقسيط من صفحة الحجز بنفس البيانات، أو تواصل مع الفريق إذا تم خصم أي مبلغ.",
    reference: "رقم الحجز", package: "الباقة", amount: "المبلغ النهائي", method: "طريقة الدفع", status: "حالة الدفع",
    copy: "نسخ رقم الحجز", copied: "تم النسخ", copyFailed: "تعذر النسخ؛ حدّد رقم الحجز لنسخه.",
    home: "العودة للرئيسية", plans: "استعراض الخطط", refresh: "تحديث حالة الطلب", refreshing: "جاري التحديث",
    stale: "تعذر تحديث حالة الدفع", staleBody: "تفاصيل حجزك محفوظة. حدّث الحالة لمعرفة آخر قرار للمراجعة.",
    loading: "جاري تحميل تفاصيل حجزك", unavailable: "تعذر عرض تفاصيل الحجز",
    unavailableBody: "افتح رابط الطلب الآمن من المتصفح الذي أنشأت الحجز من خلاله، أو تواصل مع فريق الأكاديمية.",
    currency: "جنيه",
  },
  en: {
    received: "Your booking request is received", paid: "Payment confirmed", rejected: "Payment could not be confirmed",
    review: "Payment under review", branch: "Awaiting payment at the branch", pending: "Request pending", cardPending: "Checking card payment", installmentPending: "Awaiting installment payment",
    proofBody: "We received your booking request and transfer receipt. Payment will be confirmed after review.",
    branchBody: "We received your booking request, but payment is not complete yet. We will hold the booking for 72 hours while you pay at the Dokki branch.",
    preferenceBody: "Your request and preferred payment method have been saved. No payment has been taken or confirmed at this step.",
    paidBody: "Your payment has been reviewed and confirmed. Keep your booking reference for any follow-up with our team.",
    rejectedBody: "We could not verify the transfer. Please review the transaction details or contact us for help.",
    cardPendingBody: "Your booking is saved. We are waiting for PayTabs' authenticated confirmation to update the payment status.",
    cardPaidBody: "Your card payment is confirmed. Keep your booking reference for any follow-up with our team.",
    cardRejectedBody: "The card payment was not completed. Retry with the same booking details or contact us for help.",
    installmentPendingBody: "Your booking is saved. We are waiting for EasyKash's authenticated confirmation to update the installment payment status.",
    installmentPaidBody: "Your installment payment is confirmed. Keep your booking reference for any follow-up with our team.",
    installmentRejectedBody: "The installment payment was not completed. Retry with the same booking details or contact us for help.",
    next: "What happens next",
    proofNext: "We will review your transfer receipt, then contact you to complete your booking once payment is confirmed.",
    branchNext: "Visit the Dokki branch within 72 hours to complete payment and finish your booking.",
    preferenceNext: "Contact our team to complete your booking and discuss the available payment options.",
    paidNext: "Our team will contact you to complete your booking and share the details for starting your studies.",
    rejectedNext: "Keep your payment receipt and booking reference. Contact our team before making another transfer.",
    cardPendingNext: "The status updates automatically when PayTabs confirms the transaction. You can also refresh this page.",
    cardRejectedNext: "Retry from the payment page with the same details, or contact our team if any amount was charged.",
    installmentPendingNext: "The status updates automatically when EasyKash confirms the transaction. You can also refresh this page.",
    installmentRejectedNext: "Retry installments from the payment page with the same details, or contact our team if any amount was charged.",
    reference: "Booking reference", package: "Package", amount: "Final amount", method: "Payment method", status: "Payment status",
    copy: "Copy booking reference", copied: "Copied", copyFailed: "Copy unavailable; select the reference to copy it.",
    home: "Back to the website", plans: "Explore plans", refresh: "Refresh order status", refreshing: "Refreshing",
    stale: "Payment status unavailable", staleBody: "Your booking details are saved. Refresh to check the latest review decision.",
    loading: "Loading your booking details", unavailable: "Booking details unavailable",
    unavailableBody: "Open the secure order link in the browser you used to book, or contact the academy team.",
    currency: "EGP",
  },
} as const;

export function bookingPresentation(order: PublicOrder, locale: Locale, current = true) {
  const copy = successPageCopy[locale];
  const method = order.payment.method;
  if (!current) return { state: "unavailable", heading: copy.received, badge: copy.stale, body: copy.staleBody, next: copy.staleBody };
  if (order.status === "paid" && order.payment.status === "paid") {
    return { state: "paid", heading: copy.paid, badge: copy.paid, body: method === "card" ? copy.cardPaidBody : method === "installments" ? copy.installmentPaidBody : copy.paidBody, next: copy.paidNext };
  }
  if (order.status === "failed" && order.payment.status === "failed") {
    return { state: "rejected", heading: copy.rejected, badge: copy.rejected, body: method === "card" ? copy.cardRejectedBody : method === "installments" ? copy.installmentRejectedBody : copy.rejectedBody, next: method === "card" ? copy.cardRejectedNext : method === "installments" ? copy.installmentRejectedNext : copy.rejectedNext };
  }
  if (method === "card" && order.status === "waiting_payment" && order.payment.status === "waiting_payment") {
    return { state: "pending", heading: copy.received, badge: copy.cardPending, body: copy.cardPendingBody, next: copy.cardPendingNext };
  }
  if (method === "installments" && order.status === "waiting_payment" && order.payment.status === "waiting_payment") {
    return { state: "pending", heading: copy.received, badge: copy.installmentPending, body: copy.installmentPendingBody, next: copy.installmentPendingNext };
  }
  const proof = method === "instapay" || method === "wallet";
  return {
    state: "pending", heading: copy.received,
    badge: proof ? copy.review : method === "branch" ? copy.branch : copy.pending,
    body: proof ? copy.proofBody : method === "branch" ? copy.branchBody : copy.preferenceBody,
    next: proof ? copy.proofNext : method === "branch" ? copy.branchNext : copy.preferenceNext,
  };
}
