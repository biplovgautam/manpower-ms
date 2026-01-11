const twilio = require('twilio');

const sendNepaliSMS = async (phoneNumber, content) => {
    const sid = process.env.TWILIO_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_NUMBER;

    if (!sid || !auth || !from) {
        console.error("❌ SMS Config Missing in .env");
        return false;
    }

    const client = twilio(sid, auth);

    try {
        let cleanNumber = phoneNumber.replace(/\D/g, '').slice(-10);
        const formattedNumber = `+977${cleanNumber}`;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`📱 [SIMULATION] SMS to ${formattedNumber}: ${content}`);
            return true;
        }

        // 🟢 FIX: Wrap the content in a professional header
        // This helps bypass Ncell/NTC spam filters
        const professionalContent = `Manpower MS Alert: ${content}`;

        const message = await client.messages.create({
            body: professionalContent,
            from: from, // Ensure this is your MG... SID if using Messaging Service
            to: formattedNumber
        });

        console.log(`✅ Twilio SMS sent! SID: ${message.sid}`);
        return true;
    } catch (error) {
        console.error('❌ Twilio SMS Error Detail:', error.message);
        return false;
    }
};

module.exports = sendNepaliSMS;