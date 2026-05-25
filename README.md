# Medsathi pharmacy 🏥💊

MediShop Admin is a comprehensive, full-stack **Pharmacy Management System** designed to streamline inventory, billing, sales tracking, and medicine expiry for local pharmacies. Built strictly with modern web technologies, it features a fast, robust, and highly interactive UI that mimics the efficiency of traditional desktop ERPs (like Marg) but within a browser.

**This project showcases advanced capabilities in Next.js App Router, full-stack typed API design, state management, complex printing logic, and robust database modeling.**

---

## 🚀 Key Features

### 1. Point of Sale (POS) / Billing System 🛒
- **Lightning-Fast Autocomplete:** Search for medicines instantly while billing to quickly add them to the cart.
- **Dynamic GST & HSN Support:** Automatically calculates CGST, SGST, and applies the correct HSN codes.
- **Row-Level & Bill-Level Discounts:** Flexibly apply discounts that recalculate totals and grand totals dynamically.
- **A5 Landscape Print Layout:** Generates a pixel-perfect, beautifully structured A5 invoice using advanced CSS printing rules (`@media print`, accurate JavaScript chunking for strict pagination). Spills over neatly if an invoice has more than 13 items.

### 2. Comprehensive Inventory Management 📦
- **Global Medicine Dictionary:** Automatically suggests Medicine Name, Brand, and Composition when adding new stock using a pre-seeded global dictionary, saving massive amounts of manual entry time.
- **Batch & Expiry Tracking:** Tracks medicine stock tightly by Batch Number to seamlessly monitor fast-approaching expiry dates.
- **Granular Pricing:** Supports Strip vs. Tablet-level inventory counting and pricing dynamics to handle split-strip sales.

### 3. Analytics & Sales Reporting 📊
- **Real-Time Dashboard:** Displays Total Revenue, Total Bills, Total Profit, and Low Stock Alerts in beautiful, glanceable metric cards.
- **Revenue Charts:** Built-in visually immersive charts (via Recharts) mapping sales trends over time.
- **Advanced Filtering:** Generate detailed Sales Reports filtered by date ranges. Understand exact buying vs. selling prices for pinpoint profit margin analysis.

### 4. Advanced Security & Authentication 🔒
- **Custom JWT Auth Pipeline:** Secured entirely via Custom JWTs stored in `HttpOnly` cookies. 
- **Next.js Middleware Protection:** Strict routing guards leveraging Next.js `middleware.ts` to ensure unauthenticated users cannot access sensitive dashboard or API routes.

---

## 💻 Tech Stack & Architecture

This project strictly adheres to a modern, type-safe stack:

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for strict full-stack type safety.
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) alongside custom UI components. 
*   **Database:** MongoDB & [Mongoose](https://mongoosejs.com/) (Models: `Bill`, `Medicine`, `GlobalMedicine`, `User`, `Settings`).
*   **Icons & Charts:** [Lucide React](https://lucide.dev/) for iconography, [Recharts](https://recharts.org/) for data visualization.

---

## 🧠 Architectural Highlights for Interviewers

If you are reviewing this code, please take note of the following implemented patterns:

1.  **Strict Print Pagination (`src/app/print/[id]/page.tsx`):**
    Unlike standard web apps that rely on messy `window.print()` outputs, this app intercepts the bill array and uses **JavaScript array chunking** to force exact, repeating A5-sized table structures. The header repeats gracefully on every page, and the final totals component renders *only* on the last page.
2.  **Debounced API Searches (`src/hooks/useDebounce.ts`):**
    Heavy MongoDB autocomplete queries in the Billing and Inventory modules are wrapped in a smart custom debounce hook, minimizing unnecessary network requests and preventing database stress.
3.  **Unified API Layer:**
    The `src/app/api` folder acts as the sole bridge, meaning the Next.js React Server Components and Client Components seamlessly talk to strict RESTful endpoints, validating data gracefully before writing to Mongo.

---

## 🛠 Getting Started

### Prerequisites
Make sure you have Node.js 18+ and a running MongoDB instance.

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd medishop-admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and define the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser. If you don't have an admin user, check `src/app/api/auth/login/route.ts` or set a seeder up to create the first authorized account.
