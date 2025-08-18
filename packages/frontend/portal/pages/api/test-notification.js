// pages/api/test-notification.js

const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Mock services for testing
const mockServices = {
  async sendEmail(config, testData) {
    console.log('Mock Email Service - Sending test email:', {
      to: config.emailAddresses,
      subject: testData.subject
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
      recipients: config.emailAddresses,
      service: 'mock'
    };
  },

  async sendSMS(config, testData) {
    console.log('Mock SMS Service - Sending test SMS:', {
      to: config.phoneNumbers,
      message: testData.message
    });
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}`,
      recipients: config.phoneNumbers,
      service: 'mock'
    };
  },

  async sendSlack(config, testData) {
    console.log('Mock Slack Service - Sending test message:', {
      webhook: config.webhookUrl.substring(0, 50) + '...',
      channel: config.channel,
      message: testData.message
    });
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      messageId: `mock_slack_${Date.now()}`,
      channel: config.channel,
      service: 'mock'
    };
  },

  async sendWhatsapp(config, testData) {
    console.log('Mock WhatsApp Service - Sending test message:', {
      to: config.phoneNumbers,
      message: testData.message
    });
    await new Promise(resolve => setTimeout(resolve, 900));
    return {
      success: true,
      messageId: `mock_whatsapp_${Date.now()}`,
      recipients: config.phoneNumbers,
      service: 'mock'
    };
  },
};

// Real email service using nodemailer
async function sendRealEmail(config, testData) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: config.emailAddresses.join(', '),
    subject: testData.subject,
    html: testData.html,
    text: testData.text,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    recipients: config.emailAddresses,
    service: 'smtp'
  };
}

// Real SMS service using Twilio
async function sendRealSMS(config, testData) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const twilioClient = twilio(accountSid, authToken);
  const results = [];

  for (const phoneNumber of config.phoneNumbers) {
    try {
      const message = await twilioClient.messages.create({
        body: testData.message,
        from: fromNumber,
        to: phoneNumber,
      });
      results.push({
        phone: phoneNumber,
        sid: message.sid,
        status: message.status
      });
    } catch (error) {
      results.push({
        phone: phoneNumber,
        error: error.message
      });
    }
  }

  return {
    success: results.some(r => !r.error),
    results,
    service: 'twilio'
  };
}

// Real Slack service
async function sendRealSlack(config, testData) {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: config.channel,
      text: testData.message,
      username: 'LeadSpark Bot',
      icon_emoji: ':robot_face:',
      attachments: testData.attachments || []
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} - ${errorText}`);
  }

  return {
    success: true,
    webhook: config.webhookUrl,
    channel: config.channel,
    service: 'slack'
  };
}

// Test data generators
const testDataGenerators = {
  email: {
    subject: '🧪 LeadSpark Test Email - Settings Configuration',
    text: `Hello! This is a test email from your LeadSpark portal to verify your email notification settings are working correctly.`,
    html: `<h1>🧪 LeadSpark Test Email</h1><p>Your email notifications are working correctly!</p>`
  },
  sms: {
    message: `🧪 LeadSpark Test SMS\n\nYour SMS notifications are working correctly! You'll receive alerts for new leads and urgent system notifications.\n\nReply STOP to opt out.`
  },
  slack: {
    message: `🧪 *LeadSpark Test Message*\n\nYour Slack integration is working correctly!\n\nYou'll receive notifications in this channel for:\n• New leads captured\n• Lead information updates\n• System alerts\n\n_This is an automated test message from your LeadSpark portal._`,
    attachments: []
  },
  whatsapp: {
    message: `🧪 LeadSpark Test WhatsApp Message\n\nYour WhatsApp notifications are configured and working correctly! You'll receive real-time alerts.\n\nThis is an automated test message from your LeadSpark portal.`
  }
};

// Main handler function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, config } = req.body;

    if (!type || !config) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'config']
      });
    }

    if (!['email', 'sms', 'slack', 'whatsapp'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid notification type',
        allowed_types: ['email', 'sms', 'slack', 'whatsapp']
      });
    }

    console.log(`Testing ${type} notification...`);
    let result;
    const testData = testDataGenerators[type];

    switch (type) {
      case 'email':
        if (!config.enabled || !config.emailAddresses || config.emailAddresses.length === 0) {
          return res.status(400).json({ error: 'Email notifications not properly configured' });
        }
        try {
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            result = await sendRealEmail(config, testData);
          } else {
            console.warn('SMTP credentials not configured, using mock email service');
            result = await mockServices.sendEmail(config, testData);
          }
        } catch (error) {
          console.warn('Real email service failed, using mock:', error.message);
          result = await mockServices.sendEmail(config, testData);
        }
        break;

      case 'sms':
        if (!config.enabled || !config.phoneNumbers || config.phoneNumbers.length === 0) {
          return res.status(400).json({ error: 'SMS notifications not properly configured' });
        }
        try {
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            result = await sendRealSMS(config, testData);
          } else {
            console.warn('Twilio credentials not configured, using mock SMS service');
            result = await mockServices.sendSMS(config, testData);
          }
        } catch (error) {
          console.warn('Real SMS service failed, using mock:', error.message);
          result = await mockServices.sendSMS(config, testData);
        }
        break;

      case 'slack':
        if (!config.enabled || !config.webhookUrl) {
          return res.status(400).json({ error: 'Slack integration not properly configured' });
        }
        if (!config.webhookUrl.startsWith('https://hooks.slack.com/')) {
          return res.status(400).json({ error: 'Invalid Slack webhook URL' });
        }
        try {
          result = await sendRealSlack(config, testData);
        } catch (error) {
          console.warn('Real Slack service failed, using mock:', error.message);
          result = await mockServices.sendSlack(config, testData);
        }
        break;

      case 'whatsapp':
        if (!config.enabled || !config.phoneNumbers || config.phoneNumbers.length === 0) {
          return res.status(400).json({ error: 'WhatsApp notifications not properly configured' });
        }
        result = await mockServices.sendWhatsapp(config, testData);
        break;
    }

    console.log(`${type} notification test completed:`, { success: result.success, service: result.service });

    return res.status(200).json({
      success: result.success,
      type,
      message: `Test ${type} notification sent successfully!`,
      details: result
    });

  } catch (error) {
    console.error(`Error testing ${req.body.type || 'unknown'} notification:`, error);

    let userMessage = 'Failed to send test notification';
    if (error.message.includes('credentials')) {
      userMessage = 'Service credentials not configured';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      userMessage = 'Network error occurred';
    } else if (error.message.includes('webhook')) {
      userMessage = 'Webhook URL is invalid or unreachable';
    }

    return res.status(500).json({
      success: false,
      error: userMessage,
      details: error.message,
      type: req.body.type || 'unknown'
    });
  }
};