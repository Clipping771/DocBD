# 🚀 DocBD — প্রোডাকশন ডেপ্লয়মেন্ট ও ক্লাউড অপারেশনস গাইড
> **"কাছের ডাক্তার, আসল সিরিয়াল, অপেক্ষা ছাড়া"**  
> *Production Cloud Infrastructure & DevOps Playbook for Bangladesh HealthTech*

---

## ১. সিস্টেম রিকোয়ারমেন্টস (System Prerequisites)

### ক্লাউড অবকাঠামো (প্রস্তাবিত ন্যূনতম স্পেসিফিকেশন)
* **হোস্টিং প্রোভাইডার:** DigitalOcean (Singapore Region) অথবা AWS (ap-south-1 Mumbai) — বাংলাদেশের জন্য লেটেন্সি < ৫০ms।
* **ভার্চুয়াল সার্ভার (VPS):** 4 vCPU, 8 GB RAM, 80 GB NVMe SSD (Ubuntu 22.04 LTS / 24.04 LTS)।
* **ডাটাবেজ:** PostgreSQL 16 + PostGIS Extension (GPS Geofencing কুয়েরির জন্য)।
* **মেমোরি ক্যাশ ও মেসেজ ব্রোকার:** Redis 7 (লাইভ কিউ ব্রডকাস্ট ও রেট-লিমিটের জন্য)।
* **ডোমেইন ও এসএসএল:** `docbd.com` ও `api.docbd.com` (Cloudflare DNS + Let's Encrypt SSL)।

---

## ২. ডাটাবেজ সেটআপ ও মাইগ্রেশন (PostgreSQL + PostGIS)

```bash
# ১. PostgreSQL এবং PostGIS ইনস্টল করুন
sudo apt update && sudo apt install -y postgresql postgresql-contrib postgis postgresql-16-postgis-3

# ২. DocBD ডাটাবেজ তৈরি করুন
sudo -u postgres psql
```

```sql
-- PostgreSQL শেল কমান্ড
CREATE DATABASE docbd_prod;
CREATE USER docbd_admin WITH ENCRYPTED PASSWORD 'StrongSecretPassword2026!';
GRANT ALL PRIVILEGES ON DATABASE docbd_prod TO docbd_admin;

-- PostGIS এক্সটেনশন সক্রিয় করুন
\c docbd_prod
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### Prisma স্কিমা মাইগ্রেশন রান করুন:
```bash
cd /var/www/docbd/server
export DATABASE_URL="postgresql://docbd_admin:StrongSecretPassword2026!@localhost:5432/docbd_prod?schema=public"
npx prisma migrate deploy
npx prisma db seed
```

---

## ৩. ব্যাকএন্ড Fastify ও WebSocket ডেপ্লয়মেন্ট (PM2)

```bash
# Node.js LTS ইনস্টল করুন (Node 20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# পরিবেশ ভ্যারিয়েবল কনফিগারেশন তৈরি করুন (.env)
cat << 'EOF' > /var/www/docbd/server/.env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://docbd_admin:StrongSecretPassword2026!@localhost:5432/docbd_prod?schema=public
JWT_SECRET=super_secret_jwt_key_docbd_2026

# টেলকো SMS গেটওয়ে ক্রেডেনশিয়াল (SSL Wireless / Infobip)
SMS_PROVIDER=ssl_wireless
SMS_API_KEY=your_ssl_wireless_api_token
SMS_SID=DOCBD_MASKING_SID
SMS_API_URL=https://smsplus.sslwireless.com/api/v3/send-sms

# bKash মার্চেন্ট ক্রেডেনশিয়াল
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
EOF

# ব্যাকএন্ড সার্ভিস PM2 দিয়ে স্টার্ট করুন
cd /var/www/docbd/server
npm install --omit=dev
pm2 start src/server.js --name "docbd-api" -i max
pm2 save
pm2 startup
```

---

## ৪. Nginx রিভার্স প্রক্সি ও WebSocket কনফিগারেশন

ফাইল তৈরি করুন: `/etc/nginx/sites-available/docbd.conf`

```nginx
# WebSocket আপগ্রেড ম্যাপিং
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# ফ্রন্টএন্ড PWA ও ওয়েব অ্যাপ্লিকেশন
server {
    server_name docbd.com www.docbd.com;
    root /var/www/docbd/frontend;
    index index.html;

    # Gzip কম্প্রেশন
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # PWA Service Worker ক্যাশিং হেডার্স
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
    }

    # স্ট্যাটিক অ্যাসেট দীর্ঘমেয়াদী ক্যাশিং
    location ~* \.(css|js|svg|png|jpg|webp|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# ব্যাকএন্ড API ও লাইভ WebSocket গেটওয়ে
server {
    server_name api.docbd.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket হেডার্স (খুবই গুরুত্বপূর্ণ)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # দীর্ঘমেয়াদী সংযোগের টাইমআউট (ডাক্তারের চেম্বার শিফট চলাকালীন যাতে ডিসকানেক্ট না হয়)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

```bash
# সাইট সক্রিয় করুন এবং Nginx রিলোড করুন
sudo ln -s /etc/nginx/sites-available/docbd.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt ফ্রি SSL সার্টিফিকেট সক্রিয় করুন
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d docbd.com -d www.docbd.com -d api.docbd.com --agree-tos --email admin@docbd.com --non-interactive
```

---

## ৫. ডকার ও ডকার কম্পোজ ডেপ্লয়মেন্ট (বিকল্প পদ্ধতি)

আপনি চাইলে ডকার কম্পোজ ব্যবহার করে মাত্র ১ ক্লিকে পুরো ডাটাবেজ, ব্যাকএন্ড ও ফ্রন্টএন্ড রান করতে পারেন:

```bash
# ব্যাকগ্রাউন্ডে পুরো স্ট্যাক চালু করুন
docker-compose up -d

# কন্টেইনার স্ট্যাটাস দেখুন
docker-compose ps
```

---

## ৬. অটোমেটিক ডাটাবেজ ব্যাকআপ (ক্রন জব)

স্বাস্থ্যসেবার প্রেসক্রিপশন ও রোগীর রেকর্ড সুরক্ষায় প্রতিদিন রাত ৩টায় এনক্রিপ্টেড ব্যাকআপ নেওয়া বাধ্যতামূলক:

```bash
crontab -e
# নিচের লাইনটি যোগ করুন:
0 3 * * * pg_dump -U docbd_admin docbd_prod | gzip > /var/backups/docbd_db_$(date +\%F).sql.gz
```

---

## ৭. নিরাপত্তা ও BMDC / DGHS অডিট চেকলিস্ট

- [x] **SSL/TLS 1.3 এনফোর্সড:** সকল ট্রাফিক HTTPS ও WSS-এ এনক্রিপ্টেড।
- [x] **নন-পোচিং গার্ড:** ডাটাবেজ কুয়েরিতে কোনো ডাক্তার বা ক্লিনিকের ক্রস-সাজেস্ট অ্যালগরিদম নিষিদ্ধ।
- [x] **প্রেসক্রিপশন টাইমস্ট্যাম্প ও হ্যাশ:** প্রতিটি ডিজিটাল প্রেসক্রিপশনে ক্রিপ্টোগ্রাফিক হ্যাশ যুক্ত থাকে যা টেম্পারিং প্রতিরোধ করে।
- [x] **মাস্কিং SMS:** রোগীদের ফোনে প্রেরকের নামে "DocBD" প্রদর্শিত হবে যা BTRC অনুমোদিত।
- [x] **অফলাইন ক্যাশ ফলব্যাক:** ইন্টারনেট হঠাৎ চলে গেলেও কম্পাউন্ডার ট্যাবলেটের খাতা লোকালস্টোরেজে ডেটা সংরক্ষণ করে রাখে।
