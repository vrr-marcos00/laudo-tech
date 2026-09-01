import { NextResponse, type NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isAuth = request.nextUrl.pathname.startsWith('/login')

  if (!token && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (token && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
