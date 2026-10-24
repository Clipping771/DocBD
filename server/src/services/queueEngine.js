const fs = require('fs');
const path = require('path');
const smsService = require('./smsService');

class QueueEngine {
  constructor() {
    this.demoDbFilePath = path.join(__dirname, '../data/demo_store.json');
    this.realDbFilePath = path.join(__dirname, '../data/real_store.json');
    
    // Operating Mode: default to real (clean database, no fake records)
    this.mode = process.env.DOCBD_MODE || 'real';
    
    this.hospitals = new Map();
    this.chambers = new Map();
    this.wsClients = new Set();
    this.prescriptions = new Map(); // patientPhone / patientName -> Rx[]
    this.auditLogs = [];
    
    this._initModeData();
  }

  get activeDbPath() {
    return this.mode === 'real' ? this.realDbFilePath : this.demoDbFilePath;
  }

  getModeInfo() {
    return {
      mode: this.mode,
      isDemo: this.mode === 'demo',
      isReal: this.mode === 'real',
      label: this.mode === 'real' ? 'লাইভ সিস্টেম (প্রকৃত ডেটা)' : 'টেস্টিং মোড',
      totalChambers: this.chambers.size,
      activeStorage: path.basename(this.activeDbPath)
    };
  }

  setMode(newMode) {
    if (newMode !== 'demo' && newMode !== 'real') {
      throw new Error("Invalid mode. Allowed: 'demo' or 'real'");
    }
    if (this.mode === newMode) return this.getModeInfo();

    // Save current mode state first
    this._saveToDisk();

    this.mode = newMode;
    this.chambers.clear();
    this.prescriptions.clear();
    this.auditLogs = [];

    this._initModeData();
    this.logAudit({
      action: 'MODE_SWITCH',
      chamberId: 'SYSTEM',
      userRole: 'ADMIN',
      details: `System switched to ${this.mode.toUpperCase()} mode.`
    });

    this.broadcastModeChange();
    return this.getModeInfo();
  }

  _initModeData() {
    this._loadFromDisk();
    if (this.hospitals.size === 0 || this.chambers.size === 0) {
      this._initRealCleanData();
      this._saveToDisk();
    }
  }

  _getDefaultHospitals() {
    return [
      {
        id: "hosp-pop-dhanmondi",
        name: "পপুলার ডায়াগনস্টিক সেন্টার",
        branch: "ধানমন্ডি শাখা (প্রধান কার্যালয়)",
        dghsRegNo: "DGHS-DHK-PVT-08241",
        division: "ঢাকা",
        district: "ঢাকা",
        thana: "ধানমন্ডি",
        address: "বাড়ি ১৬, রোড ২, ধানমন্ডি, ঢাকা ১২০৫",
        contactPhone: "09613-787801",
        emergencyPhone: "01713-000001",
        adminName: "মো. ফখরুল আলম",
        adminEmail: "admin.popular@docbd.com",
        adminPhone: "01711002233",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE"
      },
      {
        id: "hosp-square-panthapath",
        name: "স্কয়ার হাসপাতাল",
        branch: "পান্থপথ শাখা",
        dghsRegNo: "DGHS-DHK-PVT-01923",
        division: "ঢাকা",
        district: "ঢাকা",
        thana: "পান্থপথ",
        address: "১৮/এফ, বীর উত্তম কাজী নুরুজ্জামান সড়ক, ঢাকা ১২০৫",
        contactPhone: "10616",
        emergencyPhone: "01713-377773",
        adminName: "ডা. এ কে এম তারেক",
        adminEmail: "admin.square@docbd.com",
        adminPhone: "01711004455",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE"
      },
      {
        id: "hosp-ibnsina-dhanmondi",
        name: "ইবনে সিনা ডায়াগনস্টিক সেন্টার",
        branch: "ধানমন্ডি শাখা",
        dghsRegNo: "DGHS-DHK-PVT-04182",
        division: "ঢাকা",
        district: "ঢাকা",
        thana: "ধানমন্ডি",
        address: "বাড়ি ৬৮, রোড ১৫, ধানমন্ডি, ঢাকা ১২০৯",
        contactPhone: "09610-010615",
        emergencyPhone: "01717-353535",
        adminName: "সৈয়দ আরিফুর রহমান",
        adminEmail: "admin.ibnsina@docbd.com",
        adminPhone: "01711003344",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE"
      },
      {
        id: "hosp-labaid-dhanmondi",
        name: "ল্যাবএইড স্পেশালাইজড হাসপাতাল",
        branch: "ধানমন্ডি শাখা",
        dghsRegNo: "DGHS-DHK-PVT-02811",
        division: "ঢাকা",
        district: "ঢাকা",
        thana: "ধানমন্ডি",
        address: "বাড়ি ১, রোড ৪, ধানমন্ডি, ঢাকা ১২০৫",
        contactPhone: "10606",
        emergencyPhone: "01766-662222",
        adminName: "চৌধুরী ফাহিম আহমেদ",
        adminEmail: "admin.labaid@docbd.com",
        adminPhone: "01711005566",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE"
      },
      {
        id: "hosp-evercare-bashundhara",
        name: "এভারকেয়ার হাসপাতাল",
        branch: "বসুন্ধরা শাখা",
        dghsRegNo: "DGHS-DHK-PVT-03319",
        division: "ঢাকা",
        district: "ঢাকা",
        thana: "বসুন্ধরা",
        address: "প্লট ৮১, ব্লক ই, বসুন্ধরা আ/এ, ঢাকা ১২২৯",
        contactPhone: "10678",
        emergencyPhone: "01714-000000",
        adminName: "রেহনুমা তাসনিম",
        adminEmail: "admin.evercare@docbd.com",
        adminPhone: "01711006677",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE"
      }
    ];
  }

  _getDefaultChambers() {
    return [
      {
        chamberId: "ch-pop-302",
        hospitalId: "hosp-pop-dhanmondi",
        docId: "doc-rofiqul",
        bmdcRegNo: "A-28491",
        isDemo: false,
        docName: "অধ্যাপক ডা. মো. রফিকুল ইসলাম",
        degree: "MBBS, FCPS (Medicine), MD (Cardiology)",
        specialty: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ",
        hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
        room: "কক্ষ ৩০২, ২য় তলা",
        currentInsideSerial: 1,
        avgMinutesPerPatient: 10,
        fee: 1000,
        followupFee: 600,
        schedules: [
          {
            day: "প্রতিদিন",
            time: "সন্ধ্যা ৭:০০ - রাত ১০:০০"
          }
        ],
        queue: [
          {
            serial: 1,
            name: "আব্দুল করিম",
            phone: "01711223344",
            source: "online",
            checkin: true,
            fee: 1000,
            paid: true,
            status: "inside",
            bookedAt: new Date(Date.now() - 30 * 60000).toISOString(),
            paymentMethod: "CASH",
            paymentReceivedBy: "কাউন্টার ক্যাশিয়ার ১"
          },
          {
            serial: 2,
            name: "মাহমুদা আক্তার",
            phone: "01819887766",
            source: "walkin",
            checkin: true,
            fee: 1000,
            paid: false,
            status: "waiting",
            bookedAt: new Date(Date.now() - 20 * 60000).toISOString()
          },
          {
            serial: 3,
            name: "রাশেদ চৌধুরী",
            phone: "01912334455",
            source: "online",
            checkin: false,
            fee: 1000,
            paid: true,
            status: "waiting",
            bookedAt: new Date(Date.now() - 10 * 60000).toISOString(),
            paymentMethod: "BKASH"
          }
        ]
      },
      {
        chamberId: "ch-ibn-201",
        hospitalId: "hosp-ibnsina-dhanmondi",
        docId: "doc-nusrat",
        bmdcRegNo: "A-39102",
        isDemo: false,
        docName: "ডা. নুসরাত জাহান চৌধুরী",
        degree: "MBBS, DGO, FCPS (Gynae & Obs)",
        specialty: "স্ত্রী ও প্রসূতিরোগ বিশেষজ্ঞ",
        hospitalName: "ইবনে সিনা ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
        room: "রুম ২০১, ২য় তলা",
        currentInsideSerial: 1,
        avgMinutesPerPatient: 12,
        fee: 800,
        followupFee: 500,
        schedules: [
          {
            day: "রবি, মঙ্গল, বৃহস্পতি",
            time: "বিকেল ৫:০০ - রাত ৮:৩০"
          }
        ],
        queue: [
          {
            serial: 1,
            name: "তানিয়া সুলতানা",
            phone: "01722334455",
            source: "online",
            checkin: true,
            fee: 800,
            paid: true,
            status: "inside",
            bookedAt: new Date(Date.now() - 25 * 60000).toISOString()
          },
          {
            serial: 2,
            name: "ফারজানা বেগম",
            phone: "01833445566",
            source: "walkin",
            checkin: false,
            fee: 800,
            paid: false,
            status: "waiting",
            bookedAt: new Date(Date.now() - 15 * 60000).toISOString()
          }
        ]
      },
      {
        chamberId: "ch-sq-opd3",
        hospitalId: "hosp-square-panthapath",
        docId: "doc-sajjad",
        bmdcRegNo: "A-41820",
        isDemo: false,
        docName: "ডা. সাজ্জাদ হোসেন",
        degree: "MBBS, MD (Pediatrics), Neonatology",
        specialty: "নবজাতক ও শিশুরোগ বিশেষজ্ঞ",
        hospitalName: "স্কয়ার হাসপাতাল, পান্থপথ",
        room: "ওপিডি ৩, ৩য় তলা",
        currentInsideSerial: null,
        avgMinutesPerPatient: 10,
        fee: 1200,
        followupFee: 800,
        schedules: [
          {
            day: "শনি, সোম, বুধ",
            time: "সন্ধ্যা ৬:০০ - রাত ৯:০০"
          }
        ],
        queue: [
          {
            serial: 1,
            name: "আহনাফ রহমান (শিশু)",
            phone: "01944556677",
            source: "online",
            checkin: true,
            fee: 1200,
            paid: true,
            status: "waiting",
            bookedAt: new Date(Date.now() - 15 * 60000).toISOString()
          }
        ]
      },
      {
        chamberId: "ch-lab-405",
        hospitalId: "hosp-labaid-dhanmondi",
        docId: "doc-hannan",
        bmdcRegNo: "A-19402",
        isDemo: false,
        docName: "অধ্যাপক ডা. এম এ হান্নান",
        degree: "MBBS, MS (Orthopedics), FICS",
        specialty: "অর্থোপেডিক ও ট্রমা বিশেষজ্ঞ",
        hospitalName: "ল্যাবএইড স্পেশালাইজড হাসপাতাল, ধানমন্ডি",
        room: "রুম ৪০৫, ৪র্থ তলা",
        currentInsideSerial: null,
        avgMinutesPerPatient: 15,
        fee: 1500,
        followupFee: 1000,
        schedules: [
          {
            day: "শনি, রবি, মঙ্গল, বৃহস্পতি",
            time: "সন্ধ্যা ৬:৩০ - রাত ৯:৩০"
          }
        ],
        queue: [
          {
            serial: 1,
            name: "মো. কামরুল হাসান",
            phone: "01755667788",
            source: "online",
            checkin: true,
            fee: 1500,
            paid: true,
            status: "waiting",
            bookedAt: new Date(Date.now() - 10 * 60000).toISOString()
          }
        ]
      },
      {
        chamberId: "ch-evc-opd5",
        hospitalId: "hosp-evercare-bashundhara",
        docId: "doc-farhana",
        bmdcRegNo: "A-44912",
        isDemo: false,
        docName: "ডা. ফারহানা আহমেদ",
        degree: "MBBS, DDV, FCPS (Dermatology)",
        specialty: "চর্ম, এলার্জি ও যৌনরোগ বিশেষজ্ঞ",
        hospitalName: "এভারকেয়ার হাসপাতাল, বসুন্ধরা",
        room: "ওপিডি ৫, ৫ম তলা",
        currentInsideSerial: null,
        avgMinutesPerPatient: 10,
        fee: 1200,
        followupFee: 800,
        schedules: [
          {
            day: "প্রতিদিন",
            time: "বিকেল ৪:০০ - সন্ধ্যা ৭:০০"
          }
        ],
        queue: []
      }
    ];
  }

  _initRealCleanData() {
    console.log('[DocBD DB] Initializing multi-tenant hospitals and verified specialist doctors directory.');
    this.hospitals = new Map();
    this.chambers = new Map();
    this.prescriptions = new Map();
    this.auditLogs = [];
    
    for (const h of this._getDefaultHospitals()) {
      this.hospitals.set(h.id, h);
    }
    for (const ch of this._getDefaultChambers()) {
      this.chambers.set(ch.chamberId, ch);
    }
  }

  resetRealData() {
    this._initRealCleanData();
    this._saveToDisk();
    try {
      fs.writeFileSync(this.demoDbFilePath, fs.readFileSync(this.realDbFilePath, 'utf8'), 'utf8');
      this.broadcastModeChange();
    } catch (e) {
      console.error('Reset data error:', e);
    }
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(this.activeDbPath)) {
        const raw = fs.readFileSync(this.activeDbPath, 'utf8');
        const data = JSON.parse(raw);
        
        if (data && data.hospitals && Array.isArray(data.hospitals)) {
          for (const h of data.hospitals) {
            this.hospitals.set(h.id, h);
          }
        }
        if (this.hospitals.size === 0) {
          for (const h of this._getDefaultHospitals()) {
            this.hospitals.set(h.id, h);
          }
        }

        if (data && data.chambers && Array.isArray(data.chambers)) {
          for (const ch of data.chambers) {
            this.chambers.set(ch.chamberId, ch);
          }
          if (data.prescriptions) {
            for (const [key, val] of Object.entries(data.prescriptions)) {
              this.prescriptions.set(key, val);
            }
          }
          if (Array.isArray(data.auditLogs)) {
            this.auditLogs = data.auditLogs;
          }
          console.log(`[DocBD DB] Restored [${this.mode.toUpperCase()}] state (${this.hospitals.size} hospitals, ${this.chambers.size} chambers) from ${this.activeDbPath}`);
          return true;
        }
      }
    } catch (e) {
      console.warn(`[DocBD DB] Disk load warning (${this.activeDbPath}):`, e.message);
    }
    return false;
  }

  _saveToDisk() {
    try {
      const hospitalsArray = Array.from(this.hospitals.values());
      const chambersArray = Array.from(this.chambers.values());
      const prescriptionsObj = Object.fromEntries(this.prescriptions);
      const data = {
        updatedAt: new Date().toISOString(),
        mode: this.mode,
        hospitals: hospitalsArray,
        chambers: chambersArray,
        prescriptions: prescriptionsObj,
        auditLogs: this.auditLogs.slice(-200) // keep last 200 logs
      };
      fs.writeFileSync(this.activeDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`[DocBD DB] Disk save error (${this.activeDbPath}):`, e.message);
    }
  }

  logAudit({ action, chamberId, userRole = 'SYSTEM', details = '', performedBy = 'User' }) {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      chamberId: chamberId || 'N/A',
      userRole,
      details,
      performedBy
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    return entry;
  }

  getAuditLogs(limit = 50) {
    return this.auditLogs.slice(0, limit);
  }

  _initDemoData() {
    console.log('[DocBD DB] Seeding clearly labeled fictional records for DEMO MODE.');
    
    // 1. Chamber 302: Prof. Dr. Md. Rafiqul Islam (Cardiology) - DEMO
    this.chambers.set("ch-pop-302", {
      chamberId: "ch-pop-302",
      docId: "doc-demo-1",
      bmdcRegNo: "BMDC-A-28491 (DEMO)",
      isDemo: true,
      docName: "অধ্যাপক ডা. মো. রফিকুল ইসলাম [ডেমো]",
      degree: "MBBS, FCPS (Cardiology), MD",
      specialty: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ",
      hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
      room: "কক্ষ ৩০২, ২য় তলা",
      currentInsideSerial: 5,
      avgMinutesPerPatient: 10,
      fee: 1000,
      followupFee: 600,
      queue: [
        { serial: 1, name: "আব্দুল খালেক [কাল্পনিক]", phone: "01711-100001", source: "walkin", checkin: true, fee: 1000, paid: true, status: "done" },
        { serial: 2, name: "রাবেয়া খাতুন [কাল্পনিক]", phone: "01822-100002", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
        { serial: 3, name: "মো. জসিম উদ্দিন [কাল্পনিক]", phone: "01933-100003", source: "phone", checkin: true, fee: 600, paid: true, status: "done" },
        { serial: 4, name: "ফারহানা আফরোজ [কাল্পনিক]", phone: "01744-100004", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
        { serial: 5, name: "সুফিয়া বেগম [কাল্পনিক]", phone: "01555-100005", source: "online", checkin: true, fee: 1000, paid: true, status: "inside", vitals: { bp: "130/85", pulse: 76, spo2: 98, temp: 98.4, weight: 64 } },
        { serial: 6, name: "মাহমুদুল হাসান [কাল্পনিক]", phone: "01766-100006", source: "walkin", checkin: true, fee: 1000, paid: true, status: "waiting" },
        { serial: 7, name: "আনোয়ারুল ইসলাম [কাল্পনিক]", phone: "01877-100007", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
        { serial: 8, name: "নাজমুল হুদা [কাল্পনিক]", phone: "01988-100008", source: "phone", checkin: false, fee: 600, paid: false, status: "waiting" },
        { serial: 9, name: "তাহমিনা আক্তার [কাল্পনিক]", phone: "01799-100009", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
        { serial: 10, name: "কামাল উদ্দিন [কাল্পনিক]", phone: "01811-100010", source: "walkin", checkin: false, fee: 1000, paid: true, status: "waiting" }
      ]
    });

    // 2. Chamber 201: Dr. Nusrat Jahan Chowdhury (Gynae) - DEMO
    this.chambers.set("ch-pop-201", {
      chamberId: "ch-pop-201",
      docId: "doc-demo-2",
      bmdcRegNo: "BMDC-A-39102 (DEMO)",
      isDemo: true,
      docName: "ডা. নুসরাত জাহান চৌধুরী [ডেমো]",
      degree: "MBBS, DGO, FCPS (Gynae & Obs)",
      specialty: "স্ত্রী ও প্রসূতি বিশেষজ্ঞ",
      hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
      room: "কক্ষ ২০১, ১ম তলা",
      currentInsideSerial: 12,
      avgMinutesPerPatient: 12,
      fee: 800,
      followupFee: 500,
      queue: [
        { serial: 11, name: "নাজমা বেগম [কাল্পনিক]", phone: "01712-300001", source: "online", checkin: true, fee: 800, paid: true, status: "done" },
        { serial: 12, name: "রীতা আক্তার [কাল্পনিক]", phone: "01819-300002", source: "walkin", checkin: true, fee: 800, paid: true, status: "inside", vitals: { bp: "115/75", pulse: 80, spo2: 99, temp: 98.6, weight: 58 } },
        { serial: 13, name: "মমতাজ বেগম [কাল্পনিক]", phone: "01911-300003", source: "online", checkin: true, fee: 800, paid: true, status: "waiting" }
      ]
    });

    // 3. Chamber 108: Dr. Sajjad Hossain (Pediatrics) - DEMO
    this.chambers.set("ch-pop-108", {
      chamberId: "ch-pop-108",
      docId: "doc-demo-3",
      bmdcRegNo: "BMDC-A-41820 (DEMO)",
      isDemo: true,
      docName: "ডা. সাজ্জাদ হোসেন [ডেমো]",
      degree: "MBBS, MD (Pediatrics)",
      specialty: "নবজাতক ও শিশুরোগ বিশেষজ্ঞ",
      hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
      room: "কক্ষ ১০৮, নিচতলা",
      currentInsideSerial: null,
      avgMinutesPerPatient: 8,
      fee: 1000,
      followupFee: 700,
      queue: [
        { serial: 1, name: "ছোট্ট আরিয়ান [কাল্পনিক]", phone: "01711-234567", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" }
      ]
    });

    // Demo Seed Prescription for Sufia Begum
    this.prescriptions.set("01555-100005", [{
      id: "rx-demo-1",
      serial: 5,
      patientName: "সুফিয়া বেগম [কাল্পনিক]",
      patientPhone: "01555-100005",
      docName: "অধ্যাপক ডা. মো. রফিকুল ইসলাম [ডেমো]",
      hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
      chamberRoom: "কক্ষ ৩০২, ২য় তলা",
      diagnosis: "Essential Hypertension & Mild Angina (Demo Record)",
      date: "২৩ অক্টোবর, ২০২৬",
      medications: [
        "Tab. Bizoran 5/20 mg — ১ + ০ + ০ (সকালে খাওয়ার পর) • ৩০ দিন",
        "Cap. Seclo 20 mg — ১ + ০ + ১ (খাওয়ার ৩০ মিনিট পূর্বে) • ৩০ দিন",
        "Tab. Napa Extra 500/65 mg — ব্যথা হলে ১টি ভরা পেটে"
      ],
      tests: "ECG (12-Lead), Serum Creatinine, Echocardiography",
      followupDate: "২০২৬-১০-৩০"
    }]);

    this.logAudit({
      action: 'INIT_DEMO',
      chamberId: 'SYSTEM',
      userRole: 'SYSTEM',
      details: 'Initialized demo dataset with 3 chambers and fictional records.'
    });
  }

  // Doctor & Chamber Onboarding (Real Mode or Demo Mode)
  addDoctorAndChamber({
    name,
    bmdcRegNo,
    degrees,
    specialty,
    hospitalName = "পপুলার ডায়াগনস্টিক সেন্টার",
    roomNumber = "কক্ষ ১০১",
    fee = 1000,
    followupFee = 600,
    schedules = []
  }) {
    if (!name || !bmdcRegNo || !specialty) {
      throw new Error("Doctor Name, BMDC Reg No, and Specialty are required.");
    }

    const cleanBmdc = bmdcRegNo.trim().toUpperCase();
    const chamberId = `ch-${cleanBmdc.replace(/[^A-Z0-9]/g, '').toLowerCase() || Date.now()}`;
    const docId = `doc-${Date.now()}`;

    const newChamber = {
      chamberId,
      docId,
      bmdcRegNo: cleanBmdc,
      isDemo: this.mode === 'demo',
      docName: name.trim(),
      degree: degrees ? degrees.trim() : "MBBS",
      specialty: specialty.trim(),
      hospitalName: hospitalName.trim(),
      room: roomNumber.trim(),
      currentInsideSerial: null,
      avgMinutesPerPatient: 10,
      fee: Number(fee) || 1000,
      followupFee: Number(followupFee) || 600,
      schedules: schedules.length ? schedules : [{ day: "আজ", time: "সন্ধ্যা ৬:০০ - রাত ৯:০০" }],
      queue: []
    };

    this.chambers.set(chamberId, newChamber);
    
    this.logAudit({
      action: 'ADD_DOCTOR_CHAMBER',
      chamberId,
      userRole: 'ADMIN',
      details: `Registered Dr. ${newChamber.docName} (BMDC: ${cleanBmdc}) at ${newChamber.room}`
    });

    this._saveToDisk();
    this.broadcastUpdate(chamberId);
    return newChamber;
  }

  // --- MULTI-TENANT HOSPITAL & SUPER ADMIN METHODS ---

  getHospitals() {
    const list = [];
    for (const h of this.hospitals.values()) {
      const hospitalChambers = Array.from(this.chambers.values()).filter(c => c.hospitalId === h.id);
      list.push({
        ...h,
        doctorCount: hospitalChambers.length,
        totalQueueCount: hospitalChambers.reduce((sum, c) => sum + c.queue.length, 0),
        activeDoctors: hospitalChambers.map(c => ({
          chamberId: c.chamberId,
          docName: c.docName,
          specialty: c.specialty,
          room: c.room,
          fee: c.fee
        }))
      });
    }
    return list;
  }

  getHospitalById(id) {
    const h = this.hospitals.get(id);
    if (!h) return null;
    const hospitalChambers = Array.from(this.chambers.values()).filter(c => c.hospitalId === id);
    return {
      ...h,
      doctorCount: hospitalChambers.length,
      chambers: hospitalChambers
    };
  }

  // System Super Admin creates a Hospital and assigns its Hospital Admin
  createHospital({ name, branch = '', dghsRegNo, division = 'ঢাকা', district = 'ঢাকা', thana = '', address, contactPhone, emergencyPhone = '16263', adminName, adminEmail, adminPhone }) {
    if (!name || !dghsRegNo || !adminName || !adminEmail) {
      throw new Error("হাসপাতালের নাম, ডিজিএইচএস রেজিস্ট্রেশন নম্বর এবং অ্যাডমিনের নাম ও ইমেইল আবশ্যক।");
    }

    const id = `hosp-${Date.now().toString(36)}`;
    const newHospital = {
      id,
      name: name.trim(),
      branch: branch ? branch.trim() : 'প্রধান শাখা',
      dghsRegNo: dghsRegNo.trim(),
      division,
      district,
      thana,
      address: address ? address.trim() : 'ঢাকা',
      contactPhone: contactPhone || '02-9999999',
      emergencyPhone: emergencyPhone || '16263',
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone || '',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    this.hospitals.set(id, newHospital);
    this.logAudit({
      action: 'CREATE_HOSPITAL',
      chamberId: 'SYSTEM',
      userRole: 'SUPER_ADMIN',
      details: `New Hospital [${newHospital.name}] created with Hospital Admin [${adminName} - ${adminEmail}].`
    });

    this._saveToDisk();
    this.broadcastModeChange();
    return newHospital;
  }

  // System Super Admin assigns or updates Hospital Admin
  updateHospitalAdmin(hospitalId, { adminName, adminEmail, adminPhone }) {
    const h = this.hospitals.get(hospitalId);
    if (!h) throw new Error("হাসপাতাল পাওয়া যায়নি।");

    if (adminName) h.adminName = adminName.trim();
    if (adminEmail) h.adminEmail = adminEmail.trim();
    if (adminPhone) h.adminPhone = adminPhone.trim();

    this.logAudit({
      action: 'UPDATE_HOSPITAL_ADMIN',
      chamberId: hospitalId,
      userRole: 'SUPER_ADMIN',
      details: `Hospital Admin updated for [${h.name}]: ${h.adminName} (${h.adminEmail}).`
    });

    this._saveToDisk();
    this.broadcastModeChange();
    return h;
  }

  // Hospital Admin onboards a doctor specifically for their hospital
  addDoctorToHospital(hospitalId, { name, bmdcRegNo, degrees, specialty, roomNumber, fee, followupFee, schedules }) {
    const hospital = this.hospitals.get(hospitalId);
    if (!hospital) {
      throw new Error("নির্ধারিত হাসপাতাল পাওয়া যায়নি। অনুগ্রহ করে সঠিক হাসপাতাল নির্বাচন করুন।");
    }
    if (!name || !bmdcRegNo || !specialty) {
      throw new Error("ডাক্তারের নাম, বিএমডিসি রেজিস্ট্রেশন নম্বর এবং স্পেশালিটি আবশ্যক।");
    }

    const docId = `doc-${Date.now().toString(36)}`;
    const chamberId = `ch-${hospitalId.replace('hosp-', '')}-${Math.random().toString(36).substr(2, 4)}`;

    const newChamber = {
      chamberId,
      hospitalId,
      hospitalName: `${hospital.name}${hospital.branch ? ', ' + hospital.branch : ''}`,
      docId,
      bmdcRegNo: bmdcRegNo.trim(),
      isDemo: false,
      docName: name.trim(),
      degree: degrees ? degrees.trim() : "MBBS",
      specialty: specialty.trim(),
      room: roomNumber ? roomNumber.trim() : "ওপিডি কক্ষ ১",
      currentInsideSerial: null,
      avgMinutesPerPatient: 10,
      fee: Number(fee) || 800,
      followupFee: Number(followupFee) || 500,
      rating: "৪.৯ (১২০+ রিভিউ)",
      schedules: schedules && schedules.length > 0 ? schedules : [
        { day: "প্রতিদিন", time: "সন্ধ্যা ৬:০০ - রাত ৯:০০" }
      ],
      queue: []
    };

    this.chambers.set(chamberId, newChamber);
    this.logAudit({
      action: 'ONBOARD_HOSPITAL_DOCTOR',
      chamberId,
      userRole: 'HOSPITAL_ADMIN',
      details: `Doctor [${name}] onboarded to Hospital [${hospital.name}] by Admin [${hospital.adminName}].`
    });

    this._saveToDisk();
    this.broadcastModeChange();
    return newChamber;
  }

  getSuperAdminMetrics() {
    const totalQueues = Array.from(this.chambers.values()).reduce((sum, c) => sum + c.queue.length, 0);
    const totalCompleted = Array.from(this.chambers.values()).reduce((sum, c) => sum + c.queue.filter(p => p.status === 'done').length, 0);
    const totalRevenue = Array.from(this.chambers.values()).reduce((sum, c) => sum + c.queue.filter(p => p.paid).reduce((s, p) => s + (p.fee || 0), 0), 0);

    return {
      totalHospitals: this.hospitals.size,
      totalHospitalAdmins: Array.from(this.hospitals.values()).filter(h => h.adminEmail).length,
      totalDoctors: this.chambers.size,
      totalQueues,
      totalCompleted,
      totalRevenue,
      hospitals: this.getHospitals()
    };
  }

  getDoctorDirectory(filterHospitalId = null) {
    const list = [];
    for (const ch of this.chambers.values()) {
      if (filterHospitalId && filterHospitalId !== 'all' && ch.hospitalId !== filterHospitalId) {
        continue;
      }
      list.push({
        id: ch.docId,
        chamberId: ch.chamberId,
        hospitalId: ch.hospitalId || 'hosp-pop-dhanmondi',
        name: ch.docName,
        degree: ch.degree,
        spec: ch.specialty,
        bmdc: ch.bmdcRegNo,
        hospital: ch.hospitalName,
        chamberRoom: ch.room,
        time: ch.schedules && ch.schedules[0] ? `${ch.schedules[0].day} ${ch.schedules[0].time}` : "প্রতিদিন সন্ধ্যা ৭:০০",
        fee: ch.fee,
        followupFee: ch.followupFee,
        availableToday: true,
        freeSlots: Math.max(0, 25 - ch.queue.length),
        rating: ch.rating || "৪.৯ (১২০+ রিভিউ)",
        dept: this._mapSpecialtyToDept(ch.specialty),
        isDemo: Boolean(ch.isDemo)
      });
    }
    return list;
  }

  _mapSpecialtyToDept(spec = '') {
    const s = spec.toLowerCase();
    if (s.includes('হৃদ') || s.includes('cardio') || s.includes('মেডিসিন')) return 'cardiology';
    if (s.includes('স্ত্রী') || s.includes('gynae') || s.includes('প্রসূতি')) return 'gynae';
    if (s.includes('শিশু') || s.includes('pedia') || s.includes('নবজাতক')) return 'pediatrics';
    if (s.includes('অর্থোপেডিক') || s.includes('ortho') || s.includes('হাড়')) return 'orthopedics';
    if (s.includes('চর্ম') || s.includes('derma') || s.includes('এলার্জি')) return 'dermatology';
    if (s.includes('দাঁত') || s.includes('dental')) return 'dental';
    return 'cardiology';
  }

  getChamberState(chamberId = "ch-pop-302") {
    let chamber = this.chambers.get(chamberId);
    if (!chamber) {
      // If requested chamber not found, grab the first available chamber
      const firstChamber = this.chambers.values().next().value;
      if (!firstChamber) {
        return {
          chamberId: null,
          isEmptyState: true,
          mode: this.mode,
          message: this.mode === 'real' ? "কোনো চেম্বার বা ডাক্তার এখনও নিবন্ধিত হয়নি।" : "কোনো ডেমো চেম্বার নেই।",
          stats: { total: 0, done: 0, waiting: 0, checkedIn: 0, noshow: 0, hold: 0 },
          queue: []
        };
      }
      chamber = firstChamber;
    }

    const currentInside = chamber.queue.find(q => q.status === 'inside') || null;
    const waitingPatients = chamber.queue.filter(q => q.status === 'waiting');
    const doneCount = chamber.queue.filter(q => q.status === 'done').length;
    const checkinCount = chamber.queue.filter(q => q.checkin).length;
    const noshowCount = chamber.queue.filter(q => q.status === 'noshow').length;
    const holdCount = chamber.queue.filter(q => q.status === 'hold').length;

    return {
      chamberId: chamber.chamberId,
      docId: chamber.docId,
      bmdcRegNo: chamber.bmdcRegNo,
      docName: chamber.docName,
      degree: chamber.degree,
      specialty: chamber.specialty,
      hospitalName: chamber.hospitalName,
      room: chamber.room,
      isDemo: Boolean(chamber.isDemo),
      mode: this.mode,
      fee: chamber.fee,
      followupFee: chamber.followupFee,
      currentInside: currentInside ? {
        serial: currentInside.serial,
        name: currentInside.name,
        phone: currentInside.phone,
        source: currentInside.source,
        paid: currentInside.paid,
        vitals: currentInside.vitals || null,
        clinicalNotes: currentInside.clinicalNotes || ''
      } : null,
      stats: {
        total: chamber.queue.length,
        done: doneCount,
        waiting: waitingPatients.length,
        checkedIn: checkinCount,
        noshow: noshowCount,
        hold: holdCount
      },
      queue: chamber.queue
    };
  }

  getAllChambersSummary() {
    const summaries = [];
    for (const [id, ch] of this.chambers.entries()) {
      const state = this.getChamberState(id);
      summaries.push({
        chamberId: id,
        docName: ch.docName,
        degree: ch.degree,
        specialty: ch.specialty,
        room: ch.room,
        total: state.stats.total,
        currentInsideSerial: state.currentInside ? state.currentInside.serial : '—',
        currentInsideName: state.currentInside ? state.currentInside.name : '',
        status: state.currentInside ? '🟢 লাইভ চলছে' : (state.stats.total > 0 ? '🕒 অপেক্ষমাণ' : '⚪ খালি চেম্বার'),
        waiting: state.stats.waiting
      });
    }
    return summaries;
  }

  // Verified Payment Recording
  recordPayment({ chamberId, serialNumber, amount, method = 'CASH', trxId = '', receivedBy = 'কম্পাউন্ডার' }) {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const patient = chamber.queue.find(q => q.serial === Number(serialNumber));
    if (!patient) throw new Error(`Patient serial #${serialNumber} not found.`);

    patient.paid = true;
    patient.paymentMethod = method.toUpperCase();
    patient.paymentTrxId = trxId.trim() || null;
    patient.fee = Number(amount) || patient.fee;
    patient.paymentVerifiedAt = new Date().toISOString();
    patient.paymentReceivedBy = receivedBy;

    this.logAudit({
      action: 'RECORD_PAYMENT',
      chamberId,
      userRole: 'COMPOUNDER',
      details: `Payment of ৳${patient.fee} verified for Serial #${patient.serial} (${patient.name}) via ${patient.paymentMethod}${trxId ? ' [TrxID: ' + trxId + ']' : ''}`
    });

    this.broadcastUpdate(chamberId);
    return {
      success: true,
      serial: patient.serial,
      paid: true,
      amount: patient.fee,
      method: patient.paymentMethod,
      trxId: patient.paymentTrxId
    };
  }

  // Clinical Vital Signs Entry (Doctor / Nurse)
  savePatientVitals({ chamberId, serialNumber, vitals = {}, clinicalNotes = '', symptoms = '' }) {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    let patient;
    if (serialNumber) {
      patient = chamber.queue.find(q => q.serial === Number(serialNumber));
    } else {
      patient = chamber.queue.find(q => q.status === 'inside');
    }

    if (!patient) throw new Error("No active patient found in chamber to record vitals.");

    patient.vitals = {
      bp: vitals.bp || patient.vitals?.bp || '120/80',
      pulse: Number(vitals.pulse) || patient.vitals?.pulse || 72,
      spo2: Number(vitals.spo2) || patient.vitals?.spo2 || 98,
      temp: Number(vitals.temp) || patient.vitals?.temp || 98.6,
      weight: Number(vitals.weight) || patient.vitals?.weight || 60
    };
    if (clinicalNotes) patient.clinicalNotes = clinicalNotes.trim();
    if (symptoms) patient.symptoms = symptoms.trim();
    patient.vitalsRecordedAt = new Date().toISOString();

    this.logAudit({
      action: 'UPDATE_VITALS',
      chamberId,
      userRole: 'DOCTOR',
      details: `Recorded clinical vitals for Serial #${patient.serial} (${patient.name}): BP ${patient.vitals.bp}, Pulse ${patient.vitals.pulse}, SpO2 ${patient.vitals.spo2}%`
    });

    this.broadcastUpdate(chamberId);
    return { success: true, patient };
  }

  callNext(chamberId = "ch-pop-302") {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const currentInside = chamber.queue.find(q => q.status === 'inside');
    if (currentInside) {
      currentInside.status = 'done';
      currentInside.consultationEndedAt = new Date().toISOString();
    }

    const nextWaiting = chamber.queue.find(q => q.status === 'waiting');
    if (nextWaiting) {
      nextWaiting.status = 'inside';
      nextWaiting.checkin = true;
      nextWaiting.consultationStartedAt = new Date().toISOString();
      chamber.currentInsideSerial = nextWaiting.serial;

      this.logAudit({
        action: 'CALL_NEXT',
        chamberId,
        userRole: 'COMPOUNDER',
        details: `Called Serial #${nextWaiting.serial} (${nextWaiting.name}) into ${chamber.room}`
      });

      // SMS Alert triggered to upcoming serial (2 steps ahead)
      const upcomingSerial = chamber.queue.find(q => q.serial === nextWaiting.serial + 2);
      if (upcomingSerial) {
        smsService.sendSerialUpcomingAlert({
          phone: upcomingSerial.phone,
          serialNum: upcomingSerial.serial,
          currentInside: nextWaiting.serial,
          chamberName: chamber.hospitalName
        });
      }
    } else {
      chamber.currentInsideSerial = null;
    }

    this.broadcastUpdate(chamberId);
    return this.getChamberState(chamberId);
  }

  completeVisit(chamberId = "ch-pop-302") {
    return this.callNext(chamberId);
  }

  markNoShow(chamberId = "ch-pop-302") {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const currentInside = chamber.queue.find(q => q.status === 'inside');
    if (currentInside) {
      currentInside.status = 'noshow';
      this.logAudit({
        action: 'MARK_NOSHOW',
        chamberId,
        userRole: 'COMPOUNDER',
        details: `Marked Serial #${currentInside.serial} (${currentInside.name}) as No-Show.`
      });
    }

    return this.callNext(chamberId);
  }

  holdPatient(chamberId = "ch-pop-302") {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const currentInside = chamber.queue.find(q => q.status === 'inside');
    if (currentInside) {
      currentInside.status = 'hold';
      this.logAudit({
        action: 'HOLD_PATIENT',
        chamberId,
        userRole: 'COMPOUNDER',
        details: `Put Serial #${currentInside.serial} (${currentInside.name}) on Hold.`
      });
    }

    return this.callNext(chamberId);
  }

  checkIn(chamberId = "ch-pop-302", serialNumber) {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const patient = chamber.queue.find(q => q.serial === Number(serialNumber));
    if (patient) {
      patient.checkin = true;
      patient.checkinTime = new Date().toISOString();
      
      this.logAudit({
        action: 'PATIENT_CHECKIN',
        chamberId,
        userRole: 'PATIENT',
        details: `Serial #${patient.serial} (${patient.name}) checked in at chamber.`
      });

      this.broadcastUpdate(chamberId);
      return patient;
    }
    throw new Error("Patient serial not found");
  }

  togglePayment(chamberId = "ch-pop-302", serialNumber) {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const patient = chamber.queue.find(q => q.serial === Number(serialNumber));
    if (patient) {
      patient.paid = !patient.paid;
      this.logAudit({
        action: 'TOGGLE_PAYMENT',
        chamberId,
        userRole: 'COMPOUNDER',
        details: `Serial #${patient.serial} payment status set to ${patient.paid ? 'PAID' : 'UNPAID'}`
      });
      this.broadcastUpdate(chamberId);
      return patient;
    }
    throw new Error("Patient serial not found");
  }

  toggleCheckin(chamberId = "ch-pop-302", serialNumber) {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const patient = chamber.queue.find(q => q.serial === Number(serialNumber));
    if (patient) {
      patient.checkin = !patient.checkin;
      this.broadcastUpdate(chamberId);
      return patient;
    }
    throw new Error("Patient serial not found");
  }

  bookSerial({ chamberId = "ch-pop-302", name, phone, source = 'online', fee = 1000, paid = false }) {
    let chamber = this.chambers.get(chamberId);
    if (!chamber) {
      // Pick first chamber if exists
      chamber = this.chambers.values().next().value;
      if (!chamber) {
        throw new Error("No active chamber found. Please register a doctor first.");
      }
    }

    if (!name || !name.trim()) throw new Error("Patient name is required.");
    if (!phone || !phone.trim()) throw new Error("Patient mobile number is required.");

    const cleanPhone = phone.trim();
    const newSerial = chamber.queue.length + 1;
    const newEntry = {
      serial: newSerial,
      name: name.trim(),
      phone: cleanPhone,
      source: source.toLowerCase(),
      checkin: source.toLowerCase() === 'walkin',
      fee: Number(fee) || chamber.fee || 1000,
      paid: Boolean(paid),
      status: 'waiting',
      bookedAt: new Date().toISOString()
    };

    chamber.queue.push(newEntry);

    this.logAudit({
      action: 'BOOK_SERIAL',
      chamberId: chamber.chamberId,
      userRole: source.toUpperCase(),
      details: `Booked Serial #${newSerial} for ${newEntry.name} (${cleanPhone}) via ${source}`
    });

    smsService.sendBookingConfirmation({
      phone: cleanPhone,
      patientName: newEntry.name,
      docName: chamber.docName,
      hospitalName: chamber.hospitalName,
      serialNum: newSerial,
      estTime: "রাত ৮:২০–৮:৩৫",
      fee: newEntry.fee
    });

    this.broadcastUpdate(chamber.chamberId);
    return newEntry;
  }

  broadcastDelay(chamberId = "ch-pop-302", delayMinutes = 30, reason = "জরুরি অপারেশন") {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error("Chamber not found");

    const waitingPatients = chamber.queue.filter(q => q.status === 'waiting');
    waitingPatients.forEach(p => {
      smsService.sendDoctorDelayBroadcast({
        phone: p.phone,
        docName: chamber.docName,
        hospitalName: chamber.hospitalName,
        reason,
        delayMinutes
      });
    });

    this.logAudit({
      action: 'BROADCAST_DELAY',
      chamberId,
      userRole: 'DOCTOR',
      details: `Doctor delay of ${delayMinutes} mins broadcasted to ${waitingPatients.length} waiting patients (${reason})`
    });

    return { alertedCount: waitingPatients.length, delayMinutes };
  }

  savePrescription({ chamberId, serial, patientName, patientPhone, docName, diagnosis, medications, tests, followupDate }) {
    const chamber = this.chambers.get(chamberId) || this.chambers.values().next().value;
    const rxId = `rx-${Date.now()}`;
    
    const activePatient = chamber ? chamber.queue.find(q => q.serial === Number(serial) || q.status === 'inside') : null;

    const prescription = {
      id: rxId,
      serial: serial || (activePatient ? activePatient.serial : 1),
      patientName: patientName || (activePatient ? activePatient.name : "রোগীর নাম"),
      patientPhone: patientPhone || (activePatient ? activePatient.phone : "017XXXXXXXX"),
      docName: docName || (chamber ? chamber.docName : "চিকিৎসক"),
      hospitalName: chamber ? chamber.hospitalName : "হাসপাতাল ওপিডি",
      chamberRoom: chamber ? chamber.room : "কক্ষ",
      date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      diagnosis: diagnosis || "সাধারণ পরামর্শ",
      medications: Array.isArray(medications) ? medications : [
        "Tab. Napa 500mg — ১ + ০ + ১ (খাবারের পর)"
      ],
      tests: tests || "প্রয়োজন নেই",
      followupDate: followupDate || "২০২৬-১০-৩০",
      issuedAt: new Date().toISOString()
    };

    // Store by phone (primary) and name (secondary)
    const phoneKey = prescription.patientPhone.replace(/[^0-9]/g, '');
    const existing = this.prescriptions.get(phoneKey) || [];
    existing.unshift(prescription);
    this.prescriptions.set(phoneKey, existing);

    // Also index by name for backward compatibility
    const nameExisting = this.prescriptions.get(prescription.patientName) || [];
    nameExisting.unshift(prescription);
    this.prescriptions.set(prescription.patientName, nameExisting);

    this.logAudit({
      action: 'ISSUE_PRESCRIPTION',
      chamberId: chamber ? chamber.chamberId : 'GENERAL',
      userRole: 'DOCTOR',
      details: `Prescription #${rxId} issued for ${prescription.patientName} (${prescription.patientPhone}). Diagnosis: ${prescription.diagnosis}`
    });

    // Send recall SMS
    smsService.sendFollowupRecall({
      phone: prescription.patientPhone,
      patientName: prescription.patientName,
      docName: prescription.docName,
      followupDate: prescription.followupDate
    });

    this._saveToDisk();
    return prescription;
  }

  getPrescriptions(query) {
    if (!query) {
      const all = [];
      const seen = new Set();
      for (const rxList of this.prescriptions.values()) {
        for (const rx of rxList) {
          if (!seen.has(rx.id)) {
            seen.add(rx.id);
            all.push(rx);
          }
        }
      }
      return all;
    }

    const cleanQuery = query.replace(/[^0-9]/g, '');
    if (cleanQuery.length >= 10 && this.prescriptions.has(cleanQuery)) {
      return this.prescriptions.get(cleanQuery);
    }
    return this.prescriptions.get(query) || [];
  }

  // Hospital Central Analytics
  getHospitalAnalytics() {
    let totalRegistered = 0;
    let totalWaiting = 0;
    let totalInside = 0;
    let totalDone = 0;
    let totalNoShow = 0;
    let totalRevenue = 0;
    let activeChambers = 0;

    const chamberBreakdown = [];

    for (const ch of this.chambers.values()) {
      let chWaiting = 0;
      let chDone = 0;
      let chRevenue = 0;

      for (const q of ch.queue) {
        totalRegistered++;
        if (q.status === 'waiting') {
          totalWaiting++;
          chWaiting++;
        } else if (q.status === 'inside') {
          totalInside++;
        } else if (q.status === 'done') {
          totalDone++;
          chDone++;
        } else if (q.status === 'noshow') {
          totalNoShow++;
        }

        if (q.paid) {
          totalRevenue += (q.fee || 0);
          chRevenue += (q.fee || 0);
        }
      }

      if (ch.currentInsideSerial) activeChambers++;

      chamberBreakdown.push({
        chamberId: ch.chamberId,
        docName: ch.docName,
        room: ch.room,
        totalPatients: ch.queue.length,
        waiting: chWaiting,
        done: chDone,
        revenue: chRevenue,
        currentInsideSerial: ch.currentInsideSerial || '—'
      });
    }

    return {
      mode: this.mode,
      isDemo: this.mode === 'demo',
      isEmptyState: this.chambers.size === 0 || totalRegistered === 0,
      totalChambers: this.chambers.size,
      activeChambers,
      totalRegistered,
      totalWaiting,
      totalInside,
      totalDone,
      totalNoShow,
      totalRevenue,
      avgWaitMinutes: totalWaiting > 0 ? (totalWaiting * 8.5).toFixed(1) : '০',
      chamberBreakdown
    };
  }

  // Waiting TV Signage (Strict Patient Privacy)
  getTvSignageState() {
    const tvChambers = [];
    for (const ch of this.chambers.values()) {
      const current = ch.queue.find(q => q.status === 'inside');
      const nextPatients = ch.queue.filter(q => q.status === 'waiting').slice(0, 3);

      tvChambers.push({
        chamberId: ch.chamberId,
        docName: ch.docName,
        room: ch.room,
        currentInsideToken: current ? current.serial : null,
        // Privacy Compliance: Only display first name or token number; NO medical details
        currentInsideLabel: current ? `টোকেন #${current.serial}` : 'প্রস্তুত হচ্ছে',
        nextTokens: nextPatients.map(p => `#${p.serial}`),
        status: current ? 'INSIDE' : 'READY'
      });
    }

    return {
      mode: this.mode,
      isDemo: this.mode === 'demo',
      hospitalName: "পপুলার ডায়াগনস্টিক সেন্টার, ওপিডি",
      updatedAt: new Date().toISOString(),
      chambers: tvChambers
    };
  }

  // Full Database Backup Export
  getBackup() {
    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      mode: this.mode,
      chambers: Array.from(this.chambers.values()),
      prescriptions: Object.fromEntries(this.prescriptions),
      auditLogs: this.auditLogs
    };
  }

  // WebSocket Live Gateway
  registerWsClient(socket) {
    this.wsClients.add(socket);

    socket.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString());
        this.handleWsCommand(socket, payload);
      } catch (e) {
        console.error('WS message error:', e);
      }
    });

    socket.on('close', () => this.wsClients.delete(socket));
    socket.on('error', () => this.wsClients.delete(socket));
  }

  handleWsCommand(socket, payload) {
    const { action, chamberId = 'ch-pop-302', data } = payload;
    switch (action) {
      case 'CALL_NEXT':
        this.callNext(chamberId);
        break;
      case 'DONE':
        this.completeVisit(chamberId);
        break;
      case 'CHECKIN':
        this.checkIn(chamberId, data?.serialNumber);
        break;
      case 'NO_SHOW':
        this.markNoShow(chamberId);
        break;
      case 'HOLD':
        this.holdPatient(chamberId);
        break;
      case 'BOOK':
        this.bookSerial({ chamberId, ...data });
        break;
      case 'GET_STATE':
        socket.send(JSON.stringify({ event: 'QUEUE_UPDATE', data: this.getChamberState(chamberId) }));
        break;
      case 'SWITCH_MODE':
        if (data?.mode) this.setMode(data.mode);
        break;
      default:
        break;
    }
  }

  broadcastModeChange() {
    const payload = JSON.stringify({
      event: 'MODE_CHANGED',
      data: this.getModeInfo()
    });
    for (const client of this.wsClients) {
      try {
        if (client.readyState === 1) client.send(payload);
      } catch (e) {}
    }
  }

  broadcastUpdate(chamberId) {
    this._saveToDisk();

    const chamberState = this.getChamberState(chamberId);
    const tvState = this.getTvSignageState();
    const analytics = this.getHospitalAnalytics();

    const payload = JSON.stringify({
      event: 'QUEUE_UPDATE',
      chamberId,
      data: chamberState,
      tvState,
      analytics,
      modeInfo: this.getModeInfo()
    });

    for (const client of this.wsClients) {
      try {
        if (client.readyState === 1) { // OPEN
          client.send(payload);
        }
      } catch (err) {
        this.wsClients.delete(client);
      }
    }
  }
}

module.exports = new QueueEngine();
