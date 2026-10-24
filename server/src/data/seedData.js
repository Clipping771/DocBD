// DocBD Real-world Seed Data for Dhaka SAM (Serviceable Addressable Market)
// Locations: Dhanmondi, Panthapath, Bashundhara

const HOSPITALS = [
  {
    id: "hosp-pop-dhanmondi",
    dghsRegNo: "DGHS-DHK-PVT-08241",
    name: "পপুলার ডায়াগনস্টিক সেন্টার",
    branch: "ধানমন্ডি শাখা (প্রধান কার্যালয়)",
    division: "ঢাকা",
    district: "ঢাকা",
    thana: "ধানমন্ডি",
    address: "বাড়ি ১৬, রোড ২, ধানমন্ডি, ঢাকা ১২০৫",
    latitude: 23.7461,
    longitude: 90.3742,
    contactPhone: "09613-787801",
    hasEmergency: true,
    ambulanceNo: "01713-000001",
    subscriptionTier: "HOSPITAL"
  },
  {
    id: "hosp-square-panthapath",
    dghsRegNo: "DGHS-DHK-PVT-01923",
    name: "স্কয়ার হাসপাতাল",
    branch: "পান্থপথ",
    division: "ঢাকা",
    district: "ঢাকা",
    thana: "পান্থপথ",
    address: "১৮/এফ, বীর উত্তম কাজী নুরুজ্জামান সড়ক, ঢাকা ১২০৫",
    latitude: 23.7533,
    longitude: 90.3817,
    contactPhone: "10616",
    hasEmergency: true,
    ambulanceNo: "01713-377773",
    subscriptionTier: "HOSPITAL"
  },
  {
    id: "hosp-ibnsina-dhanmondi",
    dghsRegNo: "DGHS-DHK-PVT-04182",
    name: "ইবনে সিনা ডায়াগনস্টিক অ্যান্ড কনসালটেশন সেন্টার",
    branch: "ধানমন্ডি",
    division: "ঢাকা",
    district: "ঢাকা",
    thana: "ধানমন্ডি",
    address: "বাড়ি ৬৮, রোড ১৫, ধানমন্ডি, ঢাকা ১২০৯",
    latitude: 23.7511,
    longitude: 90.3705,
    contactPhone: "09610-010615",
    hasEmergency: false,
    ambulanceNo: "01717-353535",
    subscriptionTier: "CLINIC"
  },
  {
    id: "hosp-labaid-dhanmondi",
    dghsRegNo: "DGHS-DHK-PVT-02811",
    name: "ল্যাবএইড স্পেশালাইজড হাসপাতাল",
    branch: "ধানমন্ডি",
    division: "ঢাকা",
    district: "ঢাকা",
    thana: "ধানমন্ডি",
    address: "বাড়ি ১, রোড ৪, ধানমন্ডি, ঢাকা ১২০৫",
    latitude: 23.7432,
    longitude: 90.3828,
    contactPhone: "10606",
    hasEmergency: true,
    ambulanceNo: "01766-662222",
    subscriptionTier: "HOSPITAL"
  }
];

const DOCTORS = [
  {
    id: "doc-rofiqul",
    bmdcRegNo: "A-28491",
    isBmdcVerified: true,
    name: "অধ্যাপক ডা. মো. রফিকুল ইসলাম",
    degrees: "MBBS, FCPS (Medicine), MD (Cardiology)",
    specialty: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ",
    gender: "MALE",
    experienceYears: 22,
    bio: "জাতীয় হৃদরোগ ইনস্টিটিউট ও হাসপাতালের সাবেক অধ্যাপক। উচ্চ রক্তচাপ, হার্ট অ্যাটাক পরবর্তী যত্ন ও জেনারেল মেডিসিন বিশেষজ্ঞ।",
    chambers: [
      {
        id: "ch-pop-302",
        hospitalId: "hosp-pop-dhanmondi",
        roomNumber: "কক্ষ ৩০২, ২য় তলা",
        newPatientFee: 1000,
        followupFee: 600,
        schedules: [
          { dayOfWeek: 0, startTime: "19:00", endTime: "22:00", maxSerials: 25 },
          { dayOfWeek: 1, startTime: "19:00", endTime: "22:00", maxSerials: 25 },
          { dayOfWeek: 2, startTime: "19:00", endTime: "22:00", maxSerials: 25 },
          { dayOfWeek: 3, startTime: "19:00", endTime: "22:00", maxSerials: 25 },
          { dayOfWeek: 4, startTime: "19:00", endTime: "22:00", maxSerials: 25 }
        ]
      }
    ]
  },
  {
    id: "doc-nusrat",
    bmdcRegNo: "A-39102",
    isBmdcVerified: true,
    name: "ডা. নুসরাত জাহান চৌধুরী",
    degrees: "MBBS, DGO, FCPS (Gynae & Obs)",
    specialty: "স্ত্রী ও প্রসূতিরোগ বিশেষজ্ঞ এবং ল্যাপারোস্কোপিক সার্জন",
    gender: "FEMALE",
    experienceYears: 14,
    bio: "হাই-রিস্ক প্রেগন্যান্সি, ইনফার্টিলিটি এবং জাইনোকোলজিক্যাল সমস্যার বিশেষ পরামর্শদাতা।",
    chambers: [
      {
        id: "ch-ibn-201",
        hospitalId: "hosp-ibnsina-dhanmondi",
        roomNumber: "রুম ২০১, ধানমন্ডি",
        newPatientFee: 800,
        followupFee: 500,
        schedules: [
          { dayOfWeek: 0, startTime: "17:00", endTime: "20:30", maxSerials: 20 },
          { dayOfWeek: 2, startTime: "17:00", endTime: "20:30", maxSerials: 20 },
          { dayOfWeek: 4, startTime: "17:00", endTime: "20:30", maxSerials: 20 }
        ]
      }
    ]
  },
  {
    id: "doc-sajjad",
    bmdcRegNo: "A-41820",
    isBmdcVerified: true,
    name: "ডা. সাজ্জাদ হোসেন",
    degrees: "MBBS, MD (Pediatrics), Fellowship in Neonatology",
    specialty: "নবজাতক ও শিশুরোগ বিশেষজ্ঞ",
    gender: "MALE",
    experienceYears: 12,
    bio: "শিশুর অপুষ্টি, নিউমোনিয়া, টিকাদান পরামর্শ ও নবজাতকের জটিল রোগের অভিজ্ঞ চিকিৎসক।",
    chambers: [
      {
        id: "ch-sq-opd3",
        hospitalId: "hosp-square-panthapath",
        roomNumber: "ওপিডি ৩",
        newPatientFee: 1200,
        followupFee: 800,
        schedules: [
          { dayOfWeek: 0, startTime: "18:00", endTime: "21:00", maxSerials: 30 },
          { dayOfWeek: 1, startTime: "18:00", endTime: "21:00", maxSerials: 30 },
          { dayOfWeek: 3, startTime: "18:00", endTime: "21:00", maxSerials: 30 }
        ]
      }
    ]
  }
];

module.exports = { HOSPITALS, DOCTORS };
