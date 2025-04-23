import { createClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Use the same check_mfa() function as RLS policies
      const { data: mfaCheck, error: mfaError } =
        await supabase.rpc('check_mfa');

      if (mfaError) throw mfaError;

      // If MFA check fails and we're not already on the verify page
      if (!mfaCheck && !request.nextUrl.pathname.startsWith('/login/verify')) {
        return NextResponse.redirect(new URL('/login/verify', request.url));
      }

      const redirectToChat = request.nextUrl.pathname === '/';

      if (redirectToChat) {
        return NextResponse.redirect(new URL(`/c`, request.url));
      }

      // Check if the URL matches either /[workspaceid]/c(hat) or /[workspaceid]/c(hat)/[chatid]
      const workspacePattern = /^\/[^\/]+\/(c|chat)(\/[^\/]+)?$/;
      if (workspacePattern.test(request.nextUrl.pathname)) {
        const pathParts = request.nextUrl.pathname.split('/');
        // If chat ID exists, preserve it in the redirect
        const chatId = pathParts.length === 4 ? pathParts[3] : '';
        return NextResponse.redirect(
          new URL(chatId ? `/c/${chatId}` : '/c', request.url),
        );
      }
    }

    return response;
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next|auth).*)',
};
