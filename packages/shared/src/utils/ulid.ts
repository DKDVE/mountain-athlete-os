const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeAt(index: number): string {
  const char = ENCODING[index];
  if (!char) throw new Error(`Invalid encoding index: ${String(index)}`);
  return char;
}

/** ponytail: Crockford base32 ULID, no external dep; upgrade path = `ulid` package if perf matters */
export function ulid(seedTime?: number): string {
  const time = seedTime ?? Date.now();
  let t = time;
  let timeChars = '';
  for (let i = 0; i < TIME_LEN; i++) {
    timeChars = encodeAt(t % ENCODING_LEN) + timeChars;
    t = Math.floor(t / ENCODING_LEN);
  }

  let randomChars = '';
  for (let i = 0; i < RANDOM_LEN; i++) {
    randomChars += encodeAt(Math.floor(Math.random() * ENCODING_LEN));
  }

  return timeChars + randomChars;
}

export function isUlid(value: string): boolean {
  if (value.length !== TIME_LEN + RANDOM_LEN) return false;
  for (const char of value) {
    if (!ENCODING.includes(char)) return false;
  }
  return true;
}
