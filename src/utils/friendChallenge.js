/**
 * Friend Challenge encode/decode utility.
 *
 * Encodes challenge parameters (topic, difficulty, seed, score) into a
 * compact, URL-safe base64url string (≤30 chars) for sharing.
 *
 * Bit layout (33 bits total, packed into 5 bytes with 7 bits padding):
 *   topic:      3 bits  (0-5)
 *   difficulty:  2 bits  (0-2)
 *   seed:       16 bits (0-65535)
 *   score:      12 bits (0-4095)
 *   padding:     7 bits (zeros)
 *
 * 5 bytes → base64url → 8 characters (well under 30 char limit)
 */

// Topic name ↔ 3-bit index mapping
const TOPIC_TO_INDEX = {
  linear: 0,
  quadratic: 1,
  expExpr: 2,
  expEqn: 3,
  inequality: 4,
  simultaneous: 5,
};

const INDEX_TO_TOPIC = Object.fromEntries(
  Object.entries(TOPIC_TO_INDEX).map(([k, v]) => [v, k])
);

// Difficulty name ↔ 2-bit index mapping
const DIFFICULTY_TO_INDEX = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const INDEX_TO_DIFFICULTY = Object.fromEntries(
  Object.entries(DIFFICULTY_TO_INDEX).map(([k, v]) => [v, k])
);

// Base64url alphabet (RFC 4648 §5)
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode a byte array to base64url string (no padding).
 * @param {number[]} bytes
 * @returns {string}
 */
function bytesToBase64url(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += BASE64URL_CHARS[(b0 >> 2) & 0x3f];
    result += BASE64URL_CHARS[((b0 << 4) | (b1 >> 4)) & 0x3f];

    if (i + 1 < bytes.length) {
      result += BASE64URL_CHARS[((b1 << 2) | (b2 >> 6)) & 0x3f];
    }
    if (i + 2 < bytes.length) {
      result += BASE64URL_CHARS[b2 & 0x3f];
    }
  }
  return result;
}

/**
 * Decode a base64url string (no padding) to byte array.
 * @param {string} str
 * @returns {number[]|null} Returns null if invalid characters found
 */
function base64urlToBytes(str) {
  const bytes = [];
  const lookup = {};
  for (let i = 0; i < BASE64URL_CHARS.length; i++) {
    lookup[BASE64URL_CHARS[i]] = i;
  }

  for (let i = 0; i < str.length; i += 4) {
    const c0 = lookup[str[i]];
    const c1 = i + 1 < str.length ? lookup[str[i + 1]] : 0;
    const c2 = i + 2 < str.length ? lookup[str[i + 2]] : 0;
    const c3 = i + 3 < str.length ? lookup[str[i + 3]] : 0;

    if (c0 === undefined || (i + 1 < str.length && c1 === undefined) ||
        (i + 2 < str.length && c2 === undefined) ||
        (i + 3 < str.length && c3 === undefined)) {
      return null;
    }

    bytes.push(((c0 << 2) | (c1 >> 4)) & 0xff);
    if (i + 2 < str.length) {
      bytes.push(((c1 << 4) | (c2 >> 2)) & 0xff);
    }
    if (i + 3 < str.length) {
      bytes.push(((c2 << 6) | c3) & 0xff);
    }
  }
  return bytes;
}

/**
 * Encode challenge parameters into a URL-safe code (≤30 chars).
 * @param {{ topic: string, difficulty: string, seed: number, score: number }} params
 * @returns {string} Challenge code
 */
export function encodeChallenge(params) {
  const { topic, difficulty, seed, score } = params;

  const topicIndex = TOPIC_TO_INDEX[topic];
  const diffIndex = DIFFICULTY_TO_INDEX[difficulty];

  if (topicIndex === undefined || diffIndex === undefined) {
    return '';
  }

  // Clamp values to valid ranges
  const clampedSeed = Math.max(0, Math.min(65535, Math.floor(seed))) & 0xffff;
  const clampedScore = Math.max(0, Math.min(4095, Math.floor(score))) & 0xfff;

  // Pack 33 bits into 5 bytes (40 bits, 7 bits padding at the end)
  // Bit layout: [topic:3][diff:2][seed:16][score:12][padding:7]
  //
  // Byte 0: topic(3) + diff(2) + seed_high(3)
  // Byte 1: seed_mid(8)
  // Byte 2: seed_low(5) + score_high(3)
  // Byte 3: score_mid(8)
  // Byte 4: score_low(1) + padding(7)

  const byte0 = ((topicIndex & 0x07) << 5) | ((diffIndex & 0x03) << 3) | ((clampedSeed >> 13) & 0x07);
  const byte1 = (clampedSeed >> 5) & 0xff;
  const byte2 = ((clampedSeed & 0x1f) << 3) | ((clampedScore >> 9) & 0x07);
  const byte3 = (clampedScore >> 1) & 0xff;
  const byte4 = ((clampedScore & 0x01) << 7);

  const bytes = [byte0, byte1, byte2, byte3, byte4];
  return bytesToBase64url(bytes);
}

/**
 * Decode a challenge code back into parameters.
 * @param {string} code - The challenge code string
 * @returns {{ topic: string, difficulty: string, seed: number, score: number } | null}
 *   Returns null if code is invalid/corrupted
 */
export function decodeChallenge(code) {
  if (!isValidChallengeCode(code)) {
    return null;
  }

  const bytes = base64urlToBytes(code);
  if (!bytes || bytes.length < 5) {
    return null;
  }

  // Unpack bits from 5 bytes
  const topicIndex = (bytes[0] >> 5) & 0x07;
  const diffIndex = (bytes[0] >> 3) & 0x03;
  const seed = ((bytes[0] & 0x07) << 13) | (bytes[1] << 5) | ((bytes[2] >> 3) & 0x1f);
  const score = ((bytes[2] & 0x07) << 9) | (bytes[3] << 1) | ((bytes[4] >> 7) & 0x01);

  const topic = INDEX_TO_TOPIC[topicIndex];
  const difficulty = INDEX_TO_DIFFICULTY[diffIndex];

  if (topic === undefined || difficulty === undefined) {
    return null;
  }

  // Validate ranges
  if (seed < 0 || seed > 65535 || score < 0 || score > 4095) {
    return null;
  }

  return { topic, difficulty, seed, score };
}

/**
 * Validate that a challenge code is structurally valid.
 * Checks: string type, correct length, only URL-safe base64 chars.
 * @param {string} code
 * @returns {boolean}
 */
export function isValidChallengeCode(code) {
  if (typeof code !== 'string') {
    return false;
  }

  // 5 bytes → base64url produces exactly 7 characters (ceil(5*4/3) = 7 with no padding)
  // Actually: 5 bytes = 3+2 bytes. First 3 bytes → 4 chars, remaining 2 bytes → 3 chars = 7 total
  if (code.length !== 7) {
    return false;
  }

  // Check only URL-safe base64 characters
  const validPattern = /^[A-Za-z0-9_-]+$/;
  return validPattern.test(code);
}
