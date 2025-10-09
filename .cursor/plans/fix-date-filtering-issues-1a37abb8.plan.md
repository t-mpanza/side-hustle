<!-- 1a37abb8-0455-4327-8418-1a5bfa2224bd ff71bcaa-24c4-4158-a7a9-6b198872ffc0 -->
# Dashboard UI Improvements

## Changes Requested

### 1. Dashboard Metrics Section

**Current:** Shows Total Revenue, Total Profit, and Products count
**New:**

- Remove Total Revenue and Total Profit metrics
- Keep one metric showing "Revenue Today" (or for selected filter period)
- Replace Products count with "Units Sold Today" (respecting the active filter)

**Files to modify:**

- `/home/mint/side-hustle/src/components/Dashboard.tsx` (lines 505-533)

### 2. Product Cards Simplification

**Current:** Shows Selling Price, Profit/Unit, and Units sold
**New:**

- Remove Selling Price
- Remove Profit/Unit
- Add "Revenue from this product" (respecting the active filter)
- Keep Units sold (already respects filter)

**Files to modify:**

- `/home/mint/side-hustle/src/components/ProductCard.tsx` (lines 45-69)
- Need to calculate and pass revenue per product in Dashboard.tsx

### 3. Recent Sales Pagination

**Current:** Shows all recent sales without pagination
**New:**

- Add pagination controls
- Show limited items per page (e.g., 5 sales per page)
- Add Previous/Next buttons or page numbers

**Files to modify:**

- `/home/mint/side-hustle/src/components/Dashboard.tsx` (lines 589-628)

### 4. Product View Modal Color Coding

**Current:** Stock Purchases and Sales History have default styling
**New:**

- Stock Purchases section should have red accent/background
- Sales History section should have green accent/background

**Files to modify:**

- `/home/mint/side-hustle/src/components/ProductView.tsx`

## Implementation Steps

### Step 1: Update Dashboard Metrics

- Calculate total units sold for the filtered period
- Replace the three metrics with two: "Revenue" and "Units Sold"
- Update state management to track these values

### Step 2: Update Product Cards

- Calculate revenue per product in fetchFilteredData function
- Pass revenue to ProductCard component via props
- Update ProductCard interface and rendering
- Remove selling price and profit/unit displays

### Step 3: Add Recent Sales Pagination

- Add state for current page number
- Calculate total pages based on sales count
- Slice sales array to show only current page items
- Add pagination controls UI

### Step 4: Update ProductView Modal Styling

- Add red color classes to Stock Purchases section (bg-red-50, border-red-200, text-red-600)
- Add green color classes to Sales History section (bg-green-50, border-green-200, text-green-600)

## Expected Outcome

After these changes:

- Dashboard focuses on daily revenue and units sold
- Product cards are simpler and show revenue per product
- Recent sales are easier to navigate with pagination
- Modal has better visual distinction between purchases (red) and sales (green)

### To-dos

- [ ] Update fetchFilteredData function in Dashboard.tsx to use full ISO timestamps instead of date-only strings for sales and purchases queries
- [ ] Update fetchTrendsData function in TrendsModal to use full ISO timestamps for all period queries
- [ ] Test all date filters (Today, Yesterday, All Time) and verify units sold counts match the Recent Sales data