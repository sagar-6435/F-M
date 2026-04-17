# Offer Pricing Troubleshooting Guide

## Steps to Add Anniversary Offer Prices

### For Cakes:
1. Go to Admin Panel > Pricing Management > **Cakes Tab**
2. Click **Edit** (pencil icon) on any cake
3. You'll see 3 price fields:
   - **Regular Price** (left): Current selling price (always set)
   - **Original Price** (middle): Pre-anniversary price (optional)
   - **Offer Price** (right, GREEN): Anniversary discounted price (optional)

4. To add an offer:
   - Set **Original Price** (e.g., 999)
   - Set **Offer Price** (e.g., 799) - displays in GREEN
   - Leave **Regular Price** as fallback
   - Click **Save**

5. On success: "Cake saved successfully!" alert appears
6. On error: Error message shows what went wrong

### For Decorations:
- Same steps, go to **Decorations Tab**

---

## Debugging Steps (if it's not working)

### 1. Open Browser Console
- Press **F12** or Right-click → **Inspect**
- Go to **Console** tab
- Look for any red error messages

### 2. Check Network Tab
- Go to **Network** tab in browser DevTools
- Click **Save** button while watching Network
- Look for failed requests (red status codes like 400, 401, 500)
- Click on the failed request to see error details

### 3. Check Console Logs
When you click Save, you should see:
```
✅ SHOULD SEE:
- "Saving cake with data: {...with offerPrice...}"
- "Response status: 200 {id: ..., offerPrice: ...}"
```

❌ IF YOU SEE:
- "Response status: 401" → **Not logged in properly**
- "Response status: 400" → **Invalid data sent**
- "Response status: 500" → **Server error (check backend logs)**
- No logs at all → **Browser blocked the request**

### 4. Common Issues

**Issue: "Error: Cannot set offerPrice"**
- ✅ **Solution**: Make sure you're entering a NUMBER, not text
- Clear the field and re-enter the price

**Issue: Saved but offer price doesn't show**
- ✅ **Solution**: Refresh the page (Ctrl+R)
- The data is probably saved but not displayed
- Check console logs to confirm

**Issue: "Unauthorized" or "401 Error"**
- ✅ **Solution**: 
  - Log out and log back in
  - Check password is "admin123"
  - Clear browser cache if still failing

**Issue: Server error (500)**
- ✅ **Solution**: Check backend logs
- Run backend with errors visible
- Verify MongoDB connection if using DB

---

## Expected Behavior

### Before Save:
✅ Input fields show current values (or empty if no offer yet)
✅ Original Price and Offer Price fields are optional
✅ Save button is enabled

### After Save:
✅ Alert says "Cake/Decoration saved successfully!"
✅ List refreshes with new data
✅ Offer price shows in **GREEN** with original price struck through
✅ Check console: Should see successful response with offerPrice field

---

## Data Format Being Sent

When you click Save, this data is sent to the server:

```json
{
  "id": "cake-1234",
  "name": "Classic Chocolate",
  "price": 799,
  "originalPrice": 999,  ← New field for original price
  "offerPrice": 799,     ← New field for offer/discounted price
  "description": "Rich chocolate cake",
  "branch": "branch-1"
}
```

If any field is missing or not a number, note it in error messages.

---

## API Endpoints Used

- **POST /api/cakes** - Create new cake with offer prices
- **PUT /api/cakes/:id** - Update cake with offer prices
- **POST /api/decorations** - Create new decoration with offers
- **PUT /api/decorations/:id** - Update decoration with offers

All endpoints return the saved object with ALL fields including offerPrice.

---

## Quick Test

1. Open Admin Panel
2. Enter `admin123` password
3. Go to Cakes tab
4. Click Edit on first cake
5. Enter offer price in the GREEN field (e.g., 799)
6. Click Save
7. Open **F12 Console** and look for logs
8. Message should appear: "Cake saved successfully!"
9. List should refresh with green offer price

If any of these don't happen → Check console for specific error
