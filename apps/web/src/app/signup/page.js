"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const signup_form_1 = require("@/components/signup-form");
function Page() {
    return (<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <signup_form_1.SignupForm />
      </div>
    </div>);
}
