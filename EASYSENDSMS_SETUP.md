# 🚀 EasySendSMS Setup Guide

## ✅ **What You Need to Get from EasySendSMS**

### **Step 1: Login to Your Account**
1. Go to [EasySendSMS](https://www.easysendsms.com)
2. Login with your credentials

### **Step 2: Get Your API Key**
1. **Go to Account Settings**
2. **Find "REST API" section**
3. **Copy your API Key** (looks like: `abc123def456...`)

### **Step 3: Set Your Sender Name**
1. **Choose a sender name** (up to 11 characters)
2. **Recommended**: "TrustElect" or "Election"
3. **Note**: This will appear as the sender in SMS messages

## 🔧 **Environment Variables Setup**

Add these to your `.env` file:

```env
# EasySendSMS Configuration
EASYSENDSMS_API_KEY=your_api_key_here
EASYSENDSMS_SENDER_NAME=TrustElect
```

## 🧪 **Test Your Setup**

### **Test SMS Endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/test-sms
```

### **Check Your Balance:**
```bash
curl -X GET "https://restapi.easysendsms.app/v1/rest/sms/balance" \
  -H "apikey: YOUR_API_KEY"
```

## 💰 **Pricing & Credits**

- ✅ **15 Free SMS** - included in trial
- 💰 **After trial**: Pay-as-you-go pricing
- 💰 **Very affordable** - competitive rates
- 💰 **No monthly fees** - only pay for what you use

## 🎯 **Features Included**

- ✅ **OTP SMS** - perfect for phone verification
- ✅ **Election notifications** - bulk messaging
- ✅ **Delivery reports** - track message status
- ✅ **Philippines coverage** - all major networks
- ✅ **Easy integration** - simple API

## 🚨 **Important Notes**

1. **Phone Number Format**: Use international format (+639123456789)
2. **Sender Name**: Keep it under 11 characters
3. **Message Length**: Standard SMS limits apply
4. **Trial Credits**: Use them wisely for testing

## 🔍 **Troubleshooting**

### **Common Issues:**
- **401 Error**: Check your API key
- **4012 Error**: Invalid phone number format
- **4013 Error**: Insufficient credits

### **Phone Number Format:**
- ✅ **Correct**: +639123456789
- ❌ **Wrong**: 09123456789, 639123456789

## 🎉 **You're Ready!**

Your EasySendSMS integration is complete! You can now:
1. **Send OTP SMS** for phone verification
2. **Send election notifications** to students
3. **Track delivery status** of messages
4. **Use your 15 free credits** for testing

**Need help?** Check the EasySendSMS documentation or contact their support.
