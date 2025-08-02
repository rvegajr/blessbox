import type { APIRoute } from 'astro';
import { sendEmail, createContactEmailTemplate } from '../../utils/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name')?.toString() || '';
    const email = formData.get('work-email')?.toString() || formData.get('email')?.toString() || '';
    const company = formData.get('company')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: name, email, and message are required.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email format.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create email template
    const { html, text } = createContactEmailTemplate({
      name,
      email,
      company,
      message,
    });

    // Send email
    const emailSent = await sendEmail({
      from: `"BlessBox Contact Form" <contact@yolovibecodebootcamp.com>`,
      to: 'contact@yolovibecodebootcamp.com',
      subject: `New BlessBox Contact: ${name}${company ? ` from ${company}` : ''}`,
      html,
      text,
    });

    if (emailSent) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Thank you for your message! We\'ll get back to you soon.',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send message. Please try again later.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error. Please try again later.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};