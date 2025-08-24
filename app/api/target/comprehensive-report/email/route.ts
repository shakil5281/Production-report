import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email-service';
import { ComprehensiveTargetData, SummaryData } from '@/components/target/types';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Comprehensive Target Report Email API called');
    
    const { date, reportData, summary, timeSlotHeaders, timeSlotTotals, emailOptions } = await request.json();
    console.log('📊 Data received:', { 
      hasDate: !!date, 
      reportDataLength: reportData?.length, 
      hasSummary: !!summary,
      hasTimeSlots: !!timeSlotHeaders?.length,
      hasTimeSlotTotals: !!timeSlotTotals,
      hasEmailOptions: !!emailOptions
    });

    if (!date || !reportData || !summary) {
      console.error('❌ Missing required fields:', { 
        date: !!date, 
        reportData: !!reportData, 
        summary: !!summary 
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    if (!emailAppPassword) {
      console.error('❌ EMAIL_APP_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Email configuration is incomplete. Please set EMAIL_APP_PASSWORD environment variable.' },
        { status: 500 }
      );
    }

    // Initialize email service
    const emailService = new EmailService();
    
    // Send target report email
    const result = await emailService.sendTargetReportEmail({
      date,
      reportData,
      summary,
      timeSlotHeaders,
      timeSlotTotals,
      emailOptions
    });

    if (result.success) {
      console.log('✅ Comprehensive target report email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Comprehensive target report email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error sending comprehensive target report email:', error);
    
    let errorMessage = 'Failed to send comprehensive target report email';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}


