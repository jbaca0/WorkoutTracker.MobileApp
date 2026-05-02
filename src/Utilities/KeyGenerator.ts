class KeyGenerator {
    public static GenerateKey(): number {
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        return randomValues[0];
    }
}
export default KeyGenerator;
