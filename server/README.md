# EthicalHack.ge – სერვერი + ნამდვილი BOG გადახდა

## რას აკეთებს

1. ქმნის გადახდის შეკვეთას საქართველოს ბანკში (BOG Online Payments API)
2. მომხმარებელს გადაამისამართებს უსაფრთხო გადახდის გვერდზე
3. Callback-ით იღებს დადასტურებას და **ხსნის კურსზე წვდომას**
4. აბრუნებს frontend-ს (HTML/CSS/JS)

## სწრაფი გაშვება (დემო, ფული არ იხდება)

```bash
cd server
cp .env.example .env
npm install
npm start
```

გახსენი: http://localhost:3000

## ნამდვილი გადახდა (რეალური ფული)

### 1. BOG merchant

1. გახსენი **ბიზნეს ანგარიში** საქართველოს ბანკში
2. გაააქტიურე **Online Payments / iPay**
3. მიიღე `client_id` და `client_secret`  
   დოკუმენტაცია: https://api.bog.ge/docs/en/payments/introduction

### 2. .env

```env
BOG_CLIENT_ID=შენი_id
BOG_CLIENT_SECRET=შენი_secret
BOG_DEMO_MODE=false
PUBLIC_URL=https://შენი-დომენი.ge
PORT=3000
```

> `PUBLIC_URL` **აუცილებლად HTTPS** უნდა იყოს production-ზე (BOG callback მოითხოვს).

### 3. გაშვება

```bash
npm install
npm start
```

ან PM2 / systemd / Docker ჰოსტინგზე.

### 4. ნაკადი

```
მომხმარებელი → შეძენა → POST /api/bog/create-order
  → BOG ქმნის order-ს → redirect payment.bog.ge
  → გადახდა ბარათით
  → BOG POST /api/bog/callback  (სერვერი: status=paid)
  → მომხმარებელი → payment-success.html
  → დაშბორდზე კურსი ხელმისაწვდომია
```

## API

| Method | Path | აღწერა |
|--------|------|--------|
| POST | `/api/bog/create-order` | შეკვეთის შექმნა |
| POST | `/api/bog/callback` | BOG webhook |
| POST | `/api/bog/confirm` | სტატუსის შემოწმება |
| GET | `/api/access?userId=&courseId=` | წვდომა კურსზე |
| GET | `/api/purchases?userId=` | გადახდილი კურსები |

## უსაფრთხოება

- `client_secret` **მხოლოდ** სერვერზე (`.env`), არასდროს frontend-ში
- Production-ზე გამოიყენე HTTPS
- Callback-ის ვალიდაცია / IP allowlist შეგიძლია მოგვიანებით დაამატო BOG დოკის მიხედვით
