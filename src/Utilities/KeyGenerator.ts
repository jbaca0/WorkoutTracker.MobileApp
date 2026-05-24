class KeyGenerator {
    public static GenerateKey(): number {
        return Math.floor(Math.random() * 2 ** 32);
    }
}
export default KeyGenerator;
