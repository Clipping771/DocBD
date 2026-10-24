// DocBD Client Configuration & Medical Directory Data
export const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:5000' 
  : `${window.location.protocol}//${window.location.host}`;

export const WS_BASE = window.location.protocol === 'file:' 
  ? 'ws://localhost:5000/ws/queue' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/queue`;

export const DOCTORS = [
  {
    id: 1,
    chamberId: "ch-pop-302",
    name: "অধ্যাপক ডা. মো. রফিকুল ইসলাম",
    degree: "MBBS, FCPS (Medicine), MD (Cardiology)",
    spec: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-28491",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ৩০২, ২য় তলা",
    time: "আজ সন্ধ্যা ৭:০০ - রাত ১০:০০",
    fee: 1000,
    followupFee: 600,
    availableToday: true,
    freeSlots: 4,
    rating: "৪.৯ (১২০+ রিভিউ)",
    dept: "cardiology"
  },
  {
    id: 2,
    chamberId: "ch-pop-201",
    name: "ডা. নুসরাত জাহান চৌধুরী",
    degree: "MBBS, DGO, FCPS (Gynae & Obs)",
    spec: "স্ত্রী, প্রসূতি ও মা-শিশু বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-39102",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ২০১, ১ম তলা",
    time: "আজ বিকাল ৫:০০ - রাত ৮:৩০",
    fee: 800,
    followupFee: 500,
    availableToday: true,
    freeSlots: 2,
    rating: "৪.৮ (৯৫+ রিভিউ)",
    dept: "gynae"
  },
  {
    id: 3,
    chamberId: "ch-pop-108",
    name: "ডা. সাজ্জাদ হোসেন",
    degree: "MBBS, MD (Pediatrics)",
    spec: "নবজাতক ও শিশুরোগ বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-41820",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ১০৮, নিচতলা",
    time: "আজ সন্ধ্যা ৬:০০ - রাত ৯:০০",
    fee: 1000,
    followupFee: 700,
    availableToday: true,
    freeSlots: 6,
    rating: "৪.৯ (১৫০+ রিভিউ)",
    dept: "pediatrics"
  },
  {
    id: 4,
    chamberId: "ch-pop-102",
    name: "ডা. আনিকা তাবাসসুম",
    degree: "BDS, PGT (Pediatric Dentistry)",
    spec: "ডেন্টাল ও ওরাল ম্যাক্সিলোফেসিয়াল বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-52190",
    hospital: "গ্রিন লাইফ হাসপাতাল, গ্রিন রোড",
    chamberRoom: "রুম ১০২, নিচতলা",
    time: "আজ বিকাল ৪:০০ - সন্ধ্যা ৭:০০",
    fee: 800,
    followupFee: 500,
    availableToday: true,
    freeSlots: 5,
    rating: "৫.০ (৮০+ রিভিউ)",
    dept: "dental"
  }
];

export const DEFAULT_QUEUE = [
  { serial: 1, name: "আব্দুল খালেক", phone: "01711-100001", source: "walkin", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 2, name: "রাবেয়া খাতুন", phone: "01822-100002", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 3, name: "মো. জসিম উদ্দিন", phone: "01933-100003", source: "phone", checkin: true, fee: 600, paid: true, status: "done" },
  { serial: 4, name: "ফারহানা আফরোজ", phone: "01744-100004", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 5, name: "সুফিয়া বেগম", phone: "01555-100005", source: "online", checkin: true, fee: 1000, paid: true, status: "inside" },
  { serial: 6, name: "মাহমুদুল হাসান", phone: "01766-100006", source: "walkin", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 7, name: "আনোয়ারুল ইসলাম", phone: "01877-100007", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 8, name: "নাজমুল হুদা", phone: "01988-100008", source: "phone", checkin: false, fee: 600, paid: false, status: "waiting" },
  { serial: 9, name: "তাহমিনা আক্তার", phone: "01799-100009", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 10, name: "কামাল উদ্দিন", phone: "01811-100010", source: "walkin", checkin: false, fee: 1000, paid: true, status: "waiting" },
  { serial: 11, name: "রোজিনা পারভীন", phone: "01722-100011", source: "online", checkin: true, fee: 600, paid: true, status: "waiting" },
  { serial: 12, name: "আবুল কালাম", phone: "01711-234567", source: "online", checkin: false, fee: 1000, paid: false, status: "waiting" },
  { serial: 13, name: "শামসুল আলম", phone: "01944-100013", source: "phone", checkin: false, fee: 1000, paid: false, status: "waiting" },
  { serial: 14, name: "শাহীনুর রহমান", phone: "01855-100014", source: "online", checkin: false, fee: 1000, paid: true, status: "waiting" },
  { serial: 15, name: "মো. আলাউদ্দিন", phone: "01766-100015", source: "walkin", checkin: false, fee: 600, paid: true, status: "waiting" }
];
