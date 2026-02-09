import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePolicyPDF = (policyData, customerData, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            
            doc.pipe(stream);

            // -- Header --
            // Draw Logo
            drawLogo(doc, 50, 35); // Adjusted Y position

            doc.fillColor('#444444')
               .fontSize(20)
               .text('Insurance Policy Document', 120, 57) // Moved X to 120
               .fontSize(10)
               .text('Insurance CRM Ltd.', 200, 65, { align: 'right' })
               .text('123 Insurance Blvd, Policy City', 200, 80, { align: 'right' });

            doc.moveDown();

            doc.strokeColor("#aaaaaa")
               .lineWidth(1)
               .moveTo(50, 100)
               .lineTo(550, 100)
               .stroke();

            // -- Customer Details --
            doc.fontSize(14).text('Policy Holder Details', 50, 130);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Name: ${customerData.name}`, 50, 150);
            doc.text(`Email: ${customerData.email}`, 50, 165);
            doc.text(`Mobile: ${customerData.mobile || 'N/A'}`, 50, 180);
            doc.text(`Address: ${formatAddress(customerData.address)}`, 50, 195);
            
            doc.moveDown();

            // -- Policy Details --
            doc.fontSize(14).font('Helvetica-Bold').text('Policy Information', 50, 240);
            doc.fontSize(10).font('Helvetica');
            
            doc.text(`Policy Name:`, 50, 260).text(policyData.policyName, 150, 260);
            doc.text(`Policy Type:`, 50, 275).text(policyData.policyType?.name || policyData.policyType || 'N/A', 150, 275);
            doc.text(`Plan Name:`, 50, 290).text(policyData.planName || 'N/A', 150, 290);
            doc.text(`Premium Amount:`, 50, 305).text(`$${policyData.premiumAmount}`, 150, 305);
            doc.text(`Coverage Amount:`, 50, 320).text(`$${policyData.coverageAmount}`, 150, 320);
            doc.text(`Tenure:`, 50, 335).text(`${policyData.tenureValue} ${policyData.tenureUnit}`, 150, 335);
            doc.text(`Purchase Date:`, 50, 350).text(new Date().toLocaleDateString(), 150, 350);
            
            if (policyData.provider) {
                const providerName = policyData.provider.name || policyData.provider;
                doc.text(`Provider:`, 50, 365).text(providerName, 150, 365);
            }

            doc.moveDown(2);
            
            // -- Terms --
            doc.fontSize(14).font('Helvetica-Bold').text('Terms & Conditions', 50, 400);
            doc.fontSize(10).font('Helvetica');
            doc.text('1. This policy is valid for the tenure specified above from the date of purchase.', 50, 420);
            doc.text('2. Claims must be filed within 30 days of the incident.', 50, 435);
            doc.text('3. This document serves as proof of insurance.', 50, 450);

            // -- Footer --
            doc.fontSize(10).text(
                'Thank you for choosing Insurance CRM Ltd. For support, contact support@insurancecrm.com.',
                50,
                700,
                { align: 'center', width: 500 }
            );

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.zipCode,
        address.country
    ].filter(Boolean);
    return parts.join(', ');
};


const drawLogo = (doc, x, y) => {
    doc.save();
    
    // Draw Shield
    doc.translate(x, y);
    doc.scale(2.2); 

    // Shield path - Outline only
    doc.lineWidth(1.5)
       .strokeColor('#2563eb') // Blue color
       .path('M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z')
       .stroke();

    doc.restore();
};

export const generatePaymentReceiptPDF = (paymentData, customerData, policyData, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            
            doc.pipe(stream);

            // -- Header --
            drawLogo(doc, 50, 35);

            doc.fillColor('#444444')
               .fontSize(20)
               .text('Payment Receipt', 120, 57)
               .fontSize(10)
               .text('Insurance CRM Ltd.', 200, 65, { align: 'right' })
               .text('123 Insurance Blvd, Receipt City', 200, 80, { align: 'right' });

            doc.moveDown();

            doc.strokeColor("#aaaaaa")
               .lineWidth(1)
               .moveTo(50, 100)
               .lineTo(550, 100)
               .stroke();

            // -- Receipt Details --
            doc.fontSize(12).font('Helvetica-Bold').text('Receipt Details', 50, 130);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Receipt Number: ${paymentData.paymentId}`, 50, 150);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 165);
            doc.text(`Payment Method: Razorpay`, 50, 180);
            
            doc.moveDown();

            // -- Customer & Policy Details --
            doc.fontSize(12).font('Helvetica-Bold').text('Customer & Policy Details', 50, 220);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Name: ${customerData.name}`, 50, 240);
            doc.text(`Policy: ${policyData.policyName}`, 50, 255);
            doc.text(`Coverage: ${policyData.policyType?.name || policyData.policyType || 'N/A'}`, 50, 270);
            
            doc.moveDown();

            // -- Payment Summary --
            doc.fontSize(12).font('Helvetica-Bold').text('Payment Summary', 50, 310);
            doc.fontSize(10).font('Helvetica');
            
            doc.strokeColor("#eeeeee")
               .lineWidth(1)
               .moveTo(50, 330)
               .lineTo(550, 330)
               .stroke();

            doc.text('Description', 50, 340).text('Amount', 450, 340, { align: 'right' });
            
            doc.strokeColor("#eeeeee")
               .lineWidth(1)
               .moveTo(50, 355)
               .lineTo(550, 355)
               .stroke();

            doc.text(`Premium Payment - ${policyData.policyName}`, 50, 365).text(`INR ${paymentData.amount}`, 450, 365, { align: 'right' });

            doc.moveDown(2);
            
            doc.fontSize(14).font('Helvetica-Bold').text('Total Paid:', 350, 420).text(`INR ${paymentData.amount}`, 450, 420, { align: 'right' });

            // -- Footer --
            doc.fontSize(10).text(
                'This is a computer-generated receipt and does not require a physical signature.',
                50,
                700,
                { align: 'center', width: 500 }
            );

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};
