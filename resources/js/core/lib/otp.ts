import * as OTPAuth from "otpauth";

export interface ParsedAccount {
    name: string;
    username: string;
    secret: string;
    algorithm: "SHA1" | "SHA256" | "SHA512";
    digits: number;
    period: number;
}

export class OtpParseError extends Error {}

export function parseOtpAuthUri(raw: string): ParsedAccount {
    const trimmed = raw.trim();

    if (!trimmed.startsWith("otpauth://")) {
        throw new OtpParseError("That QR code isn't a 2FA setup code.");
    }

    let parsed: OTPAuth.HOTP | OTPAuth.TOTP;

    try {
        parsed = OTPAuth.URI.parse(trimmed);
    } catch {
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

    return {
        name: parsed.issuer || parsed.label || "Unknown",
        username: parsed.issuer ? parsed.label : "",
        secret: parsed.secret.base32,
        algorithm: parsed.algorithm as ParsedAccount["algorithm"],
        digits: parsed.digits,
        period: parsed.period,
    };
}