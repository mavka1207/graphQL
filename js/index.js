import { setupLoginFlow } from './loginFlow.js';
import { checkExistingToken } from './tokenCheck.js';

document.addEventListener("DOMContentLoaded", () => {
    checkExistingToken();
    setupLoginFlow();
});