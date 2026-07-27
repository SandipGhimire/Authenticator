import * as OTPAuth from "otpauth";

export const SUPPORTED_DIGITS = [6, 8] as const;
export type Digits = (typeof SUPPORTED_DIGITS)[number];

export const SUPPORTED_ALGORITHMS = ["SHA1", "SHA256", "SHA512"] as const;
export type Algorithm = (typeof SUPPORTED_ALGORITHMS)[number];

export interface ParsedAccount {
    name: string;
    username: string;
    secret: string;
    algorithm: Algorithm;
    digits: Digits;
    period: number;
}

export class OtpParseError extends Error {}

const stripSecretFormatting = (uri: string): string =>
    uri.replace(
        /([?&]secret=)([^&]*)/i,
        (_match, prefix, value) => prefix + value.replace(/(%20|\+|-)/g, ""),
    );

function assertSupportedAlgorithm(value: string): asserts value is Algorithm {
    if (!(SUPPORTED_ALGORITHMS as readonly string[]).includes(value)) {
        throw new OtpParseError(
            `Unsupported hash algorithm "${value}" — this app supports SHA1, SHA256, and SHA512.`,
        );
    }
}

function assertSupportedDigits(value: number): asserts value is Digits {
    if (!(SUPPORTED_DIGITS as readonly number[]).includes(value)) {
        throw new OtpParseError(
            `Unsupported code length (${value} digits) — this app supports 6 or 8-digit codes.`,
        );
    }
}

export function parseOtpAuthUri(raw: string): ParsedAccount {
    const trimmed = raw.trim();

    if (!trimmed.startsWith("otpauth://")) {
        throw new OtpParseError("That QR code isn't a 2FA setup code.");
    }

    let parsed: OTPAuth.HOTP | OTPAuth.TOTP;

    try {
        parsed = OTPAuth.URI.parse(stripSecretFormatting(trimmed));
    } catch (e) {
        if (e instanceof Error && /secret/i.test(e.message)) {
            throw new OtpParseError(
                "This QR code's secret key isn't valid Base32 (only letters A-Z and digits 2-7 are allowed) and can't be read.",
            );
        }

        throw new OtpParseError(
            "This QR code's authentication data is malformed and can't be read.",
        );
    }

    if (!(parsed instanceof OTPAuth.TOTP)) {
        throw new OtpParseError(
            "Counter-based (HOTP) codes aren't supported — only time-based (TOTP) codes.",
        );
    }

    if (!parsed.secret || parsed.secret.base32.length === 0) {
        throw new OtpParseError("This code is missing its secret key.");
    }

    assertSupportedAlgorithm(parsed.algorithm);
    assertSupportedDigits(parsed.digits);

    return {
        name: parsed.issuer || parsed.label || "Unknown",
        username: parsed.issuer ? parsed.label : "",
        secret: parsed.secret.base32,
        algorithm: parsed.algorithm as ParsedAccount["algorithm"],
        digits: parsed.digits,
        period: parsed.period,
    };
}

export function buildManualAccount(input: {
    name: string;
    username: string;
    secret: string;
    algorithm?: Algorithm;
    digits?: Digits;
    period?: number;
}): ParsedAccount {
    const secret = input.secret.trim().replace(/\s/g, "").toUpperCase();
    const algorithm = input.algorithm ?? "SHA1";
    const digits = input.digits ?? 6;
    const period = input.period ?? 30;

    assertSupportedAlgorithm(algorithm);
    assertSupportedDigits(digits);

    if (!Number.isInteger(period) || period < 1) {
        throw new OtpParseError(
            "Refresh interval must be a positive whole number of seconds.",
        );
    }

    try {
        new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret),
            algorithm,
            digits,
            period,
        });
    } catch {
        throw new OtpParseError(
            "That secret key doesn't look right — it should be a Base32 code (letters A–Z and digits 2–7).",
        );
    }

    return {
        name: input.name.trim(),
        username: input.username.trim(),
        secret,
        algorithm,
        digits,
        period,
    };
}

export function generateCode(account: ParsedAccount): string {
    const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(account.secret),
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
    });

    const code = totp.generate();
    const half = account.digits / 2;

    return `${code.slice(0, half)} ${code.slice(half)}`;
}

export function remainingSeconds(period: number): number {
    const epoch = Math.floor(Date.now() / 1000);
    return period - (epoch % period);
}
