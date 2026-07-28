import * as protobuf from "protobufjs";
import { Algorithm, Digits, ParsedAccount } from "./otp";

export class OtpParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OtpParseError";
    }
}

interface MigrationOtpParameter {
    secret: Uint8Array;
    name: string;
    issuer: string;
    algorithm: number;
    digits: number;
    type: number;
}

interface MigrationPayload {
    otpParameters: MigrationOtpParameter[];
    version: number;
    batchSize: number;
    batchIndex: number;
    batchId: number;
}

export interface GoogleMigrationResult {
    accounts: ParsedAccount[];
    skipped: number;
    batchIndex: number;
    batchSize: number;
    batchId: number;
}

let migrationRoot: protobuf.Root | null = null;

function getMigrationPayloadType(): protobuf.Type {
    if (!migrationRoot) {
        migrationRoot = protobuf.Root.fromJSON({
            nested: {
                MigrationPayload: {
                    fields: {
                        otpParameters: {
                            type: "OtpParameters",
                            rule: "repeated",
                            id: 1,
                        },
                        version: {
                            type: "int32",
                            id: 2,
                        },
                        batchSize: {
                            type: "int32",
                            id: 3,
                        },
                        batchIndex: {
                            type: "int32",
                            id: 4,
                        },
                        batchId: {
                            type: "int32",
                            id: 5,
                        },
                    },
                },

                OtpParameters: {
                    fields: {
                        secret: {
                            type: "bytes",
                            id: 1,
                        },
                        name: {
                            type: "string",
                            id: 2,
                        },
                        issuer: {
                            type: "string",
                            id: 3,
                        },
                        algorithm: {
                            type: "Algorithm",
                            id: 4,
                        },
                        digits: {
                            type: "DigitCount",
                            id: 5,
                        },
                        type: {
                            type: "OtpType",
                            id: 6,
                        },
                    },
                },

                Algorithm: {
                    values: {
                        ALGORITHM_UNSPECIFIED: 0,
                        SHA1: 1,
                        SHA256: 2,
                        SHA512: 3,
                        MD5: 4,
                    },
                },

                DigitCount: {
                    values: {
                        DIGIT_COUNT_UNSPECIFIED: 0,
                        SIX: 1,
                        EIGHT: 2,
                    },
                },

                OtpType: {
                    values: {
                        OTP_TYPE_UNSPECIFIED: 0,
                        HOTP: 1,
                        TOTP: 2,
                    },
                },
            },
        });
    }

    return migrationRoot.lookupType("MigrationPayload");
}

export function parseGoogleMigrationQr(
    raw: string,
): GoogleMigrationResult {
    try {
        const value = raw.trim();

        if (!value) {
            throw new OtpParseError(
                "Google Authenticator migration QR code is empty.",
            );
        }

        if (!value.startsWith("otpauth-migration://")) {
            throw new OtpParseError(
                "QR code is not a Google Authenticator migration URI.",
            );
        }

        let url: URL;

        try {
            url = new URL(value);
        } catch {
            throw new OtpParseError(
                "Invalid Google Authenticator migration URI.",
            );
        }

        if (
            url.protocol !== "otpauth-migration:" ||
            url.hostname !== "offline"
        ) {
            throw new OtpParseError(
                "Invalid Google Authenticator migration URI.",
            );
        }

        const encodedData = url.searchParams.get("data");

        if (!encodedData) {
            throw new OtpParseError(
                "Migration QR code does not contain a data parameter.",
            );
        }

        let binary: string;

        try {
            binary = atob(encodedData);
        } catch {
            throw new OtpParseError(
                "Invalid Base64 data in migration QR code.",
            );
        }

        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const MigrationPayload = getMigrationPayloadType();

        let decoded: protobuf.Message;

        try {
            decoded = MigrationPayload.decode(bytes);
        } catch {
            throw new OtpParseError(
                "Could not decode Google Authenticator migration data.",
            );
        }

        const payload =
            MigrationPayload.toObject(decoded, {
                longs: Number,
                enums: Number,
                bytes: Uint8Array,
                defaults: true,
            }) as unknown as MigrationPayload;

        if (
            !payload.otpParameters ||
            payload.otpParameters.length === 0
        ) {
            throw new OtpParseError(
                "Migration QR code does not contain any accounts.",
            );
        }

        const accounts: ParsedAccount[] = [];
        let skipped = 0;

        for (const parameter of payload.otpParameters) {
            if (parameter.type !== 2) {
                skipped += 1;
                continue;
            }

            if (!parameter.secret || parameter.secret.length === 0) {
                skipped += 1;
                continue;
            }

            const secret = bytesToBase32(parameter.secret);

            if (!secret) {
                skipped += 1;
                continue;
            }

            let algorithm: ParsedAccount["algorithm"];

            switch (parameter.algorithm) {
                case 0:
                case 1:
                    algorithm = "SHA1";
                    break;

                case 2:
                    algorithm = "SHA256";
                    break;

                case 3:
                    algorithm = "SHA512";
                    break;

                default:
                    skipped += 1;
                    continue;
            }

            let digits: Digits;

            switch (parameter.digits) {
                case 0:
                case 1:
                    digits = 6;
                    break;

                case 2:
                    digits = 8;
                    break;

                default:
                    skipped += 1;
                    continue;
            }

            const period = 30;

            const { issuer, username } = parseMigrationName(
                parameter.name,
                parameter.issuer,
            );

            const name = issuer || username || "Unknown";

            accounts.push({
                name,
                username: issuer ? username : "",
                secret,
                issuer,
                algorithm,
                digits,
                period,
            });
        }

        if (accounts.length === 0) {
            throw new OtpParseError(
                "Migration QR code contained no supported TOTP accounts.",
            );
        }

        return {
            accounts,
            skipped,
            batchIndex: payload.batchIndex,
            batchSize: payload.batchSize,
            batchId: payload.batchId,
        };
    } catch (error) {
        if (error instanceof OtpParseError) {
            throw error;
        }

        throw new OtpParseError(
            error instanceof Error
                ? error.message
                : "Failed to parse Google Authenticator migration QR code.",
        );
    }
}

function bytesToBase32(bytes: Uint8Array): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    let result = "";
    let buffer = 0;
    let bits = 0;

    for (const byte of bytes) {
        buffer = (buffer << 8) | byte;
        bits += 8;

        while (bits >= 5) {
            bits -= 5;

            result += alphabet[
                (buffer >> bits) & 0x1f
            ];
        }
    }

    if (bits > 0) {
        result += alphabet[
            (buffer << (5 - bits)) & 0x1f
        ];
    }

    return result;
}

function parseMigrationName(
    name: string,
    migrationIssuer: string,
): {
    issuer: string;
    username: string;
} {
    const trimmedName = name.trim();
    const trimmedIssuer = migrationIssuer.trim();

    if (trimmedIssuer) {
        const prefix = `${trimmedIssuer}:`;

        if (trimmedName.startsWith(prefix)) {
            return {
                issuer: trimmedIssuer,
                username: trimmedName.slice(prefix.length),
            };
        }

        return {
            issuer: trimmedIssuer,
            username: trimmedName,
        };
    }

    const separatorIndex = trimmedName.indexOf(":");

    if (separatorIndex > 0) {
        return {
            issuer: trimmedName.slice(0, separatorIndex),
            username: trimmedName.slice(separatorIndex + 1),
        };
    }

    return {
        issuer: "",
        username: trimmedName,
    };
}

// Google Authenticator splits large exports across multiple QR codes; this
// keeps each generated code within the size/density it can reliably scan.
const MAX_ACCOUNTS_PER_QR = 10;

const MIGRATION_ALGORITHM: Record<Algorithm, number> = {
    SHA1: 1,
    SHA256: 2,
    SHA512: 3,
};

const MIGRATION_DIGITS: Record<Digits, number> = {
    6: 1,
    8: 2,
};

function base32ToBytes(base32: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const clean = base32.trim().toUpperCase().replace(/=+$/, "");

    const bytes: number[] = [];
    let buffer = 0;
    let bits = 0;

    for (const char of clean) {
        const value = alphabet.indexOf(char);

        if (value === -1) {
            throw new OtpParseError(
                `Secret contains an invalid Base32 character: "${char}".`,
            );
        }

        buffer = (buffer << 5) | value;
        bits += 5;

        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }

    return new Uint8Array(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function randomBatchId(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff;
}

/**
 * Encodes accounts as `otpauth-migration://` URIs that the Google
 * Authenticator app's own "Scan a QR code" import can read. Returns one URI
 * per QR code — more than one when there are enough accounts that Google
 * Authenticator would normally split the export across multiple codes.
 */
export function buildGoogleMigrationQr(accounts: ParsedAccount[]): string[] {
    if (accounts.length === 0) {
        throw new OtpParseError("There are no accounts to export.");
    }

    const MigrationPayload = getMigrationPayloadType();

    const chunks: ParsedAccount[][] = [];

    for (let i = 0; i < accounts.length; i += MAX_ACCOUNTS_PER_QR) {
        chunks.push(accounts.slice(i, i + MAX_ACCOUNTS_PER_QR));
    }

    const batchId = randomBatchId();

    return chunks.map((chunk, batchIndex) => {
        const otpParameters: MigrationOtpParameter[] = chunk.map(
            (account) => ({
                secret: base32ToBytes(account.secret),
                name: account.username
                    ? `${account.name}:${account.username}`
                    : account.name,
                issuer: account.name,
                algorithm: MIGRATION_ALGORITHM[account.algorithm],
                digits: MIGRATION_DIGITS[account.digits],
                type: 2,
            }),
        );

        const message = MigrationPayload.create({
            otpParameters,
            version: 1,
            batchSize: chunks.length,
            batchIndex,
            batchId,
        });

        const bytes = MigrationPayload.encode(message).finish();
        const base64 = bytesToBase64(bytes);

        return `otpauth-migration://offline?data=${encodeURIComponent(base64)}`;
    });
}