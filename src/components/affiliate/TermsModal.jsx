import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

const TERMS = [
  { title: "10% Commission Structure", body: "You earn 10% commission on all successful sales generated using your unique D-Kadris referral code. Commissions are calculated based on the product sale price and are credited to your affiliate wallet only after the admin confirms payment received." },
  { title: "Payout Threshold", body: "Payouts are guaranteed once your wallet balance meets or exceeds the \u20a65,000 threshold. Below this amount, payouts cannot be processed. Once the threshold is met, click 'Request Payout' and provide your bank details for processing within 24\u201348 hours." },
  { title: "No Spamming", body: "Affiliates must NOT spam referral links or codes. This includes unsolicited mass messaging, fake engagement, or distributing links via deceptive means. Violations will result in immediate account suspension without notice." },
  { title: "Account Activity Requirement", body: "Affiliates must actively log in and access their dashboard. Accounts that remain entirely unopened or unused for 3 consecutive months will be automatically flagged and suspended. You will be notified by email before suspension takes effect." },
  { title: "Customer Must Enter Your Code", body: "Affiliates are responsible for explicitly urging their buyers to input the referral code in the designated 'REFERRAL CODE' field during custom tailoring or product checkout. If a customer fails to enter your code, the sale is considered void and no 10% commission will be awarded \u2014 no exceptions." },
  { title: "Self-Referral Prohibited", body: "Using your own referral code on your own orders is strictly prohibited. Any self-referral detected will be voided immediately and may result in account suspension." },
  { title: "Account Status", body: "All new accounts start in 'Pending' status and must be reviewed and approved by an admin before they can earn commissions. You will be notified via email once your account is approved or if any status changes occur." },
];

export default function TermsModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-2xl w-[95vw] flex flex-col" style={{ maxHeight: "85vh" }}>
        <style>{`[data-radix-dialog-close] { color: #000 !important; opacity: 1 !important; } [data-radix-dialog-close] svg { color: #000 !important; stroke: #000 !important; }`}</style>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-gray-700" />
            </div>
            <DialogTitle className="font-black text-xl text-gray-900">Affiliate Terms & Conditions</DialogTitle>
          </div>
          <p className="text-gray-500 text-sm">Please read these rules carefully before joining the D-Kadris Affiliate Program.</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 mt-2" style={{ overflowY: "auto" }}>
          <div className="space-y-5">
            {TERMS.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <h4 className="text-gray-900 font-bold text-sm mb-1">{t.title}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{t.body}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-gray-800 text-sm font-medium">
              By registering, you confirm that you have read, understood, and agree to all the terms above. D-Kadris reserves the right to update these terms at any time.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
