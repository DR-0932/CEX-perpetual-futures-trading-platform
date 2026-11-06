"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Separator = Separator;
const separator_1 = require("@base-ui/react/separator");
const utils_1 = require("@/lib/utils");
function Separator({ className, orientation = "horizontal", ...props }) {
    return (<separator_1.Separator data-slot="separator" orientation={orientation} className={(0, utils_1.cn)("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className)} {...props}/>);
}
