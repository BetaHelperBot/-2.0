import test from "node:test";
import assert from "node:assert/strict";
import {
  encryptText,
  decryptText,
  calculatePasswordEntropy,
  auditVaultSecurity,
} from "./cryptoVault.ts";

test("CryptoVault: encrypts and successfully decrypts with correct key", async () => {
  const secret = "SuperSecretPassword123!";
  const key = "my_master_pin_or_passphrase";

  const encrypted = await encryptText(secret, key);
  assert.ok(encrypted.startsWith("heybo_enc_v1:"));
  assert.notEqual(encrypted, secret);

  const decrypted = await decryptText(encrypted, key);
  assert.equal(decrypted, secret);
});

test("CryptoVault: decryption with wrong key does not leak plaintext", async () => {
  const secret = "TopSecretCardPin9999";
  const key = "correct_key";
  const wrongKey = "wrong_attacker_key";

  const encrypted = await encryptText(secret, key);
  const attemptedDecryption = await decryptText(encrypted, wrongKey);
  assert.notEqual(attemptedDecryption, secret);
});

test("CryptoVault: calculatePasswordEntropy evaluates entropy bits and strength", () => {
  const weak = calculatePasswordEntropy("123456");
  assert.equal(weak.strength, "weak");
  assert.ok(weak.bits < 36);

  const strong = calculatePasswordEntropy("K9#mQ2$zL8!vR4@x");
  assert.ok(strong.strength === "strong" || strong.strength === "extreme");
  assert.ok(strong.bits >= 55);
});

test("CryptoVault: auditVaultSecurity identifies reused duplicate passwords and weak passwords", () => {
  const entries = [
    { id: "1", title: "Steam", password: "commonPassword123" },
    { id: "2", title: "VK", password: "commonPassword123" }, // duplicate!
    { id: "3", title: "Email", password: "123" }, // weak
    { id: "4", title: "Bank", password: "X7#qL9$mR2!vK4@z" }, // strong
  ];

  const audit = auditVaultSecurity(entries);
  assert.equal(audit.totalPasswords, 4);
  assert.equal(audit.duplicateCount, 1);
  assert.equal(audit.weakCount, 1);
  assert.ok(audit.overallScorePercent < 100);
});
