class LoginResult {
    public success: boolean;
    public errorMessage?: string;

    constructor(success: boolean) {
        this.success = success;
    }
}
export default LoginResult;
