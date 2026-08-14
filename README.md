# Pocket Ledger

# Expense Management Mobile Application

Build a modern, polished **mobile expense management application** similar in concept to apps like Wallet.

This must be designed as a **mobile application first**, not as a responsive website or desktop dashboard.

The entire UX should be optimized for smartphone screens, touch interaction, portrait orientation, mobile navigation, and mobile-sized components.

Do not add features outside the scope specified below.

---

# 1. Core Concept

The app allows a user to:

* Create and manage multiple financial accounts

* Record expenses, income, and transfers

* Organize transactions into categories and subcategories

* Set budgets

* Track recurring transactions and upcoming payments

* View spending insights and trends

* Search and filter transactions

* Generate financial reports

The application should be designed primarily for personal use, with a clean and polished mobile interface.

## Account-Based Views

The application must support two viewing modes:

* **All Accounts**

* **Individual Account**

For pages containing financial summaries, charts, insights, or reports, default to:

**All Accounts**

At the top of relevant screens, provide a compact mobile-friendly **Account dropdown/selector**.

Example:

`All Accounts ▼`

When the user selects an account, all relevant information on that screen should immediately update to show only that account.

For example, selecting **HDFC Savings** should cause:

* Balance

* Income

* Expenses

* Savings

* Category breakdown

* Transactions

* Insights

* Budget information

* Charts

to use only HDFC Savings data.

Do not duplicate pages for each account. Use the account selector to change the data scope.

---

# 2. Main Navigation

This is a **mobile application**, so do NOT use a desktop sidebar.

Use a **bottom navigation bar** optimized for smartphones.

Main sections:

* Dashboard

* Accounts

* Transactions

* Insights

* More

The **More** section can contain:

* Budgets

* Recurring

* Reports

* Settings

Keep the primary navigation limited so it remains comfortable to use with one hand.

Use mobile-friendly icons with short labels.

---

# 3. Dashboard

Create a mobile dashboard that gives the user an immediate overview of their finances.

The dashboard must fit naturally on a smartphone screen and should not look like a desktop dashboard squeezed into mobile dimensions.

## Top Section

At the top show:

**All Accounts ▼**

and the currently selected time period.

Default account:

**All Accounts**

---

## Summary Cards

Display:

* Total Balance

* Total Income

* Total Expenses

* Savings

Do NOT use excessively large numbers or oversized cards.

The previous design had very large fonts and took up too much screen space.

Use compact cards that allow multiple important pieces of information to be visible without excessive scrolling.

A horizontal scrollable row of compact summary cards is acceptable if necessary.

---

## Period Selector

Allow the user to select:

* This week

* Last 7 days

* This month

* Last month

* This year

* Custom range

Use a mobile-friendly dropdown, segmented control, or bottom-sheet selector.

---

## Spending Overview

Show spending over time using a compact chart optimized for mobile.

The chart should update according to:

* Selected account

* Selected period

Do not make the chart unnecessarily tall.

---

## Category Breakdown

Show spending by category using a compact donut/pie chart and/or category list.

Example:

* Food

* Transportation

* Shopping

* Bills

* Entertainment

* Education

* Health

* Other

Show the amount and percentage for each category.

### Category Drill-Down

When the user taps a category, show its subcategory breakdown **in the same section/screen**.

Example:

**Food**

* Groceries ₹2,500

* Restaurants ₹1,800

* Fast Food ₹900

* Delivery ₹700

* Cafes ₹400

The selected category should become the focus of the section.

When the user taps another category, replace the previous subcategory breakdown with the newly selected category.

Provide a simple:

**← All Categories**

control to return to the category overview.

Do not display every subcategory at once.

This interaction should feel natural on a touchscreen.

---

## Recent Transactions

Show a compact list of recent transactions.

Each transaction should show:

* Category icon

* Description

* Account

* Date

* Amount

* Income/expense indicator

Include:

**View All**

at the bottom.

Use mobile-friendly transaction rows with enough spacing for comfortable tapping.

---

## Budget Overview

Show a compact overview of current budget usage and remaining amount.

Do not allow this section to dominate the screen.

---

# 4. Accounts

Create an Accounts screen optimized for mobile.

Show accounts as compact cards or list items.

Examples:

* HDFC Savings ₹72,450

* Cash ₹4,500

* Google Pay ₹2,300

Each account should contain:

* Account name

* Account type

* Opening balance

* Current balance

* Currency

* Icon/color

* Active/inactive status

## Account Details

Tapping an account opens its account details screen.

Show:

* Current balance

* Income

* Expenses

* Spending chart

* Transaction history

Allow users to:

* Add account

* Edit account

* Archive account

* Delete account

Use mobile-friendly forms and bottom sheets/modals where appropriate.

---

# 5. Transactions

This is the core feature.

Create three transaction types:

* Expense

* Income

* Transfer

Transfers must NOT be counted as income or expenses.

## Transaction Fields

Keep the transaction model minimal.

Only use:

* ID

* Account

* Category

* Amount

* Type

* Date

* Description

Do NOT add:

* Merchant

* Tags

* Attachments

* Receipt images

* Notes

* Currency per transaction

* Transaction-specific recurring flag

---

# 6. Categories and Subcategories

Support hierarchical categories using a `parent_id` structure.

Example:

### Food

* Groceries

* Restaurants

* Fast Food

* Delivery

* Cafes

### Transportation

* Fuel

* Public Transport

* Taxi/Ride Sharing

* Parking

* Maintenance

### Housing

* Rent

* Electricity

* Water

* Internet

* Maintenance

### Shopping

* Clothing

* Electronics

* Household

* Gifts

### Entertainment

* Movies

* Games

* Streaming

* Events

### Education

* Courses

* Books

* College

* Supplies

### Health

* Medicine

* Doctor

* Gym

### Other

Allow users to:

* Create categories

* Create subcategories

* Edit categories

* Delete categories

* Choose category icons

Provide sensible default categories.

---

# 7. Budgets

Users can create:

* Monthly budgets

* Weekly budgets

* Category-specific budgets

Example:

**Food**

Budget: ₹8,000

Spent: ₹5,600

Remaining: ₹2,400

Use compact progress indicators.

Budget states:

* Below 75%: Normal

* 75-100%: Warning

* Above 100%: Exceeded

Keep budgeting simple.

Budgets must respect the selected account where applicable.

---

# 8. Recurring Transactions

Allow users to create recurring transactions.

Examples:

* Salary

* Rent

* Netflix

* Spotify

* Internet bill

* Gym membership

Fields:

* Description

* Amount

* Type

* Account

* Category

* Frequency

* Start date

* Next occurrence

* End date

Supported frequencies:

* Daily

* Weekly

* Monthly

* Yearly

Show upcoming recurring transactions in a mobile-friendly list.

---

# 9. Upcoming Payments

Show upcoming recurring payments.

Example:

**Upcoming**

12 Aug

Netflix · ₹649

15 Aug

Rent · ₹15,000

20 Aug

Internet · ₹999

Use compact mobile list rows.

---

# 10. Insights

Create a dedicated **mobile Insights screen**.

The Insights screen should provide deeper financial analysis than the Dashboard.

## Account Selector

At the top:

**All Accounts ▼**

Options:

* All Accounts

* Individual accounts

Default:

**All Accounts**

Changing the account must update all applicable insights.

---

## Time Range

Allow:

* Last 7 days

* Last 30 days

* Current month

* Previous month

* Current year

* Custom date range

Use a mobile-friendly selector.

---

## Insight Summary

Show compact insight cards for:

* Total spending

* Average daily spending

* Average monthly spending where applicable

* Highest spending day

* Highest spending category

* Largest transaction

* Total income

* Total savings

* Savings rate

Do NOT use huge fonts or oversized cards.

The user should be able to see several insights without excessive scrolling.

---

# 11. Category Breakdown on Insights

The same category breakdown available on the Dashboard must also appear on the Insights screen.

It must support:

* Account selection

* Time range selection

* Category amounts

* Category percentages

* Category budgets

* Budget status

### Category → Subcategory Interaction

Tapping a category should display its subcategory breakdown in the same section.

Example:

**Food ₹7,250**

Then:

* Groceries ₹2,500

* Restaurants ₹1,800

* Fast Food ₹900

* Delivery ₹700

* Cafes ₹400

Tapping another category replaces the current subcategory view.

---

# 12. Monthly Comparison

Show monthly spending trends using a compact mobile chart.

Allow horizontal scrolling if required for many months.

---

# 13. Income vs Expenses

Do NOT use a bar graph.

Use a **two-line chart** instead:

* Income

* Expenses

Show how income and expenses change over time.

The chart must respect:

* Selected account

* Selected time range

Keep the chart compact and readable on a smartphone.

---

# 14. Savings

Calculate:

**Savings = Income - Expenses**

And:

**Savings Rate = Savings / Income × 100**

Transfers must never affect savings.

---

# 15. Projected End-of-Month Spending

Add a **Projected Spending** section to Insights.

The application should estimate total spending at the end of the current month based on the user's current spending rate.

Calculate:

**Average Daily Spending = Current Spending / Elapsed Days**

Then:

**Projected Monthly Spending = Average Daily Spending × Total Days in Month**

Display:

* Spent so far

* Current daily spending rate

* Projected end-of-month spending

* Monthly budget

* Expected remaining amount

Keep this section compact.

---

# 16. Projected Spending Graph

Add a compact graph showing:

* Actual spending up to today

* Projected spending from today until the end of the month

Clearly distinguish actual and projected portions.

The graph should show the expected end-of-month total.

Do not make the graph excessively tall on mobile.

---

# 17. Overall Budget Projection

If a monthly budget exists, compare projected spending against the budget.

### Under Budget

Example:

**Projected ₹28,000**

Budget: ₹35,000

**₹7,000 under budget**

### Over Budget

Example:

**Projected ₹42,000**

Budget: ₹35,000

**₹7,000 over budget**

Show a clear status indicator.

The result must update according to the selected account.

---

# 18. Category Budget Indicators

For every category that has a budget, show a **simple indicator**, not another graph.

Example:

### Food

₹5,600 / ₹8,000

🟢 **On track**

Projected to stay under budget.

### Shopping

₹7,200 / ₹8,000

🔴 **Projected over budget**

### Transportation

₹2,800 / ₹5,000

🟢 **Projected under budget**

Use three states:

* 🟢 Under budget / On track

* 🟡 Close to budget

* 🔴 Projected to exceed budget

Calculate this using the current spending rate.

For example:

**Projected Category Spending = Current Category Spending / Elapsed Budget Days × Total Budget Period Days**

Compare this against the category budget.

Do not show this indicator for categories without a budget.

Support both weekly and monthly budgets.

---

# 19. Search and Filters

Create a mobile-friendly transaction search screen.

Search by description.

Filters:

* Account

* Transaction type

* Category

* Subcategory

* Date range

* Minimum amount

* Maximum amount

Allow multiple filters simultaneously.

Use mobile filter controls such as:

* Filter button

* Bottom sheet

* Dropdowns

* Date picker

Example:

**Food + HDFC + August + Expenses**

shows only matching transactions.

---

# 20. Reports

Create a Reports section accessible from **More**.

Reports should support:

**All Accounts ▼**

or an individual account.

## Monthly Report

Include:

* Total income

* Total expenses

* Savings

* Savings rate

* Category breakdown

* Account breakdown

* Daily spending

* Top spending categories

## Yearly Report

Include:

* Monthly income

* Monthly expenses

* Monthly savings

* Category totals

* Year-over-year trends where data allows

## Category Report

Show spending for a selected category over time.

Allow viewing its subcategory breakdown.

## Account Report

Show:

* Income

* Expenses

* Balance changes

* Spending trends

Allow PDF or CSV export where practical.

Exports can use mobile-friendly share/download functionality.

---

# 21. Settings

Keep Settings simple.

Include:

* Currency

* Theme

* Default account

* Default categories

* Account management

* Category management

* Data export

* Data import

* Delete account/data

Do not add unnecessary profile/social features.

---

# 22. Light / Dark Mode

Provide a clear **Light / Dark mode toggle**.

The selected theme must apply to the entire mobile application.

Update:

* Navigation

* Dashboard

* Accounts

* Transactions

* Budgets

* Recurring

* Insights

* Reports

* Settings

* Modals

* Forms

* Charts

* Tables

The dark mode should be intentionally designed as a dark mobile UI.

Do not simply invert colors.

Ensure:

* Good text contrast

* Readable charts

* Readable inputs

* Proper card contrast

* Clear navigation

* Consistent income/expense colors

Persist the selected theme between app sessions.

---

# 23. Add Transaction UX

The Add Transaction action should be easily accessible from the mobile interface.

Use a prominent **+ / Add Transaction** button, preferably as a floating action button or another natural mobile pattern.

When tapped, open a mobile-friendly transaction form.

First select:

**Expense | Income | Transfer**

## Expense

* Amount

* Account

* Category

* Subcategory

* Date

* Description

## Income

* Amount

* Account

* Category

* Date

* Description

## Transfer

* Amount

* From Account

* To Account

* Date

* Description

Validate all required fields.

Do not allow transferring money from an account to itself.

Use touch-friendly inputs and controls.

---

# 24. Important Financial Logic

## Account Balance

**Opening Balance + Income - Expenses + Transfers In - Transfers Out**

## Total Balance

Sum of all active account balances.

## Expenses

Only transactions with type `expense`.

## Income

Only transactions with type `income`.

## Transfers

Never include transfers in income or expense statistics.

## Savings

**Income - Expenses**

Transfers must never affect savings.

## Account Filtering

When an individual account is selected:

* Show only that account's transactions

* Show only that account's income

* Show only that account's expenses

* Calculate category breakdown from that account

* Calculate insights from that account

* Calculate applicable budgets from that account

* Calculate projections from that account

When **All Accounts** is selected, aggregate data across all accounts.

Use decimal/numeric database types appropriate for monetary values.

Never use floating-point types for financial amounts.

---

# 25. Mobile Design Requirements

This is one of the most important requirements.

The application must be designed as a **true mobile application**.

Do NOT create a desktop website and simply make it responsive.

Optimize specifically for:

* Smartphone screens

* Portrait orientation

* Touch interaction

* One-handed usage

* Mobile scrolling

* Bottom navigation

* Mobile modals

* Bottom sheets

* Mobile date pickers

* Touch-friendly buttons

* Touch-friendly transaction rows

Use appropriate mobile spacing and typography.

Avoid:

* Desktop sidebars

* Desktop-sized tables

* Huge dashboard cards

* Excessively wide charts

* Tiny buttons

* Hover-dependent interactions

* Desktop-first layouts

Charts should resize naturally to the phone screen.

Tables should become mobile cards/lists where necessary rather than forcing horizontal desktop tables everywhere.

Forms should use large enough touch targets.

---

# 26. Database Design

Use a relational database.

## users

* id

* name

* email

* password/auth information

* created_at

## accounts

* id

* user_id

* name

* type

* opening_balance

* currency

* icon

* color

* is_active

* created_at

## categories

* id

* user_id

* name

* parent_id

* icon

* created_at

`parent_id` should support category/subcategory relationships.

## transactions

* id

* user_id

* account_id

* category_id

* amount

* type

* date

* description

* created_at

Transaction type:

* expense

* income

* transfer

For transfers, correctly track source and destination accounts.

If necessary, use a separate transfer relationship/table.

## budgets

* id

* user_id

* category_id

* amount

* period

* start_date

* end_date

* created_at

Support an account relationship where required for correct account-specific budget analysis.

## recurring_transactions

* id

* user_id

* account_id

* category_id

* amount

* type

* description

* frequency

* start_date

* next_occurrence

* end_date

* is_active

Use proper foreign keys and indexes.

---

# 27. Seed / Demo Data

Create realistic sample data.

Include:

* Several accounts

* Multiple categories

* Subcategories

* Several months of transactions

* Income

* Expenses

* Transfers

* Budgets

* Recurring transactions

The sample data should demonstrate:

* Account switching

* Category drill-down

* Subcategory analysis

* Budget tracking

* Budget projections

* Under/over-budget indicators

* Income vs expenses

* Projected monthly spending

* Insights

* Reports

Make it obvious that the data is demo data.

---

# 28. Development Requirements

Build the application with a clean, maintainable architecture.

Prioritize:

* Correct financial calculations

* Correct account relationships

* Account-specific filtering

* Accurate projections

* Clean database structure

* Mobile-first UI

* Fast dashboard/insight queries

* Good form validation

* Reusable components

* Secure authentication and authorization

* Persistent theme selection

* Responsive mobile charts

Every user's financial data must be isolated from other users.

Do not expose database credentials or secrets in frontend code.

Do not implement:

* Banking integrations

* Investment tracking

* AI financial advice

* Receipt scanning

* Split expenses

* Net-worth tracking

* Other features outside this specification

Build this as a focused **personal expense management mobile application**, not a full banking application and not a desktop web dashboard.

---

# Final Mobile UX Flow

The core experience should feel like this:

**Dashboard**

→ See compact financial summary

→ Select **All Accounts** or a specific account

→ Select time period

→ See spending overview

→ Tap a category

→ See its subcategories

→ Tap another category to switch the breakdown

→ Check budget status

→ View recent transactions

**Insights**

→ Select account

→ Select time range

→ See compact statistics

→ Explore category/subcategory spending

→ View income vs expenses line chart

→ View projected end-of-month spending

→ See overall budget projection

→ See individual category under/over-budget indicators

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/53a502be-df4b-4ba9-a1c1-7b2b8e84fab4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Building the Android APK

1. Push this project to GitHub (Lovable → GitHub sync).
2. Open the repo → **Actions** → **Build Android APK** → **Run workflow**.
3. Choose `debug` (installable right away) or `release-unsigned`, then run.
4. When it finishes, download the **pocket-ledger-apk-debug** artifact, unzip it, and copy the `.apk` to your phone.
5. On the phone, allow "Install unknown apps" for your file manager, then tap the APK.

The workflow builds the Capacitor web bundle (`npm run build:mobile`), generates the Android project, and compiles with the Gradle wrapper. Backend credentials come from the committed `.env`, or from repo secrets `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` if `.env` is absent.

## Build an APK that loads the live web app

If the bundled-offline APK misbehaves, use **Actions → Build Android APK (Web/Remote) → Run workflow**.
Enter your published app URL (e.g. `https://your-app.lovable.app`) and pick `debug`.
The generated APK is a thin native shell that loads the live site, so it always
matches the deployed web version and avoids bundled-asset issues.
