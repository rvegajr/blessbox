/**
 * Email Service Implementation
 * 
 * Real email service using nodemailer for sending verification emails
 * and other email notifications
 */

import nodemailer from 'nodemailer'
import { z } from 'zod'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface VerificationEmailData {
  email: string
  verificationCode: string
  organizationName: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const html = this.generateVerificationEmailHTML(data)
      const text = this.generateVerificationEmailText(data)

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: data.email,
        subject: `Verify your BlessBox account - ${data.organizationName}`,
        html,
        text
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending verification email:', error)
      return { 
        success: false, 
        error: 'Failed to send verification email' 
      }
    }
  }

  async sendWelcomeEmail(email: string, organizationName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const html = this.generateWelcomeEmailHTML(organizationName)
      const text = this.generateWelcomeEmailText(organizationName)

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: `Welcome to BlessBox - ${organizationName}`,
        html,
        text
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { 
        success: false, 
        error: 'Failed to send welcome email' 
      }
    }
  }

  async sendRegistrationNotification(email: string, registrationData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const html = this.generateRegistrationNotificationHTML(registrationData)
      const text = this.generateRegistrationNotificationText(registrationData)

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'New Registration Received',
        html,
        text
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending registration notification:', error)
      return { 
        success: false, 
        error: 'Failed to send registration notification' 
      }
    }
  }

  private generateVerificationEmailHTML(data: VerificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your BlessBox Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .code { font-size: 24px; font-weight: bold; color: #3b82f6; text-align: center; padding: 20px; background: white; border: 2px dashed #3b82f6; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your BlessBox Account</h1>
            </div>
            <div class="content">
              <h2>Welcome to BlessBox, ${data.organizationName}!</h2>
              <p>Thank you for setting up your BlessBox account. To complete your registration, please verify your email address using the code below:</p>
              
              <div class="code">${data.verificationCode}</div>
              
              <p>This verification code will expire in 10 minutes. If you didn't create a BlessBox account, please ignore this email.</p>
              
              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Create custom registration forms</li>
                <li>Generate QR codes for your events</li>
                <li>Track registrations and analytics</li>
                <li>Manage your organization settings</li>
              </ul>
            </div>
            <div class="footer">
              <p>This email was sent by BlessBox. If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateVerificationEmailText(data: VerificationEmailData): string {
    return `
      Verify Your BlessBox Account

      Welcome to BlessBox, ${data.organizationName}!

      Thank you for setting up your BlessBox account. To complete your registration, please verify your email address using the code below:

      Verification Code: ${data.verificationCode}

      This verification code will expire in 10 minutes. If you didn't create a BlessBox account, please ignore this email.

      Once verified, you'll be able to:
      - Create custom registration forms
      - Generate QR codes for your events
      - Track registrations and analytics
      - Manage your organization settings

      This email was sent by BlessBox. If you have any questions, please contact our support team.
    `
  }

  private generateWelcomeEmailHTML(organizationName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to BlessBox</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .cta { text-align: center; margin: 30px 0; }
            .cta a { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to BlessBox!</h1>
            </div>
            <div class="content">
              <h2>Your account is ready, ${organizationName}!</h2>
              <p>Congratulations! Your BlessBox account has been successfully verified and is ready to use.</p>
              
              <p>You can now:</p>
              <ul>
                <li>✅ Create custom registration forms</li>
                <li>✅ Generate QR codes for your events</li>
                <li>✅ Track registrations and analytics</li>
                <li>✅ Manage your organization settings</li>
              </ul>
              
              <div class="cta">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:7777'}/dashboard">Access Your Dashboard</a>
              </div>
              
              <p>Need help getting started? Check out our <a href="#">getting started guide</a> or contact our support team.</p>
            </div>
            <div class="footer">
              <p>This email was sent by BlessBox. If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateWelcomeEmailText(organizationName: string): string {
    return `
      Welcome to BlessBox!

      Your account is ready, ${organizationName}!

      Congratulations! Your BlessBox account has been successfully verified and is ready to use.

      You can now:
      ✅ Create custom registration forms
      ✅ Generate QR codes for your events
      ✅ Track registrations and analytics
      ✅ Manage your organization settings

      Access your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:7777'}/dashboard

      Need help getting started? Check out our getting started guide or contact our support team.

      This email was sent by BlessBox. If you have any questions, please contact our support team.
    `
  }

  private generateRegistrationNotificationHTML(registrationData: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Registration Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .registration-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 New Registration Received</h1>
            </div>
            <div class="content">
              <h2>You have a new registration!</h2>
              <p>A new person has registered through your QR code.</p>
              
              <div class="registration-details">
                <h3>Registration Details:</h3>
                <pre>${JSON.stringify(registrationData, null, 2)}</pre>
              </div>
              
              <p>You can view all registrations in your <a href="${process.env.NEXTAUTH_URL || 'http://localhost:7777'}/dashboard">dashboard</a>.</p>
            </div>
            <div class="footer">
              <p>This email was sent by BlessBox. If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateRegistrationNotificationText(registrationData: any): string {
    return `
      New Registration Received

      You have a new registration!

      A new person has registered through your QR code.

      Registration Details:
      ${JSON.stringify(registrationData, null, 2)}

      You can view all registrations in your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:7777'}/dashboard

      This email was sent by BlessBox. If you have any questions, please contact our support team.
    `
  }
}

export const emailService = new EmailService()
