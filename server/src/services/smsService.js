// DocBD Bengali SMS Service
// Integrations: SSL Wireless / Greenweb / Elitbuzz SMS Gateway Architecture

class SmsService {
  constructor() {
    this.logs = [];
  }

  // ১. OTP লগইন ও কনফার্মেশন SMS
  async sendOtp(phone, otpCode) {
    const text = `[DocBD] আপনার ভেরিফিকেশন কোড (OTP) হলো ${otpCode}। কারো সাথে শেয়ার করবেন না। মেয়াদ ৫ মিনিট।`;
    return this._dispatch(phone, text, 'OTP');
  }

  // ২. বুকিং কনফার্মেশন SMS
  async sendBookingConfirmation({ phone, patientName, docName, hospitalName, serialNum, estTime, fee }) {
    const text = `[DocBD] কনফার্মেশন: ${patientName}-এর সিরিয়াল নং #${serialNum}। ডাক্তার: ${docName}, ${hospitalName}। সম্ভাব্য সময়: ${estTime}। ফি: ৳ ${fee} (চেম্বারে নগদ পরিশোধ)। লাইভ সিরিয়াল দেখতে অ্যাপ খুলুন।`;
    return this._dispatch(phone, text, 'BOOKING_CONFIRMATION');
  }

  // ৩. চেম্বার শুরু ও নিকটবর্তী সিরিয়াল সতর্কবার্তা
  async sendSerialUpcomingAlert({ phone, serialNum, currentInside, chamberName }) {
    const text = `[DocBD সতর্কতা] ${chamberName}-এ এখন #${currentInside} সিরিয়াল ভেতরে আছেন। আপনার সিরিয়াল #${serialNum}। অনুগ্রহ করে ১০ মিনিটের মধ্যে দরজার সামনে আসুন।`;
    return this._dispatch(phone, text, 'UPCOMING_ALERT');
  }

  // ৪. ডাক্তার বিলম্ব ব্রডকাস্ট SMS (এক ক্লিকে সকল রোগীকে পাঠানো)
  async sendDoctorDelayBroadcast({ phone, docName, hospitalName, reason, delayMinutes }) {
    const text = `[DocBD নোটিশ] ${hospitalName} — ${reason || 'জরুরি অপারেশন'}-এর কারণে ${docName} আজ প্রায় ${delayMinutes} মিনিট দেরিতে চেম্বার শুরু করবেন। সাময়িক অসুবিধার জন্য দুঃখিত।`;
    return this._dispatch(phone, text, 'DELAY_ALERT');
  }

  // ৫. প্রেসক্রিপশন ফলো-আপ রিকল SMS
  async sendFollowupRecall({ phone, patientName, docName, followupDate }) {
    const text = `[DocBD রিমাইন্ডার] প্রিয় ${patientName}, ${docName}-এর প্রেসক্রিপশন অনুযায়ী আপনার পরবর্তী ফলো-আপ ভিজিটের তারিখ ${followupDate}। সিরিয়ালের জন্য অ্যাপ থেকে এখনই স্লট বুক করুন।`;
    return this._dispatch(phone, text, 'FOLLOWUP_RECALL');
  }

  // ইন্টারনাল ডিসপ্যাচ ও লগ সংরক্ষণ
  async _dispatch(phone, text, type) {
    const logItem = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phone,
      text,
      type,
      status: 'DELIVERED',
      timestamp: new Date().toISOString()
    };
    this.logs.unshift(logItem);
    console.log(`\n📨 [SSL Wireless SMS Gateway | ${type}] To: ${phone}\n   Text: "${text}"`);
    return logItem;
  }

  getLogs(limit = 20) {
    return this.logs.slice(0, limit);
  }
}

module.exports = new SmsService();
