// src/app/lib/errorHandler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Friendly error messages mapping common cryptic database & system codes to human-readable strings.
 */
const ERROR_CODE_MAP: Record<string, { message: string; status: number }> = {
  ER_DUP_ENTRY: {
    message: 'This item is already saved or already exists in this folder.',
    status: 409,
  },
  ER_NO_REFERENCED_ROW_2: {
    message: 'The requested author or associated item could not be found.',
    status: 404,
  },
  ECONNREFUSED: {
    message: 'Database connection is temporarily unavailable. Please try again in a moment.',
    status: 503,
  },
  ER_ACCESS_DENIED_ERROR: {
    message: 'Database authentication failed. Please contact support.',
    status: 500,
  },
  UNAUTHORIZED: {
    message: 'Authentication required. Please sign in to continue.',
    status: 401,
  },
  FORBIDDEN: {
    message: 'You do not have permission to perform this action.',
    status: 403,
  },
  NOT_FOUND: {
    message: 'The requested resource could not be found.',
    status: 404,
  },
  VALIDATION_ERROR: {
    message: 'Please review and correct the errors in the submitted form.',
    status: 400,
  },
};

/**
 * Translates any error (Zod, MySQL, standard Error, string) into a friendly, standardized NextResponse.
 */
export function handleErrorResponse(error: unknown): NextResponse<ApiError> {
  console.error('[API Error caught]:', error);

  // 1. Zod Validation Error
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    const friendlyFirstMessage = formattedErrors[0]?.message || 'Invalid form input.';

    return NextResponse.json(
      {
        success: false,
        error: {
          message: friendlyFirstMessage,
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
        },
      },
      { status: 400 }
    );
  }

  // 2. MySQL Error (checks errno or code)
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code || '';
    const mapped = ERROR_CODE_MAP[code];

    if (mapped) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: mapped.message,
            code,
          },
        },
        { status: mapped.status }
      );
    }
  }

  // 3. Known custom errors with status
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;
    const status = (error as { status?: number }).status || 500;
    const code = (error as { code?: string }).code || 'SERVER_ERROR';

    // Mask raw stack traces or internal query errors
    const isInternalQuery = message.toLowerCase().includes('sql') || message.toLowerCase().includes('select') || message.toLowerCase().includes('insert');
    const safeMessage = isInternalQuery
      ? 'An unexpected database error occurred. Please try again.'
      : message;

    return NextResponse.json(
      {
        success: false,
        error: {
          message: safeMessage,
          code,
        },
      },
      { status }
    );
  }

  // 4. Fallback for completely unexpected errors
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Something went wrong while processing your request. Please try again.',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * Standardized helper for creating successful JSON responses.
 */
export function handleSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}
