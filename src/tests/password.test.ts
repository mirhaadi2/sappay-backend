import { comparePassword, hashPassword } from "../utils/password";

describe("password utils", () => {
  it("hashes and compares successfully", async () => {
    const plain = "super-secret";
    const hashed = await hashPassword(plain);

    expect(await comparePassword(plain, hashed)).toBe(true);
    expect(await comparePassword("wrong", hashed)).toBe(false);
  });
});
