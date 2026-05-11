import { AdminLoginClient } from './admin-login-client';

export const metadata = {
  title: 'Admin Login | BlessBox',
  description: 'Super-admin authentication',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Super-admin access only
          </p>
        </div>
        <AdminLoginClient />
      </div>
    </div>
  );
}
