// 🎉 JOYFUL REGISTRATION ENDPOINT - Now with REAL database power! ✨
import type { APIRoute } from 'astro';
import { OrganizationRepository } from '../../../implementations/repositories/OrganizationRepository';
import { AuthenticationService } from '../../../implementations/auth/AuthenticationService';
import { withSecurity } from '../../../middleware/security';
import type { UserRegistrationData } from '../../../interfaces/auth/IAuthService';

const organizationRepo = new OrganizationRepository();
const authService = new AuthenticationService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const {
      email,
      password,
      organizationName,
      eventName,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
    }: UserRegistrationData = body;

    // Validate required fields
    if (!email || !password || !organizationName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email, password, and organization name are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    const passwordValidation = passwordService.validateStrength(password);
    if (!passwordValidation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password does not meet security requirements',
          feedback: passwordValidation.feedback,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if organization with this email already exists
    const existingOrg = await organizationRepo.findByEmail(email);
    if (existingOrg) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An organization with this email already exists',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🎊 Create organization with OPTIONAL password! 
    // Passwordless is the FUTURE! ✨
    const organizationData = {
      name: organizationName,
      eventName,
      contactEmail: email,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
      // Password will be set separately if provided
    };

    const organization = await organizationRepo.create(organizationData);

    // 🔐 Set password if provided (but it's totally optional!)
    if (password) {
      await authService.setPassword(organization.id, password);
      console.log(`🔑 Password set for ${email}! But passwordless is cooler! 😉`);
    } else {
      console.log(`🚀 PASSWORDLESS registration for ${email}! Welcome to the future! ✨`);
    }

    // Generate tokens
    const tokenPayload = {
      userId: organization.id,
      email: organization.contactEmail,
      organizationId: organization.id,
    };

    const accessToken = tokenService.generateAccessToken(tokenPayload);
    const refreshToken = tokenService.generateRefreshToken(organization.id);

    // Create user object for response
    const user = {
      id: organization.id,
      email: organization.contactEmail,
      organizationId: organization.id,
      organizationName: organization.name,
      emailVerified: organization.emailVerified,
      createdAt: organization.createdAt,
    };

    console.log(`✅ User registered successfully: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user,
        token: accessToken,
        refreshToken,
        message: 'Registration successful! Please verify your email to complete setup.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'An organization with this email or domain already exists',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Registration failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  });
};