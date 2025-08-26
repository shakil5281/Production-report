import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API called');
    
    const { date, reportData, summary } = await request.json();
    console.log('📊 Data received:', { 
      hasDate: !!date, 
      reportDataLength: reportData?.length, 
      hasSummary: !!summary 
    });

    if (!date || !reportData) {
      console.error('❌ Missing required fields:', { date: !!date, reportData: !!reportData });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'shakilhossen3001@gmail.com';
    const emailToAddress = process.env.EMAIL_TO_ADDRESS || 'shakilhossen3001@gmail.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || 'Production Management System - Shakil';

    if (!emailAppPassword) {
      console.error('❌ EMAIL_APP_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Email configuration is incomplete. Please set EMAIL_APP_PASSWORD environment variable.' },
        { status: 500 }
      );
    }

    console.log('📧 Using email configuration:', {
      from: emailFromAddress,
      to: emailToAddress,
      fromName: emailFromName,
      hasPassword: !!emailAppPassword
    });

    console.log('📧 Creating email transporter...');
    // Create email transporter (using Gmail SMTP with explicit configuration)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailFromAddress,
        pass: emailAppPassword, // Gmail app password from environment
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    console.log('🔐 Verifying email configuration...');
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: `Email configuration error: ${verifyError instanceof Error ? verifyError.message : 'Unknown verification error'}` },
        { status: 500 }
      );
    }

    const dateString = format(new Date(date), 'dd/MM/yyyy');
    const subject = `Daily Production Report (${dateString})`;
    console.log('📧 Email subject:', subject);

    // Generate HTML email content
    console.log('🎨 Generating email HTML...');
    const htmlContent = generateEmailHTML(dateString, reportData, summary);

    const mailOptions = {
      from: {
        name: emailFromName,
        address: emailFromAddress
      },
      to: emailToAddress,
      subject,
      html: htmlContent,
    };

    console.log('📤 Sending email...');
    // Send email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateEmailHTML(dateString: string, reportData: any[], summary: any) {
  // Calculate summary statistics
  const totalProduction = reportData.reduce((sum, row) => sum + (row['DAILY PRODUCTION'] || 0), 0);
  const totalTarget = reportData.reduce((sum, row) => sum + (row['DAILY TARGET'] || 0), 0);
  const totalLines = new Set(reportData.map(row => row['LINE']).filter(Boolean)).size;
  const targetAchievement = totalTarget > 0 ? Math.round((totalProduction / totalTarget) * 100) : 0;
  const totalValue = reportData.reduce((sum, row) => sum + (Number(row['Taka']) || 0), 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Production Report - ${dateString}</title>
      <style>
        /* Reset and base styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          margin: 0;
          padding: 20px;
        }
        
        /* Container */
        .email-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        /* Header */
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .company-logo {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .header h1 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.025em;
        }
        
        .header .subtitle {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
          opacity: 0.95;
        }
        
        .header .date {
          font-size: 18px;
          font-weight: 500;
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 20px;
          border-radius: 25px;
          display: inline-block;
          backdrop-filter: blur(10px);
        }
        
        /* Summary Section */
        .summary-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 30px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .summary-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 25px;
          text-align: center;
          position: relative;
        }
        
        .summary-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #1e40af, #3730a3);
          border-radius: 2px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .summary-item {
          background: white;
          padding: 25px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          text-align: center;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .summary-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1e40af, #3730a3);
        }
        
        .summary-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .summary-icon {
          font-size: 32px;
          margin-bottom: 15px;
          display: block;
        }
        
        .summary-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .summary-value {
          font-size: 28px;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .summary-unit {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        /* Table Section */
        .table-section {
          padding: 30px;
        }
        
        .table-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 20px;
          text-align: center;
          position: relative;
        }
        
        .table-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #1e40af, #3730a3);
          border-radius: 2px;
        }
        
        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          background: white;
          min-width: 800px;
        }
        
        .data-table th {
          background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
          color: white;
          padding: 16px 12px;
          text-align: center;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .data-table th:first-child {
          border-top-left-radius: 12px;
        }
        
        .data-table th:last-child {
          border-top-right-radius: 12px;
        }
        
        .data-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          text-align: center;
          vertical-align: middle;
          font-weight: 500;
        }
        
        .data-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .data-table tr:nth-child(odd) {
          background-color: white;
        }
        
        .data-table tr:hover {
          background-color: #eff6ff;
          transition: background-color 0.2s ease;
        }
        
        .total-row {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
          font-weight: 800;
          color: #000000;
          border-top: 2px solid #d97706;
        }
        
        .total-row td {
          border-bottom: 2px solid #d97706;
          font-weight: 800;
          color: #000000;
        }
        
        /* Cell styling */
        .line-cell { 
          color: #1e40af; 
          font-weight: 700; 
          background-color: #dbeafe;
          border-radius: 6px;
        }
        
        .code-cell { 
          color: #059669; 
          font-weight: 700; 
          background-color: #d1fae5;
          border-radius: 6px;
        }
        
        .buyer-cell { 
          text-align: left; 
          font-weight: 600; 
          background-color: #fef3c7;
          color: #92400e;
          border-radius: 6px;
        }
        
        .qty-cell { 
          color: #7c3aed; 
          font-weight: 700; 
          background-color: #ede9fe;
          border-radius: 6px;
        }
        
        .target-cell { 
          color: #059669; 
          background-color: #d1fae5; 
          font-weight: 600;
          border-radius: 6px;
        }
        
        .production-cell { 
          color: #dc2626; 
          background-color: #fee2e2; 
          font-weight: 600;
          border-radius: 6px;
        }
        
        .price-cell { 
          color: #ea580c; 
          background-color: #fed7aa;
          font-weight: 600;
          border-radius: 6px;
        }
        
        .percentage-cell { 
          color: #1e40af; 
          background-color: #dbeafe; 
          font-weight: 600;
          border-radius: 6px;
        }
        
        .taka-cell { 
          color: #dc2626; 
          font-weight: 800; 
          background-color: #fecaca;
          border-radius: 6px;
        }
        
        /* Footer */
        .footer {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain2" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.05"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.05"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.05"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.05"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain2)"/></svg>');
          opacity: 0.3;
        }
        
        .footer-content {
          position: relative;
          z-index: 1;
        }
        
        .footer h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .footer-info {
          opacity: 0.8;
          margin-top: 15px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .footer-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        
        .footer-stat {
          text-align: center;
        }
        
        .footer-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #fbbf24;
        }
        
        .footer-stat-label {
          font-size: 12px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          
          .email-container {
            border-radius: 12px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 28px;
          }
          
          .header .subtitle {
            font-size: 18px;
          }
          
          .header .date {
            font-size: 16px;
            padding: 6px 16px;
          }
          
          .summary-section {
            padding: 20px;
          }
          
          .summary-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .summary-item {
            padding: 20px 15px;
          }
          
          .summary-value {
            font-size: 24px;
          }
          
          .table-section {
            padding: 20px;
          }
          
          .table-title {
            font-size: 20px;
          }
          
          .data-table {
            font-size: 10px;
          }
          
          .data-table th,
          .data-table td {
            padding: 10px 8px;
          }
          
          .footer {
            padding: 25px 20px;
          }
          
          .footer-stats {
            flex-direction: column;
            gap: 15px;
          }
        }
        
        @media (max-width: 480px) {
          .header h1 {
            font-size: 24px;
          }
          
          .summary-value {
            font-size: 20px;
          }
          
          .data-table {
            font-size: 9px;
          }
          
          .data-table th,
          .data-table td {
            padding: 8px 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <div class="company-logo">🏭</div>
            <h1>EKUSHE FASHIONS LTD</h1>
            <div class="subtitle">Daily Production Report</div>
            <div class="date">📅 ${dateString}</div>
          </div>
        </div>
        
        <div class="summary-section">
          <div class="summary-title">📊 Production Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-icon">🏭</span>
              <div class="summary-label">Total Lines</div>
              <div class="summary-value">${totalLines}</div>
              <div class="summary-unit">Active Lines</div>
            </div>
            
            <div class="summary-item">
              <span class="summary-icon">🎯</span>
              <div class="summary-label">Daily Target</div>
              <div class="summary-value">${totalTarget.toLocaleString()}</div>
              <div class="summary-unit">Units</div>
            </div>
            
            <div class="summary-item">
              <span class="summary-icon">📦</span>
              <div class="summary-label">Production</div>
              <div class="summary-value">${totalProduction.toLocaleString()}</div>
              <div class="summary-unit">Units</div>
            </div>
            
            <div class="summary-item">
              <span class="summary-icon">📈</span>
              <div class="summary-label">Achievement</div>
              <div class="summary-value">${targetAchievement}%</div>
              <div class="summary-unit">Target Met</div>
            </div>
            
            <div class="summary-item">
              <span class="summary-icon">💰</span>
              <div class="summary-label">Total Value</div>
              <div class="summary-value">৳${totalValue.toLocaleString()}</div>
              <div class="summary-unit">BDT</div>
            </div>
          </div>
        </div>
        
        <div class="table-section">
          <div class="table-title">📋 Production Details</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>LINE</th>
                  <th>P/COD</th>
                  <th>BUYER</th>
                  <th>ART/NO</th>
                  <th>OR/QTY</th>
                  <th>ITEM</th>
                  <th>DAILY TARGET</th>
                  <th>DAILY PRODUCTION</th>
                  <th>UNIT PRICE</th>
                  <th>TOTAL PRICE</th>
                  <th>%</th>
                  <th>% DOLLAR</th>
                  <th>TAKA</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map((row: any) => {
                  const isTotal = row['ITEM'] === 'Total';
                  return `
                    <tr class="${isTotal ? 'total-row' : ''}">
                      <td class="line-cell">${row['LINE'] || ''}</td>
                      <td class="code-cell">${row['P/COD'] || ''}</td>
                      <td class="buyer-cell">${row['BUYER'] || ''}</td>
                      <td class="code-cell">${row['ART/NO'] || ''}</td>
                      <td class="qty-cell">${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                      <td class="buyer-cell">${row['ITEM'] || ''}</td>
                      <td class="target-cell">${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                      <td class="production-cell">${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                      <td class="price-cell">$${row['UNIT PRICE'] || ''}</td>
                      <td class="price-cell">$${row['TOTAL PRICE'] || ''}</td>
                      <td class="percentage-cell">${row['%'] || ''}</td>
                      <td class="price-cell">$${row['% Dollar'] || ''}</td>
                      <td class="taka-cell">৳${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                      <td class="buyer-cell">${row['Remarks'] || ''}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <h3>🏭 Production Management System</h3>
            <div class="footer-stats">
              <div class="footer-stat">
                <div class="footer-stat-value">${totalLines}</div>
                <div class="footer-stat-label">Active Lines</div>
              </div>
              <div class="footer-stat">
                <div class="footer-stat-value">${targetAchievement}%</div>
                <div class="footer-stat-label">Target Achievement</div>
              </div>
              <div class="footer-stat">
                <div class="footer-stat-value">৳${totalValue.toLocaleString()}</div>
                <div class="footer-stat-label">Total Value</div>
              </div>
            </div>
            <div class="footer-info">
              <strong>Factory:</strong> Masterbari, Gazipur City, Gazipur<br>
              <strong>Generated:</strong> ${new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Dhaka',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} | Automated Daily Report
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
