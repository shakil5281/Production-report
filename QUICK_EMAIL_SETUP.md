# 🚀 Quick Email Setup Guide
## Updated Email Route with Environment Variables

---

## ✅ **What Changed**

The email API route has been updated to use environment variables for better security and flexibility:

### **Before** (Hardcoded):
```javascript
auth: {
  user: 'shakilhossen3001@gmail.com',
  pass: 'vzohcdgfvdopsrfr', // Hardcoded
}
```

### **After** (Environment Variables):
```javascript
auth: {
  user: process.env.EMAIL_FROM_ADDRESS,
  pass: process.env.EMAIL_APP_PASSWORD, // From environment
}
```

---

## 🔧 **Setup Instructions**

### **Step 1: Create .env file**
Create a `.env` file in your project root with:

```bash
# REQUIRED: Gmail App Password
EMAIL_APP_PASSWORD="vzohcdgfvdopsrfr"

# OPTIONAL: Email addresses (uses defaults if not set)
EMAIL_FROM_ADDRESS="shakilhossen3001@gmail.com"
EMAIL_TO_ADDRESS="shakilhossen3001@gmail.com"
EMAIL_FROM_NAME="Production Management System - Shakil"

# Other required variables
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
```

### **Step 2: Restart Development Server**
```bash
yarn dev
```

### **Step 3: Test Email Functionality**
1. Go to: `http://localhost:3000/daily-production-report`
2. Select a date with production data
3. Click "Send Email" button
4. Check console for detailed logs

---

## 🔍 **Environment Variables Explained**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_APP_PASSWORD` | ✅ **YES** | None | Gmail app password (get from Google Account) |
| `EMAIL_FROM_ADDRESS` | ❌ Optional | `shakilhossen3001@gmail.com` | Sender email address |
| `EMAIL_TO_ADDRESS` | ❌ Optional | `shakilhossen3001@gmail.com` | Recipient email address |
| `EMAIL_FROM_NAME` | ❌ Optional | `Production Management System - Shakil` | Sender display name |

---

## 🛡️ **Security Benefits**

### **✅ Improved Security**
- ✅ No hardcoded passwords in code
- ✅ Environment-specific configuration
- ✅ Easy to change credentials without code updates
- ✅ Better for production deployment

### **🔄 Flexible Configuration**
- ✅ Different email addresses for different environments
- ✅ Easy to switch between Gmail accounts
- ✅ Customizable sender names
- ✅ Environment-specific settings

---

## ⚙️ **API Behavior**

### **With Environment Variables Set**
```json
✅ Success Response:
{
  "success": true,
  "message": "Email sent successfully"
}
```

### **Without EMAIL_APP_PASSWORD**
```json
❌ Error Response:
{
  "success": false,
  "error": "Email configuration is incomplete. Please set EMAIL_APP_PASSWORD environment variable."
}
```

---

## 📊 **Console Logging**

When you send an email, you'll see detailed logs:

```bash
📧 Email API called
📊 Data received: {hasDate: true, reportDataLength: 5, hasSummary: true}
📧 Using email configuration: {
  from: 'shakilhossen3001@gmail.com',
  to: 'shakilhossen3001@gmail.com',
  fromName: 'Production Management System - Shakil',
  hasPassword: true
}
📧 Creating email transporter...
🔐 Verifying email configuration...
✅ Email transporter verified successfully
📧 Email subject: Daily Production Report (18/01/2025)
🎨 Generating email HTML...
📤 Sending email...
✅ Email sent successfully!
```

---

## 🔧 **Troubleshooting**

### **Issue: "EMAIL_APP_PASSWORD environment variable is not set"**
**Solution**: Add `EMAIL_APP_PASSWORD="vzohcdgfvdopsrfr"` to your `.env` file

### **Issue: "Invalid login: 535-5.7.8"**
**Solution**: 
1. Verify the app password is correct
2. Ensure 2FA is enabled on Gmail
3. Generate a new app password if needed

### **Issue: Email not sending**
**Solution**:
1. Check console logs for detailed error messages
2. Verify internet connection
3. Check Gmail account settings

---

## 🎯 **Quick Test**

### **Minimal .env for Testing**
```bash
EMAIL_APP_PASSWORD="vzohcdgfvdopsrfr"
DATABASE_URL="file:./dev.db"
JWT_SECRET="test-secret"
```

### **Test Command**
```bash
# 1. Save .env file
# 2. Restart server
yarn dev

# 3. Test email
# Navigate to: http://localhost:3000/daily-production-report
# Click "Send Email"
```

---

**🎉 Email system is now more secure and flexible!** ✨

The API will automatically fall back to your current email addresses if the optional environment variables are not set, but `EMAIL_APP_PASSWORD` is required for security.
